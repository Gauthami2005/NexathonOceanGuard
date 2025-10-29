const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me"; // same as in auth routes

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("[AuthMiddleware] Incoming Auth Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Remove "Bearer " prefix
    const token = authHeader.split(" ")[1];
    console.log("[AuthMiddleware] Extracted Token:", token.slice(-10)); // just for debug

    // Verify the token using the same secret
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("[AuthMiddleware] Decoded payload:", decoded);

    // Fetch user from database to get role and other details
    const user = await User.findById(decoded.id).select('name email role location');
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location
    };
    
    console.log("[AuthMiddleware] User role:", user.role);
    next();
  } catch (err) {
    console.error("[AuthMiddleware] JWT Verification Error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};


