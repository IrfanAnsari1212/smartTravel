const dns = require("dns");
const mongoose = require("mongoose");

// On Windows, default ISP/router DNS often fails SRV records for mongodb+srv://
if (process.platform === "win32") {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  } catch (dnsErr) {
    console.warn("DNS server setup notice:", dnsErr.message);
  }
}

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ CRITICAL: MONGO_URI is missing from environment variables!");
    throw new Error("MONGO_URI environment variable is missing.");
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    });
    cachedConnection = conn;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw new Error(`MongoDB is unavailable: ${error.message}`);
  }
};

module.exports = connectDB;
