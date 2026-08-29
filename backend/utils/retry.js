const isTransientError = (error) => {
  if (!error) return false;
  // Network errors or timeouts
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT" || error.code === "ECONNRESET" || error.code === "ENOTFOUND") {
    return true;
  }
  // HTTP status codes that are transient
  const status = error.response?.status || error.statusCode;
  if (status === 429 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  return false;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (
  fn,
  {
    maxRetries = 2,
    initialDelayMs = 150,
    backoffMultiplier = 2,
    maxDelayMs = 1000,
    shouldRetry = isTransientError,
  } = {}
) => {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      return await fn(attempt);
    } catch (error) {
      attempt += 1;
      if (attempt > maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Add jitter (±20%)
      const jitter = delay * 0.2 * (Math.random() * 2 - 1);
      const sleepTime = Math.min(Math.max(delay + jitter, 10), maxDelayMs);
      await wait(sleepTime);
      delay *= backoffMultiplier;
    }
  }
};

module.exports = {
  isTransientError,
  withRetry,
};

