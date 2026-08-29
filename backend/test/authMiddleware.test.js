const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret-that-is-long-enough-to-be-valid-123";
const { requireAuth } = require("../middleware/requireAuth");

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("rejects a missing bearer token", () => {
  const res = createResponse();
  requireAuth({ get: () => "" }, res, () => assert.fail("must not call next"));
  assert.equal(res.statusCode, 401);
});

test("accepts a valid signed token", () => {
  const token = jwt.sign({ email: "traveler@example.com" }, process.env.JWT_SECRET, {
    subject: "user-123", algorithm: "HS256",
  });
  const req = { get: () => `Bearer ${token}` };
  let passed = false;
  requireAuth(req, createResponse(), () => { passed = true; });
  assert.equal(passed, true);
  assert.deepEqual(req.user, { id: "user-123", email: "traveler@example.com" });
});
