const crypto = require("crypto");

const requestLogger = (req, res, next) => {
  const requestId = req.get("x-request-id") || crypto.randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    // Do not flood logs on standard asset queries in dev
    const isStaticAsset = req.originalUrl?.startsWith("/assets/");
    if (!isStaticAsset) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      };

      if (res.statusCode >= 500) {
        console.error("HTTP ERROR:", JSON.stringify(logEntry));
      } else if (res.statusCode >= 400) {
        console.warn("HTTP WARN:", JSON.stringify(logEntry));
      } else {
        console.log("HTTP INFO:", JSON.stringify(logEntry));
      }
    }
  });

  next();
};

module.exports = requestLogger;
