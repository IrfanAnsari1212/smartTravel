const assert = require("node:assert/strict");
const test = require("node:test");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

test("Authentication: password hashing with bcrypt", async () => {
  const plainPassword = "SuperSecurePassword123!";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);

  assert.notEqual(plainPassword, hash);
  const isMatch = await bcrypt.compare(plainPassword, hash);
  assert.equal(isMatch, true);

  const isWrongMatch = await bcrypt.compare("WrongPassword123!", hash);
  assert.equal(isWrongMatch, false);
});

test("Authentication: JWT token generation and validation", () => {
  const secret = "test_jwt_secret_key_123456";
  const userId = "user_64f123456789abcdef";
  const email = "traveler@example.com";

  const token = jwt.sign({ id: userId, email }, secret, { expiresIn: "1h" });
  assert.ok(token);

  const decoded = jwt.verify(token, secret);
  assert.equal(decoded.id, userId);
  assert.equal(decoded.email, email);
});

test("Authentication: Rejection on invalid or expired token", () => {
  const secret = "test_jwt_secret_key_123456";
  const expiredToken = jwt.sign({ id: "user_123" }, secret, { expiresIn: -10 });

  assert.throws(() => {
    jwt.verify(expiredToken, secret);
  }, /jwt expired/);

  assert.throws(() => {
    jwt.verify("malformed.token.here", secret);
  }, /invalid token/);
});

