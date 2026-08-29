const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
const { ZodError } = require("zod");
require("dotenv").config();

const connectDB = require("./config/db");
const { getAllowedOrigins, validateEnvironment } = require("./config/env");
const requestLogger = require("./middleware/requestLogger");
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tripRoutes = require("./routes/tripRoutes");
const aiRoutes = require("./routes/aiRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const weatherRoutes = require("./routes/weatherRoutes");

const app = express();
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);
const allowedOrigins = getAllowedOrigins();
const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const trustedOrigins =
  process.env.NODE_ENV === "production" && allowedOrigins.length
    ? allowedOrigins
    : [...new Set([...allowedOrigins, ...developmentOrigins])];

app.disable("x-powered-by");
app.use(requestLogger);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        trustedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        callback(null, true);
        return;
      }

      console.warn(`Blocked CORS request from origin: ${origin}`);
      const error = new Error(`Origin ${origin} not allowed by CORS`);
      error.statusCode = 403;
      callback(error);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));

// Rate limiter
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === "production" ? 100 : 500,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." },
  })
);

// Serverless DB connect middleware
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failure on request:", err.message);
    res.status(503).json({
      message: "Database is currently unavailable. Please verify MONGO_URI in deployment environment variables.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  let status = "unhealthy";
  let database = "disconnected";

  if (dbState === 1) {
    status = "healthy";
    database = "connected";
  } else if (dbState === 2 || dbState === 3) {
    status = "degraded";
    database = "connecting";
  }

  res.json({
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database,
    version: "1.0.0",
  });
});

app.get("/api/ready", (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: "unhealthy", database: "disconnected" });
  }
  return res.json({ status: "healthy", database: "connected" });
});

app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/trip", tripRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/weather", weatherRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  app.get("/", (req, res) => {
    res.send("Travel Platform API is running");
  });
}

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err instanceof ZodError ? 400 : 500);
  const message =
    err instanceof ZodError
      ? "The request contains invalid data"
      : statusCode < 500
        ? err.message
        : "Internal Server Error";
  console.error("GLOBAL ERROR:", err.message);

  res.status(statusCode).json({
    message,
    ...(err instanceof ZodError && {
      fields: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    }),
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  validateEnvironment();
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

if (!process.env.VERCEL) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
  });
}

module.exports = app;
