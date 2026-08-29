const getAllowedOrigins = () =>
  (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const validateEnvironment = () => {
  const missing = [];
  if (!process.env.MONGO_URI?.trim()) missing.push("MONGO_URI");
  if (!process.env.JWT_SECRET?.trim() || process.env.JWT_SECRET.length < 32) {
    missing.push("JWT_SECRET (minimum 32 characters)");
  }
  if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGIN?.trim()) {
    missing.push("CORS_ORIGIN");
  }
  if (missing.length) {
    throw new Error(`Missing or invalid required environment variables: ${missing.join(", ")}`);
  }
};

module.exports = { getAllowedOrigins, validateEnvironment };
