import Hotel from "../models/hotel.js";
import Order from "../models/order.js";
import fs from "fs";

// Create a new hotel
export const create = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).send("Unauthorized");

    const fields = req.fields;
    const files = req.files;

    const hotel = new Hotel(fields);
    hotel.postedBy = req.user._id;

    // handle image
    if (files?.image) {
      hotel.image.data = fs.readFileSync(files.image.path);
      hotel.image.contentType = files.image.type;
    }

    const savedHotel = await hotel.save();
    res.json(savedHotel);
  } catch (err) {
    console.error("CREATE HOTEL ERROR:", err);
    res.status(400).json({ error: err.message });
  }
};

// Get all hotels
export const hotels = async (req, res) => {
  try {
    const all = await Hotel.find({})
      .limit(24)
      .select("-image.data")
      .populate("postedBy", "_id name")
      .exec();
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Serve hotel image
export const image = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId).exec();
    if (hotel?.image?.data) {
      res.set("Content-Type", hotel.image.contentType);
      return res.send(hotel.image.data);
    }
    res.status(404).send("No image found");
  } catch (err) {
    console.error(err);
    res.status(400).send("Error fetching image");
  }
};

// Hotels posted by the logged-in user
export const sellerHotels = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).send("Unauthorized");

    const all = await Hotel.find({ postedBy: req.user._id })
      .select("-image.data")
      .populate("postedBy", "_id name")
      .exec();
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Remove hotel
export const remove = async (req, res) => {
  try {
    const removed = await Hotel.findByIdAndDelete(req.params.hotelId)
      .select("-image.data")
      .exec();
    res.json(removed);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Read single hotel
export const read = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId)
      .select("-image.data")
      .populate("postedBy", "_id name")
      .exec();
    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(400).send("Error fetching hotel");
  }
};

// Update hotel
export const update = async (req, res) => {
  try {
    const fields = req.fields;
    const files = req.files;

    const data = { ...fields };
    if (files?.image) {
      data.image = {
        data: fs.readFileSync(files.image.path),
        contentType: files.image.type,
      };
    }

    const updated = await Hotel.findByIdAndUpdate(req.params.hotelId, data, {
      new: true,
    }).select("-image.data");

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).send("Hotel update failed. Try again.");
  }
};

// Orders for logged-in user
export const userHotelBookings = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).send("Unauthorized");

    const all = await Order.find({ orderedBy: req.user._id })
      .select("session")
      .populate("hotel", "-image.data")
      .populate("orderedBy", "_id name")
      .exec();

    res.json(all);
  } catch (err) {
    console.error("USER HOTEL BOOKINGS ERR:", err);
    res.status(500).send("Server error");
  }
};

// Check if user already booked a hotel
export const isAlreadyBooked = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).send("Unauthorized");

    const { hotelId } = req.params;
    const userOrders = await Order.find({ orderedBy: req.user._id }).select(
      "hotel"
    );

    const bookedIds = userOrders.map((o) => o.hotel.toString());
    res.json({ ok: bookedIds.includes(hotelId) });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Search hotels
export const searchListings = async (req, res) => {
  try {
    const { location, from, to, bed } = req.body;

    let filter = {};

    if (location && location.trim() !== "") {
      filter.location = { $regex: location, $options: "i" };
    }

    if (from) {
      filter.from = { $gte: new Date(from) };
    }

    if (to) {
      filter.to = { $lte: new Date(to) };
    }

    if (bed) {
      filter.bed = bed;
    }

    const result = await Hotel.find(filter).select("-image.data").exec();

    res.json(result);
  } catch (err) {
    console.error("SEARCH LISTINGS ERR:", err);
    res.status(500).send("Server error");
  }
};

