


const express = require("express");
const Alert = require("../models/alert");
const router = express.Router();

// Create new alert
router.post("/create", async (req, res) => {
    try {
        const { title, description, severity, location, coordinates, expiresAt, createdBy } = req.body;
        
        const newAlert = new Alert({
            title,
            description,
            severity,
            location,
            coordinates,
            expiresAt,
            createdBy
        });
        
        await newAlert.save();
        
        res.status(201).json({
            message: "Alert created successfully",
            alert: newAlert
        });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Get all alerts
router.get("/", async (req, res) => {
    try {
        const alerts = await Alert.find()
            .sort({ createdAt: -1 })
            .populate("createdBy", "name email");
        
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Get alert by ID
router.get("/:id", async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate("createdBy", "name email");
        
        if (!alert) {
            return res.status(404).json({ error: "Alert not found" });
        }
        
        res.json(alert);
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Update alert status
router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!alert) {
            return res.status(404).json({ error: "Alert not found" });
        }
        
        res.json({
            message: "Alert status updated successfully",
            alert
        });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Delete alert
router.delete("/:id", async (req, res) => {
    try {
        const alert = await Alert.findByIdAndDelete(req.params.id);
        
        if (!alert) {
            return res.status(404).json({ error: "Alert not found" });
        }
        
        res.json({ message: "Alert deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

module.exports = router;