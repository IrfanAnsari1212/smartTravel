const assert = require("node:assert/strict");
const test = require("node:test");
const { SimpleCache } = require("../services/cacheService");

test("SimpleCache correctly stores and retrieves entries", () => {
  const cache = new SimpleCache(5000, 10);
  cache.set("delhi", { lat: 28.6, lon: 77.2 });

  const result = cache.get("delhi");
  assert.deepEqual(result, { lat: 28.6, lon: 77.2 });
  assert.equal(cache.size(), 1);
});

test("SimpleCache respects TTL expiration", async () => {
  const cache = new SimpleCache(50, 10);
  cache.set("quick", "expiring_value");

  assert.equal(cache.get("quick"), "expiring_value");

  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(cache.get("quick"), null);
});

test("SimpleCache evicts oldest key when maxEntries is reached", () => {
  const cache = new SimpleCache(5000, 2);
  cache.set("key1", "val1");
  cache.set("key2", "val2");
  assert.equal(cache.size(), 2);

  cache.set("key3", "val3");
  assert.equal(cache.get("key1"), null); // Oldest evicted
  assert.equal(cache.get("key2"), "val2");
  assert.equal(cache.get("key3"), "val3");
});
