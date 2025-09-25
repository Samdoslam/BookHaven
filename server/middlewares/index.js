import Hotel from "../models/hotel.js";
import { expressjwt as expressJwt } from "express-jwt";

// Middleware to require authentication
export const requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  requestProperty: "user",
});

// Middleware to check if logged-in user owns the hotel
export const hotelOwner = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId).exec();
    if (!hotel) return res.status(404).send("Hotel not found");

    const owner = hotel.postedBy._id.toString() === req.user._id.toString();
    if (!owner) return res.status(403).send("Unauthorized");

    next();
  } catch (err) {
    console.error("HOTEL OWNER CHECK ERR", err);
    res.status(500).send("Server error");
  }
};
