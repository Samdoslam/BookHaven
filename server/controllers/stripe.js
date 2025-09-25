import User from "../models/user.js";
import Stripe from "stripe";
import queryString from "query-string";
import Hotel from "../models/hotel.js";
import Order from "../models/order.js";

const stripe = Stripe(process.env.STRIPE_SECRET);

// Create or retrieve Stripe account and onboarding link
export const createConnectAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    if (!user) return res.status(404).send("User not found");

    // Create Stripe account if missing
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({ type: "express" });
      user.stripe_account_id = account.id;
      await user.save();
    }

    // Create account onboarding link
    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: "account_onboarding",
    });

    accountLink = Object.assign(accountLink, {
      "stripe_user[email]": user.email || undefined,
    });

    const link = `${accountLink.url}?${queryString.stringify(accountLink)}`;
    res.send(link);
  } catch (err) {
    console.error("CREATE CONNECT ACCOUNT ERR", err);
    res.status(500).send("Server error");
  }
};

// Update payout delay days
const updateDelayDays = async (accountId) => {
  return await stripe.accounts.update(accountId, {
    settings: { payouts: { schedule: { delay_days: 7 } } },
  });
};

// Get Stripe account status
export const getAccountStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    if (!user?.stripe_account_id)
      return res.status(400).send("Stripe account missing");

    const account = await stripe.accounts.retrieve(user.stripe_account_id);
    const updatedAccount = await updateDelayDays(account.id);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { stripe_seller: updatedAccount },
      { new: true }
    )
      .select("-password")
      .exec();

    res.json(updatedUser);
  } catch (err) {
    console.error("GET ACCOUNT STATUS ERR", err);
    res.status(500).send("Server error");
  }
};

// Get Stripe account balance
export const getAccountBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    if (!user?.stripe_account_id)
      return res.status(400).send("Stripe account missing");

    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripe_account_id,
    });
    res.json(balance);
  } catch (err) {
    console.error("GET ACCOUNT BALANCE ERR", err);
    res.status(500).send("Server error");
  }
};

// Generate Stripe payout settings login link
export const payoutSetting = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    if (!user?.stripe_account_id)
      return res.status(400).send("Stripe account missing");

    const loginLink = await stripe.accounts.createLoginLink(
      user.stripe_account_id,
      {
        redirect_url: process.env.STRIPE_SETTING_REDIRECT_URL,
      }
    );

    res.json(loginLink);
  } catch (err) {
    console.error("PAYOUT SETTING ERR", err);
    res.status(500).send("Server error");
  }
};

// Create Stripe checkout session
export const stripeSessionId = async (req, res) => {
  try {
    const { hotelId } = req.body;
    const item = await Hotel.findById(hotelId).populate("postedBy").exec();
    if (!item) return res.status(404).send("Hotel not found");

    const amount = Math.round(item.price * 100); // in cents
    const fee = Math.round((item.price * 20) / 100); // 20% fee in dollars

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: item.title },
            unit_amount: amount, // in cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: fee * 100, // in cents
        transfer_data: { destination: item.postedBy.stripe_account_id },
      },
      mode: "payment",
      success_url: `${process.env.STRIPE_SUCCESS_URL}/${item._id}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

    // console.log("Sesssion ======>", session);

    await User.findByIdAndUpdate(req.user._id, {
      stripeSession: session,
    }).exec();

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error("STRIPE SESSION ERR", err);
    res.status(500).send("Server error");
  }
};

// Handle successful Stripe payment
export const stripeSuccess = async (req, res) => {
  try {
    const { hotelId } = req.body;
    const user = await User.findById(req.user._id).exec();
    if (!user?.stripeSession)
      return res.status(400).send("No Stripe session found");

    const session = await stripe.checkout.sessions.retrieve(
      user.stripeSession.id
    );

    if (session.payment_status === "paid") {
      const orderExist = await Order.findOne({
        "session.id": session.id,
      }).exec();

      if (!orderExist) {
        await new Order({
          hotel: hotelId,
          session,
          orderedBy: user._id,
        }).save();
        await User.findByIdAndUpdate(user._id, { $set: { stripeSession: {} } });
      }

      res.json({ success: true });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Payment not completed" });
    }
  } catch (err) {
    console.error("STRIPE SUCCESS ERR", err);
    res.status(500).send("Server error");
  }
};
