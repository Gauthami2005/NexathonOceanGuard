const mongoose = require("mongoose");

const pincodeSchema = new mongoose.Schema({
  pincode: { type: String, required: true },
  district: { type: String },
  statename: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
});

module.exports = mongoose.model("Pincode", pincodeSchema);
