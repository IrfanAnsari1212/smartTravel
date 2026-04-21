import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";

function FitBounds({ positions, currentLocation, shouldFollowUser, focusedPlace }) {
  const map = useMap();

  useEffect(() => {
    if (focusedPlace) {
      map.flyTo([focusedPlace.lat, focusedPlace.lon], Math.max(map.getZoom(), 14), {
        animate: true,
        duration: 0.75,
      });
      return;
    }

    if (shouldFollowUser && currentLocation) {
      map.flyTo([currentLocation.lat, currentLocation.lon], Math.max(map.getZoom(), 14), {
        animate: true,
        duration: 0.75,
      });
      return;
    }

    if (positions.length > 0) {
      map.fitBounds(positions);
    }
  }, [currentLocation, focusedPlace, map, positions, shouldFollowUser]);

  return null;
}

function buildOfflinePath(positions) {
  if (!positions.length) {
    return { path: "", markers: [], viewBox: "0 0 900 500" };
  }

  const width = 900;
  const height = 500;
  const padding = 48;
  const lats = positions.map(([lat]) => lat);
  const lons = positions.map(([, lon]) => lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latRange = maxLat - minLat || 1;
  const lonRange = maxLon - minLon || 1;

  const toPoint = ([lat, lon]) => {
    const x =
      padding + ((lon - minLon) / lonRange) * (width - padding * 2);
    const y =
      height - padding - ((lat - minLat) / latRange) * (height - padding * 2);

    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  };

  const svgPoints = positions.map(toPoint);
  const path = svgPoints
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  return {
    path,
    markers: svgPoints,
    viewBox: `0 0 ${width} ${height}`,
  };
}

function OfflineRoutePreview({ route, positions, places, currentLocation, isNavigating }) {
  const { path, markers, viewBox } = useMemo(
    () => buildOfflinePath(positions),
    [positions]
  );

  if (!route || !positions.length) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 text-slate-400">
        Save or import a route pack to view it offline.
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950/60">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-sm font-medium text-white">Offline Route View</p>
          <p className="text-xs text-slate-400">
            App shell and saved route data are available without live map tiles.
          </p>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
          {places.length} saved stops
        </span>
      </div>

      <div className="flex-1 px-5 pb-5 pt-20">
        <div className="h-full rounded-[28px] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-cyan-950/30">
          <svg viewBox={viewBox} className="h-full w-full">
            <defs>
              <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>

            <rect width="100%" height="100%" rx="24" fill="#020617" />
            <path
              d={path}
              fill="none"
              stroke="rgba(34,211,238,0.25)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d={path}
              fill="none"
              stroke="url(#routeGlow)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {markers[0] && (
              <circle cx={markers[0][0]} cy={markers[0][1]} r="10" fill="#f8fafc" />
            )}
            {markers[markers.length - 1] && (
              <circle
                cx={markers[markers.length - 1][0]}
                cy={markers[markers.length - 1][1]}
                r="10"
                fill="#22d3ee"
              />
            )}

            {places.slice(0, 10).map((place, index) => {
              const routePoint = markers[Math.floor(((index + 1) / 11) * markers.length)];

              if (!routePoint) {
                return null;
              }

              return (
                <g key={place.id || `${place.name}-${index}`}>
                  <circle
                    cx={routePoint[0]}
                    cy={routePoint[1]}
                    r="5"
                    fill="#f59e0b"
                    stroke="#fef3c7"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>

          {isNavigating && currentLocation && (
            <div className="absolute bottom-6 left-6 rounded-2xl border border-cyan-400/20 bg-slate-950/85 px-4 py-3 text-sm text-slate-200">
              <p className="font-medium text-cyan-100">Live Trip Active</p>
              <p className="mt-1 text-xs text-slate-400">
                Current location: {currentLocation.lat.toFixed(5)},{" "}
                {currentLocation.lon.toFixed(5)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CachedTileBadge({ isOffline, hasOfflineMap }) {
  if (isOffline && hasOfflineMap) {
    return (
      <div className="absolute left-4 top-4 z-[500] rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100 backdrop-blur">
        Offline map tiles loaded
      </div>
    );
  }

  if (!isOffline && hasOfflineMap) {
    return (
      <div className="absolute left-4 top-4 z-[500] rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100 backdrop-blur">
        Route map pack ready
      </div>
    );
  }

  return null;
}

export default function MapView({
  route,
  isOffline,
  hasOfflineMap,
  currentLocation,
  isNavigating,
  focusedPlace,
}) {
  const positions = route
    ? route.geometry.coordinates.map((coord) => [coord[1], coord[0]])
    : [];
  const places = route?.places || [];

  if (isOffline && !hasOfflineMap) {
    return (
      <OfflineRoutePreview
        route={route}
        positions={positions}
        places={places}
        currentLocation={currentLocation}
        isNavigating={isNavigating}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <CachedTileBadge isOffline={isOffline} hasOfflineMap={hasOfflineMap} />
      <MapContainer
        center={[28.6139, 77.209]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds
          positions={positions}
          currentLocation={currentLocation}
          shouldFollowUser={isNavigating}
          focusedPlace={focusedPlace}
        />
        {positions.length > 0 && <Polyline positions={positions} />}
        {places.map((place, index) => (
          <Marker key={place.id || index} position={[place.lat, place.lon]}>
            <Popup>
              <b>{place.name || "Unknown Place"}</b>
            </Popup>
          </Marker>
        ))}
        {currentLocation && (
          <>
            <Circle
              center={[currentLocation.lat, currentLocation.lon]}
              radius={Math.max(currentLocation.accuracy || 20, 20)}
              pathOptions={{
                color: "#22d3ee",
                fillColor: "#22d3ee",
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
            <Marker position={[currentLocation.lat, currentLocation.lon]}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">Your Live Location</p>
                  <p>Accuracy: {Math.round(currentLocation.accuracy || 0)} m</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
        {focusedPlace && (
          <Circle
            center={[focusedPlace.lat, focusedPlace.lon]}
            radius={90}
            pathOptions={{
              color: "#fb7185",
              fillColor: "#fb7185",
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
