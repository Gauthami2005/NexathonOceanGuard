const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/authmiddleware');
const { sendReportStatusNotification } = require('../services/notificationService');
const router = express.Router();
const axios = require('axios');

const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads'); 
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) { // <-- NEW: Create the uploads directory
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ reports: [] }, null, 2), 'utf-8');
  }
}

function readReports() {
  ensureStorage();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw || '{"reports":[]}');
    return Array.isArray(parsed.reports) ? parsed.reports : [];
  } catch {
    return [];
  }
}

function writeReports(reports) {
  ensureStorage();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ reports }, null, 2), 'utf-8');
}

function computeTextMatchScore(title, predictedLabel) {
  if (!title || !predictedLabel) return 0;
  const t = title.toLowerCase();
  const p = predictedLabel.toLowerCase();
  return t.includes(p) || p.includes(t) ? 1 : 0;
}

// --- Multer Configuration ---
// Tells multer where and how to save the files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR); // Save files to the 'uploads/' directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    // Clean up filename (e.g., replace spaces)
    const originalName = file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix + '-' + originalName);
  }
});

const upload = multer({ storage: storage });
// --- End Multer Configuration ---



router.get('/', (req, res) => {
  try {
    const { pincode } = req.query;
    let reports = readReports();

    if (pincode) {
      reports = reports.filter(report => report.pincode === pincode);
    }

    const sortedReports = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedReports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read reports', details: err.message });
  }
});


// <-- UPDATED: Add the 'upload.single('image')' middleware
// This tells multer to look for a single file upload with the field name 'image'
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    // When using multer, text fields are in 'req.body'
    const { category, title, type, description, location, pincode } = req.body || {};
    
    // The uploaded file info is in 'req.file'
    // req.file will be 'undefined' if no file was uploaded
    
    if (!category || !title || !description) {
      return res.status(400).json({ error: 'category, title and description are required' });
    }

    const now = new Date().toISOString();
    const report = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category, // 'criminal' | 'municipality' | 'ocean'
      title,
      type: type || 'Other',
      description,
      location: location || '',
      pincode: pincode || '',
      
      // <-- NEW: Add the image filename to your report object
      // We only store the filename, not the whole path
      image: req.file ? req.file.filename : null, 
      
      createdAt: now,
      status: 'Pending',
      reporterId: req.user?._id?.toString?.() || null,
      ai: undefined
    };

    // Call AI service (this part remains the same)
    try {
      const aiRes = await axios.post('http://localhost:8000/verify-hazard', {
        description: report.description,
        type: report.type,
        location: report.location,
        pincode: report.pincode
      }, { timeout: 5000 });
      const ai = aiRes.data || {};
      report.ai = {
        isHazard: !!ai.isHazard,
        confidence: typeof ai.confidence === 'number' ? ai.confidence : null,
        components: ai.components || null
      };
      console.log(`[reports] AI ok: id=${report.id} conf=${report.ai.confidence}`);
    } catch (e) {
      console.warn(`[reports] AI unavailable for id=${report.id}:`, e.message);
      report.ai = { isHazard: null, confidence: null, components: null, error: 'ai_unavailable' };
    }

    const reports = readReports();
    reports.push(report);
    writeReports(reports);
    res.status(201).json({ message: 'Report saved', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save report', details: err.message });
  }
});

// Get AI-verified "real" reports (confidence >= 0.8 by default)
// Note: public access enabled to surface data on authorities dashboard without JWT
router.get('/real', async (req, res) => {
  try {
    const minConfidenceParam = req.query.minConfidence;
    const minConfidence = Number.isFinite(Number(minConfidenceParam))
      ? Math.max(0, Math.min(1, Number(minConfidenceParam)))
      : 0.8; // default 80%

    const reports = readReports();
    const realReports = reports
      .filter(r => r?.ai && r.ai.isHazard === true && typeof r.ai.confidence === 'number' && r.ai.confidence >= minConfidence)
      .sort((a, b) => {
        const byConfidence = (b.ai?.confidence || 0) - (a.ai?.confidence || 0);
        if (byConfidence !== 0) return byConfidence;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    res.json(realReports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch real reports', details: err.message });
  }
});

// Update status: only authorities can update
router.put('/:id/status', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const { newStatus, authorityNotes } = req.body || {};

    const allowed = ['Acknowledged', 'Resolved', 'Rejected'];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (!req.user || (req.user.role !== 'authority' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden: authorities only' });
    }

    const reports = readReports();
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Report not found' });

    const report = reports[idx];
    report.status = newStatus;
    report.authorityNotes = authorityNotes || '';
    report.updatedAt = new Date().toISOString();
    reports[idx] = report;
    writeReports(reports);

    // Notify original reporter (best-effort)
    if (report.reporterId) {
      sendReportStatusNotification(report.reporterId, report.title, newStatus, authorityNotes).catch(() => {});
    }

    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

module.exports = router;