const express = require("express");
const Community = require("../models/community");
const router = express.Router();
const multer = require("multer");

// Configure multer for post image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// Create new community
router.post("/create", async (req, res) => {
    try {
        const { title, description, createdBy } = req.body;
        
        const newCommunity = new Community({
            title,
            description,
            createdBy,
            members: [createdBy] // Add creator as first member
        });
        
        await newCommunity.save();
        
        res.status(201).json({
            message: "Community created successfully",
            community: newCommunity
        });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Get all communities
router.get("/", async (req, res) => {
    try {
        const communities = await Community.find()
            .sort({ createdAt: -1 })
            .populate("createdBy", "name email")
            .populate("members", "name email");
        
        res.json(communities);
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Get community by ID
router.get("/:id", async (req, res) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate("createdBy", "name email")
            .populate("members", "name email")
            .populate("posts.user", "name email profilePicture")
            .populate("posts.comments.user", "name email profilePicture");
        
        if (!community) {
            return res.status(404).json({ error: "Community not found" });
        }
        
        res.json(community);
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Join community
router.post("/:id/join", async (req, res) => {
    try {
        const { userId } = req.body;
        
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({ error: "Community not found" });
        }
        
        // Check if user is already a member
        if (community.members.includes(userId)) {
            return res.status(400).json({ error: "User is already a member" });
        }
        
        community.members.push(userId);
        await community.save();
        
        res.json({
            message: "Joined community successfully",
            community
        });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Create post in community
router.post("/:id/post", upload.single("image"), async (req, res) => {
    try {
        const { userId, content } = req.body;
        
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({ error: "Community not found" });
        }
        
        const newPost = {
            user: userId,
            content,
            image: req.file ? req.file.filename : null,
            createdAt: new Date(),
            likes: [],
            comments: []
        };
        
        community.posts.push(newPost);
        await community.save();
        
        res.status(201).json({
            message: "Post created successfully",
            post: newPost
        });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Add comment to post
router.post("/:communityId/post/:postId/comment", async (req, res) => {
    try {
        const { userId, content } = req.body;
        
        const community = await Community.findById(req.params.communityId);
        
        if (!community) {
            return res.status(404).json({ error: "Community not found" });
        }
        
        const post = community.posts.id(req.params.postId);
        
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        const newComment = {
            user: userId,
            content,
            createdAt: new Date()
        };
        
        post.comments.push(newComment);
        await community.save();
        
        res.status(201).json({
            message: "Comment added successfully",
            comment: newComment
        });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

module.exports = router;