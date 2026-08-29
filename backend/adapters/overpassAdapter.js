const axios = require("axios");
const { withRetry } = require("../utils/retry");

const OVERPASS_URLS = [
  process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OVERPASS_TIMEOUT_MS = Number(process.env.OVERPASS_TIMEOUT_MS) || 15000;

const getHeaders = () => ({
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent":
    process.env.NOMINATIM_USER_AGENT ||
    "SmartTravelApp/1.0 (https://github.com/IrfanAnsari1212/smartTravel; irfanking8215@gmail.com)",
});

const queryOverpass = async (query) => {
  return withRetry(
    async (attempt) => {
      const endpoint = OVERPASS_URLS[attempt % OVERPASS_URLS.length];

      try {
        const response = await axios.post(
          endpoint,
          new URLSearchParams({ data: query }),
          {
            timeout: OVERPASS_TIMEOUT_MS,
            headers: getHeaders(),
          }
        );

        return response.data?.elements || [];
      } catch (error) {
        const providerError = new Error("Nearby places are temporarily unavailable");
        providerError.statusCode = 503;
        providerError.cause = error;
        throw providerError;
      }
    },
    { maxRetries: 2, initialDelayMs: 200 }
  );
};

module.exports = {
  queryOverpass,
};
