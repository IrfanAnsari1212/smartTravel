const express = require("express");
const cors = require("cors");
require("dotenv").config();

// DB connection
const connectDB = require("./config/db");

// Routes
const tripRoutes = require("./routes/tripRoutes");

const app = express();

// --------------------
// Connect Database
// --------------------
connectDB();

// --------------------
// Middlewares
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// Health Check Route
// --------------------
app.get("/", (req, res) => {
  res.send("🚀 Travel Platform API is running");
});

// --------------------
// API Routes
// --------------------
app.use("/api/trip", tripRoutes);

// --------------------
// Global Error Handler (IMPORTANT)
// --------------------
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err.message);

  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});