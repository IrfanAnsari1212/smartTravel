const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const locationRoutes = require("./routes/locationRoutes");
const tripRoutes = require("./routes/tripRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Travel Platform API is running");
});

app.use("/api/locations", locationRoutes);
app.use("/api/trip", tripRoutes);

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);

  res.status(err.statusCode || 500).json({
    message: err.statusCode ? err.message : "Internal Server Error",
    error: err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
