const assert = require("node:assert/strict");
const test = require("node:test");
const { isTransientError, withRetry } = require("../utils/retry");

test("isTransientError detects network timeouts, 429, 502, 503, 504", () => {
  assert.equal(isTransientError({ code: "ETIMEDOUT" }), true);
  assert.equal(isTransientError({ code: "ECONNRESET" }), true);
  assert.equal(isTransientError({ response: { status: 503 } }), true);
  assert.equal(isTransientError({ response: { status: 429 } }), true);
  assert.equal(isTransientError({ response: { status: 404 } }), false);
  assert.equal(isTransientError({ response: { status: 400 } }), false);
});

test("withRetry succeeds on first attempt without retrying", async () => {
  let callCount = 0;
  const result = await withRetry(async () => {
    callCount += 1;
    return "ok";
  });

  assert.equal(result, "ok");
  assert.equal(callCount, 1);
});

test("withRetry retries on transient error and succeeds", async () => {
  let callCount = 0;
  const result = await withRetry(
    async (attempt) => {
      callCount += 1;
      if (attempt === 0) {
        const err = new Error("Gateway timeout");
        err.response = { status: 504 };
        throw err;
      }
      return "recovered";
    },
    { initialDelayMs: 10, backoffMultiplier: 1.5, maxRetries: 2 }
  );

  assert.equal(result, "recovered");
  assert.equal(callCount, 2);
});

test("withRetry throws immediately on non-transient 4xx error without retrying", async () => {
  let callCount = 0;
  await assert.rejects(
    withRetry(
      async () => {
        callCount += 1;
        const err = new Error("Not Found");
        err.response = { status: 404 };
        throw err;
      },
      { initialDelayMs: 10, maxRetries: 3 }
    ),
    (err) => err.response?.status === 404
  );

  assert.equal(callCount, 1);
});

