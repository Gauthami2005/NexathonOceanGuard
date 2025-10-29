const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me"; // same as in auth routes

module.exports = (req, res, next) => {
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

    req.user = decoded;
    next();
  } catch (err) {
    console.error("[AuthMiddleware] JWT Verification Error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};


