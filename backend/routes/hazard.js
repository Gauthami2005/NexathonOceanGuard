const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // ✅ <--- THIS WAS THE MISSING LINE
const Hazard = require('../models/hazard');
const verificationQueue = require('../queues/verificationqueues');
const authMiddleware = require('../middleware/authmiddleware');
const sendMail = require("../utils/sendEmail"); //for sending email to users

// --- Multer Setup for Image Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `hazard-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// --- API Routes ---

// POST /api/hazards - Create a new hazard report (with image)
router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
  const { title, hazardType, description, longitude, latitude } = req.body;
  const userId = req.user.id;

  if (!description || !longitude || !latitude) {
    return res.status(400).json({ error: 'Description and location coordinates are required.' });
  }

  // 1. Save the new report with 'unverified' status and photo path
  const newReport = new Hazard({
    title,
    hazardType,
    description,
    photo: req.file ? req.file.path : null, // Get the file path from multer
    reportedBy: userId,
    status: 'unverified',
    location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
  });
  await newReport.save();
  console.log(`[API] New hazard report ${newReport._id} with image saved.`);

  // --- THRESHOLD CHECK LOGIC (No changes here) ---
  try {
    const ONE_KILOMETER_IN_METERS = 1000;
    const REPORTING_THRESHOLD = 3;

    const nearbyReports = await Hazard.find({
      location: { $near: { $geometry: newReport.location, $maxDistance: ONE_KILOMETER_IN_METERS } },
      status: 'unverified'
    });
    console.log(`[API] Found ${nearbyReports.length} nearby unverified reports.`);

    if (nearbyReports.length >= REPORTING_THRESHOLD) {
      const reportIdsToVerify = nearbyReports.map(report => report._id);

      // 2. Add a job to the queue.
      await verificationQueue.add('verify-hazard-job', {
        reportIds: reportIdsToVerify,
        description: newReport.description,
        location: newReport.location
      });
      console.log(`[API] Threshold met. Job added to queue for ${reportIdsToVerify.length} reports.`);

      await Hazard.updateMany(
        { _id: { $in: reportIdsToVerify } },
        { $set: { status: 'pending_ai' } }
      );
    }
  } catch (error) {
    console.error("[API] Error during threshold check:", error);
  }

  // 3. Respond to the user immediately
  res.status(201).json({ message: 'Hazard reported. It will be reviewed shortly.', report: newReport });
});


// GET /api/hazards - Fetches only VERIFIED hazards for the public map
router.get('/', async (req, res) => {
  try {
    const verifiedHazards = await Hazard.find({ status: 'verified' }).sort({ createdAt: -1 });
    res.json(verifiedHazards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hazard data' });
  }
});


// GET /api/hazards/all - Fetches ALL hazards for the authority dashboard
router.get('/all', authMiddleware, async (req, res) => {
  // Add another middleware here to check if req.user.isAdmin if you have roles
  try {
    const allHazards = await Hazard.find()
      .populate("reportedBy", "name email") // Show who reported it
      .sort({ createdAt: -1 });
    res.json(allHazards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all hazard data' });
  }
});

// GET /api/hazards/recent - Fetches mock incidents from a JSON file
router.get("/recent", (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data/incidents.json");

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ Error: incidents.json file not found at', filePath);
      return res.status(404).json({
        success: false,
        message: "Incidents data file not found."
      });
    }

    // Read JSON file
    const data = fs.readFileSync(filePath, "utf-8");
    const incidents = JSON.parse(data);

    // Sort by reportedAt (latest first)
    incidents.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

    res.json({
      success: true,
      total: incidents.length,
      incidents,
    });
  } catch (error) {
    console.error("❌ Error reading incidents.json:", error);
    res.status(500).json({
      success: false,
      message: "Error loading incidents data",
    });
  }
});

// ✅ DELETED THE DUPLICATE ROUTE that was here

module.exports = router;

