class SimpleCache {
  constructor(defaultTtlMs = 30 * 60 * 1000, maxEntries = 500) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

const geocodeCache = new SimpleCache(60 * 60 * 1000, 500); // 1 hour TTL
const routeCache = new SimpleCache(30 * 60 * 1000, 200);   // 30 min TTL

module.exports = {
  SimpleCache,
  geocodeCache,
  routeCache,
};
