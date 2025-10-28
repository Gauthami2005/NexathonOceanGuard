const mongoose = require("mongoose");

// We create a separate schema for the location point for clarity
const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'], // GeoJSON type must be 'Point'
    required: true
  },
  coordinates: {
    type: [Number], // Array of numbers: [longitude, latitude]
    required: true
  }
});

const hazardSchema = new mongoose.Schema({
  // No change to title and description
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  
  hazardType: {
    type: String,
    required: true,
    enum: ['High Waves', 'Oil Spill', 'Debris', 'Flooding', 'Other']
  },

  // ✅ CRITICAL CHANGE: This is the correct way to store location for geo-queries
  location: {
    type: pointSchema,
    required: true,
    index: '2dsphere' // This index is essential for fast location searches!
  },

  // This links the report to the user who created it
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This creates a reference to your User model
    required: true
  },

  photo: { type: String }, // For the image URL, this is fine

  // ✅ NEW FIELD: This is the engine for your verification workflow
  status: {
    type: String,
    enum: ['unverified', 'pending_ai', 'verified', 'rejected'],
    default: 'unverified'
  },
  
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  }
}, { timestamps: true }); // Adding timestamps is always a good practice

module.exports = mongoose.model("Hazard", hazardSchema);