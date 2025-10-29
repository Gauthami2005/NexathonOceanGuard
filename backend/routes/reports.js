// routes/reports.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/authmiddleware');
const { sendReportStatusNotification } = require('../services/notificationService');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');

// --- Configuration and Storage Setup ---
const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ reports: [] }, null, 2));
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
  fs.writeFileSync(DATA_FILE, JSON.stringify({ reports }, null, 2));
}

function computeTextMatchScore(title, predictedLabel) {
  if (!title || !predictedLabel) return 0;
  const t = title.toLowerCase();
  const p = predictedLabel.toLowerCase();
  return t.includes(p) || p.includes(t) ? 1 : 0;
}

// --- Multer Storage ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  },
});

const upload = multer({ storage });

// --- Route: GET all reports ---
router.get('/', (req, res) => {
  try {
    const { pincode } = req.query;
    let reports = readReports();
    if (pincode) reports = reports.filter(r => r.pincode === pincode);
    const sorted = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read reports', details: err.message });
  }
});

// --- Route: POST new report ---
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { category, title, type, description, location, pincode } = req.body || {};
    if (!category || !title || !description) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'category, title and description are required' });
    }

    const now = new Date().toISOString();
    const report = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category,
      title,
      type: type || 'Other',
      description,
      location: location || '',
      pincode: pincode || '',
      image: req.file ? req.file.filename : null,
      createdAt: now,
      status: 'Pending',
      reporterId: req.user?._id?.toString?.() || null,
      ai: null,
      authenticity: null,
    };

    // ✅ Step 1: Call the ML model service
    if (req.file) {
      console.log(`[reports] Sending image to ML service: ${req.file.path}`);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description || '');
      formData.append('type', type || '');
      formData.append('location', location || '');
      formData.append('pincode', pincode || '');
      formData.append('image', fs.createReadStream(req.file.path));

      try {
        const mlResponse = await axios.post('http://127.0.0.1:8000/verify-hazard', formData, {
          headers: formData.getHeaders(),
          timeout: 15000,
        });

        const ml = mlResponse.data;
        console.log(`[reports] ML Prediction: ${ml.predictedLabel} (${ml.confidence})`);

        report.ai = {
          predictedLabel: ml.predictedLabel,
          confidence: ml.confidence,
          isHazard: ml.isHazard,
          components: ml.components,
        };

        const textScore = computeTextMatchScore(title, ml.predictedLabel);
        report.authenticity = textScore > 0 && ml.isHazard;
      } catch (err) {
        console.warn(`[reports] ML service failed: ${err.message}`);
        report.ai = { error: 'ml_unavailable' };
        report.authenticity = null;
      }
    }

    const reports = readReports();
    reports.push(report);
    writeReports(reports);

    res.status(201).json({ message: 'Report saved', report });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to save report', details: err.message });
  }
});

// --- Route: GET only authentic reports ---
router.get('/authentic', (req, res) => {
  try {
    const reports = readReports();
    const authenticReports = reports.filter(r => r.authenticity === true);
    res.json(authenticReports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch authentic reports', details: err.message });
  }
});

// --- Route: GET real hazard reports ---
router.get('/real', (req, res) => {
  try {
    const minConfidenceParam = req.query.minConfidence;
    const minConfidence = Number.isFinite(Number(minConfidenceParam))
      ? Math.max(0, Math.min(1, Number(minConfidenceParam)))
      : 0.8; // default 80%

    const reports = readReports();
    const realReports = reports
      .filter(
        r =>
          r?.ai &&
          r.ai.isHazard === true &&
          typeof r.ai.confidence === 'number' &&
          r.ai.confidence >= minConfidence
      )
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

// --- Route: PUT update report status ---
router.put('/:id/status', async (req, res) => {
  try {
    const id = req.params.id;
    const { newStatus, authorityNotes } = req.body || {};

    const allowed = ['Acknowledged', 'Resolved', 'Rejected'];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
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

    if (report.reporterId) {
      sendReportStatusNotification(report.reporterId, report.title, newStatus, authorityNotes).catch(() => {});
    }

    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

module.exports = router;