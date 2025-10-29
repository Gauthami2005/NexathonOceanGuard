const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// ✅ Load environment variables first (before any route imports)
dotenv.config();

// ✅ Now import the rest (they can safely use process.env)
const connectDB = require('./config/db');
const hazardRoutes = require("./routes/hazard");
const authRoutes = require("./routes/auth");
const reportsRoutes = require("./routes/reports");

const app = express();
const port = 3001;

app.use(express.json());

// ✅ CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

// ✅ Static and Routes
app.use("/uploads", express.static("uploads"));
app.use("/api/hazards", hazardRoutes);
app.use("/hazards", hazardRoutes);
app.use("/auth", authRoutes);
app.use("/api/reports", reportsRoutes);

// ✅ Connect to DB
connectDB();

app.get("/", (req, res) => {
  res.send("<h1>Server is running ✅</h1>");
});

// ✅ Dummy user routes (make sure User model is imported)
const User = require("./models/user");

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;
  const newUser = new User({ name, email, password });
  await newUser.save();
  res.json({ message: "User added successfully!", user: newUser });
});

// ✅ Serve report page
const path = require("path");
app.get("/report", (req, res) => {
  res.sendFile(path.join(__dirname, "report.html"));
});

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
