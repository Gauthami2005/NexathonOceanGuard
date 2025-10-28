const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";


module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

        if (!token) {
            return res.status(401).json({ message: "Authorization token missing" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select("_id name email phoneNumber role");
        if (!user) {
            return res.status(401).json({ message: "Invalid token" });
        }

        req.user = user;
        return next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized", error: err.message });
    }
};


