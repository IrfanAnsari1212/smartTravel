const dns = require("dns");
const mongoose = require("mongoose");

// On Windows, default ISP/router DNS often fails SRV records for mongodb+srv://
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("DNS server setup notice:", dnsErr.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw new Error("MongoDB is unavailable. SmartTravel requires durable storage to start.");
  }
};

module.exports = connectDB;
