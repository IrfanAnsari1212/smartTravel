const getAllowedOrigins = () => {
  const origins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  return origins;
};

const validateEnvironment = () => {
  const warnings = [];

  if (!process.env.MONGO_URI?.trim()) {
    warnings.push("MONGO_URI is not set. Please add MONGO_URI in Vercel/deployment environment variables.");
  }

  if (!process.env.JWT_SECRET?.trim() || process.env.JWT_SECRET.length < 32) {
    warnings.push("JWT_SECRET is missing or < 32 chars. Using fallback security secret.");
    process.env.JWT_SECRET = process.env.JWT_SECRET || "smart_travel_jwt_secret_fallback_key_2026_production_safe_min_32_chars";
  }

  if (warnings.length) {
    warnings.forEach((w) => console.warn(`⚠️ [ENV WARNING]: ${w}`));
  }
};

module.exports = { getAllowedOrigins, validateEnvironment };
