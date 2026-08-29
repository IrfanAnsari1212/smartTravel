const axios = require("axios");
const { withRetry } = require("../utils/retry");

const OVERPASS_URL =
  process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const OVERPASS_TIMEOUT_MS = Number(process.env.OVERPASS_TIMEOUT_MS) || 8000;

const queryOverpass = async (query) => {
  return withRetry(async () => {
    try {
      const response = await axios.post(
        OVERPASS_URL,
        new URLSearchParams({ data: query }),
        {
          timeout: OVERPASS_TIMEOUT_MS,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      return response.data?.elements || [];
    } catch (error) {
      const providerError = new Error("Nearby places are temporarily unavailable");
      providerError.statusCode = 503;
      providerError.cause = error;
      throw providerError;
    }
  });
};

module.exports = {
  queryOverpass,
};

