const TILE_CACHE_NAME = "travel-platform-map-tiles-v1";
const STORAGE_KEY = "travel-platform-offline-map-packs-v1";
const TILE_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAX_TILE_COUNT = 320;

export const MAP_PACK_PRESETS = {
  compact: {
    id: "compact",
    label: "Compact",
    zoomLevels: [8, 10, 11],
  },
  standard: {
    id: "standard",
    label: "Standard",
    zoomLevels: [8, 10, 12],
  },
};

const readStoredMapPacks = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const writeStoredMapPacks = (packs) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
};

const sortMapPacks = (packs) =>
  [...packs].sort(
    (left, right) =>
      new Date(right.cachedAt).getTime() - new Date(left.cachedAt).getTime()
  );

const normalizePackIdentity = (trip) => ({
  id: trip.id || trip.tripId,
  title: trip.title || `${trip.startQuery} to ${trip.destinationQuery}`,
  startQuery: trip.startQuery,
  destinationQuery: trip.destinationQuery,
});

const longitudeToTileX = (longitude, zoom) =>
  Math.floor(((longitude + 180) / 360) * 2 ** zoom);

const latitudeToTileY = (latitude, zoom) => {
  const radians = (latitude * Math.PI) / 180;
  const mercator =
    (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2;

  return Math.floor(mercator * 2 ** zoom);
};

const sampleCoordinates = (coordinates, maxSamples = 24) => {
  if (coordinates.length <= maxSamples) {
    return coordinates;
  }

  const step = Math.ceil(coordinates.length / maxSamples);

  return coordinates.filter((_, index) => index % step === 0);
};

const makeTileUrl = (zoom, x, y) =>
  TILE_TEMPLATE.replace("{z}", String(zoom))
    .replace("{x}", String(x))
    .replace("{y}", String(y));

const collectTilesForRoute = (trip, presetId = "standard") => {
  const preset = MAP_PACK_PRESETS[presetId] || MAP_PACK_PRESETS.standard;
  const coordinates = trip.geometry?.coordinates || [];

  if (!coordinates.length) {
    throw new Error("This trip does not have route geometry to cache.");
  }

  const sampledCoordinates = sampleCoordinates(coordinates);
  const tileMap = new Map();

  sampledCoordinates.forEach(([longitude, latitude]) => {
    preset.zoomLevels.forEach((zoom) => {
      const baseX = longitudeToTileX(longitude, zoom);
      const baseY = latitudeToTileY(latitude, zoom);
      const radius = zoom >= 12 ? 1 : 0;
      const limit = 2 ** zoom;

      for (let xOffset = -radius; xOffset <= radius; xOffset += 1) {
        for (let yOffset = -radius; yOffset <= radius; yOffset += 1) {
          const x = (baseX + xOffset + limit) % limit;
          const y = baseY + yOffset;

          if (y < 0 || y >= limit) {
            continue;
          }

          const key = `${zoom}-${x}-${y}`;

          if (!tileMap.has(key)) {
            tileMap.set(key, {
              zoom,
              x,
              y,
              url: makeTileUrl(zoom, x, y),
            });
          }
        }
      }
    });
  });

  const tiles = Array.from(tileMap.values());

  if (tiles.length > MAX_TILE_COUNT) {
    throw new Error(
      "This route needs too many tiles for the current offline map preset. Try a shorter route first."
    );
  }

  return {
    preset,
    tiles,
  };
};

const requireCacheStorage = () => {
  if (!("caches" in window)) {
    throw new Error("This browser does not support offline map caching.");
  }
};

export const listOfflineMapPacks = () => sortMapPacks(readStoredMapPacks());

export const getOfflineMapPackVerification = async (tripId) => {
  const metadata = readStoredMapPacks().find((pack) => pack.id === tripId);

  if (!metadata) {
    return {
      metadata: null,
      cachedCount: 0,
      totalCount: 0,
      isVerified: false,
      supportsCacheStorage: "caches" in window,
    };
  }

  if (!("caches" in window)) {
    return {
      metadata,
      cachedCount: 0,
      totalCount: metadata.urls?.length || 0,
      isVerified: false,
      supportsCacheStorage: false,
    };
  }

  const cache = await window.caches.open(TILE_CACHE_NAME);
  const cachedChecks = await Promise.all(
    (metadata.urls || []).map((url) => cache.match(new Request(url, { mode: "no-cors" })))
  );
  const cachedCount = cachedChecks.filter(Boolean).length;
  const totalCount = metadata.urls?.length || 0;

  return {
    metadata,
    cachedCount,
    totalCount,
    isVerified: totalCount > 0 && cachedCount === totalCount,
    supportsCacheStorage: true,
  };
};

export const getOfflineMapPreview = (trip, presetId = "standard") => {
  const { preset, tiles } = collectTilesForRoute(trip, presetId);

  return {
    presetId: preset.id,
    presetLabel: preset.label,
    zoomLevels: preset.zoomLevels,
    tileCount: tiles.length,
  };
};

export const downloadOfflineMapPack = async (
  trip,
  { presetId = "standard", onProgress } = {}
) => {
  requireCacheStorage();

  const identity = normalizePackIdentity(trip);
  const { preset, tiles } = collectTilesForRoute(trip, presetId);
  const cache = await window.caches.open(TILE_CACHE_NAME);
  let completed = 0;

  for (const tile of tiles) {
    const request = new Request(tile.url, { mode: "no-cors" });
    const cached = await cache.match(request);

    if (!cached) {
      const response = await fetch(request);
      await cache.put(request, response.clone());
    }

    completed += 1;

    if (onProgress) {
      onProgress({
        completed,
        total: tiles.length,
        cached: completed === tiles.length,
      });
    }
  }

  const metadata = {
    ...identity,
    presetId: preset.id,
    presetLabel: preset.label,
    zoomLevels: preset.zoomLevels,
    tileCount: tiles.length,
    urls: tiles.map((tile) => tile.url),
    cachedAt: new Date().toISOString(),
  };

  const existing = readStoredMapPacks();
  const next = existing.filter((pack) => pack.id !== metadata.id);
  next.unshift(metadata);
  writeStoredMapPacks(sortMapPacks(next));

  return metadata;
};

export const removeOfflineMapPack = async (tripId) => {
  requireCacheStorage();

  const packs = readStoredMapPacks();
  const targetPack = packs.find((pack) => pack.id === tripId);

  if (!targetPack) {
    return;
  }

  const cache = await window.caches.open(TILE_CACHE_NAME);

  await Promise.all(
    (targetPack.urls || []).map((url) => cache.delete(new Request(url, { mode: "no-cors" })))
  );

  writeStoredMapPacks(packs.filter((pack) => pack.id !== tripId));
};
