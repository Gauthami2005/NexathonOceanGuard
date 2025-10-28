const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // --- No changes to your existing fields ---
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  password: { type: String, required: true, minlength: 6 }, // I removed 'select: false' for now, but you can add it back if you need it

  // --- ✅ NEW FIELDS ADDED BELOW ---

  // Role-based authorization for protected endpoints
  role: {
    type: String,
    enum: ["user", "authority", "admin"],
    default: "user",
  },

  // 📍 This object will store the user's primary location after pincode lookup
  location: {
    pincode: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
  },

  // 🔔 This stores the token needed to send push notifications to the user's device
  fcmToken: {
    type: String,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);