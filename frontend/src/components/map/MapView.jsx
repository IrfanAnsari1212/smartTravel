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
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const createNumberedIcon = (number) =>
  L.divIcon({
    className: "custom-map-pin",
    html: `<div style="background:#0f172a; border:2px solid #38bdf8; color:#38bdf8; border-radius:9999px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:11px; box-shadow:0 4px 10px rgba(0,0,0,0.6);">${number}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const startIcon = L.divIcon({
  className: "custom-map-pin-start",
  html: `<div style="background:#059669; border:2px solid #fff; color:#fff; border-radius:9999px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:11px; box-shadow:0 4px 10px rgba(5,150,105,0.6);">A</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const destIcon = L.divIcon({
  className: "custom-map-pin-dest",
  html: `<div style="background:#e11d48; border:2px solid #fff; color:#fff; border-radius:9999px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; box-shadow:0 4px 10px rgba(225,29,72,0.6);">🏁</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

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

function buildOfflinePath(positions, places = [], waypoints = []) {
  if (!positions.length) {
    return { path: "", markers: [], placePoints: [], waypointPoints: [], viewBox: "0 0 900 500" };
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

  const placePoints = places
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => ({
      id: p.id,
      name: p.name,
      point: toPoint([p.lat, p.lon]),
    }));

  const waypointPoints = (waypoints || [])
    .filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lon))
    .map((w, idx) => ({
      index: idx + 1,
      name: w.name,
      point: toPoint([w.lat, w.lon]),
    }));

  return {
    path,
    markers: [
      { label: "Start", point: svgPoints[0], tone: "emerald" },
      {
        label: "Destination",
        point: svgPoints[svgPoints.length - 1],
        tone: "cyan",
      },
    ],
    placePoints,
    waypointPoints,
    viewBox: `0 0 ${width} ${height}`,
  };
}

function OfflineRoutePreview({
  route,
  positions,
  places,
}) {
  const offlinePath = useMemo(
    () => buildOfflinePath(positions, places, route?.waypoints),
    [positions, places, route?.waypoints]
  );

  return (
    <div className="relative flex h-full min-h-[460px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Offline Mode
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Vector Route View
          </h2>
        </div>
        <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
          Tiles Unavailable
        </div>
      </div>

      <div className="relative my-4 flex flex-1 items-center justify-center">
        <svg
          viewBox={offlinePath.viewBox}
          className="h-full max-h-[340px] w-full"
          role="img"
          aria-label="Offline Route Path"
        >
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path
            d={offlinePath.path}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {offlinePath.markers.map((marker) => (
            <g key={marker.label} transform={`translate(${marker.point[0]}, ${marker.point[1]})`}>
              <circle
                r="7"
                fill={marker.tone === "emerald" ? "#34d399" : "#22d3ee"}
                stroke="#020617"
                strokeWidth="2"
              />
              <text
                y="-12"
                textAnchor="middle"
                className="fill-slate-300 text-[10px] font-medium"
              >
                {marker.label}
              </text>
            </g>
          ))}
          {offlinePath.waypointPoints.map((wp) => (
            <g key={wp.index} transform={`translate(${wp.point[0]}, ${wp.point[1]})`}>
              <circle r="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <text y="3" textAnchor="middle" className="fill-cyan-300 text-[9px] font-bold">
                {wp.index}
              </text>
            </g>
          ))}
          {offlinePath.placePoints.map((place) => (
            <g key={place.id} transform={`translate(${place.point[0]}, ${place.point[1]})`}>
              <circle r="4" fill="#fb7185" />
            </g>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs text-slate-400">
        <span>Start: {route?.start?.name || "Route Start"}</span>
        {route?.waypoints?.length > 0 && (
          <span>{route.waypoints.length} intermediate stops</span>
        )}
        <span>Destination: {route?.destination?.name || "Destination"}</span>
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

function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const triggerInvalidate = () => {
      map.invalidateSize();
    };
    triggerInvalidate();
    const t1 = setTimeout(triggerInvalidate, 200);
    const t2 = setTimeout(triggerInvalidate, 600);
    window.addEventListener("resize", triggerInvalidate);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", triggerInvalidate);
    };
  }, [map]);
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
  const positions = useMemo(
    () =>
      route?.geometry?.coordinates
        ? route.geometry.coordinates.map((coord) => [coord[1], coord[0]])
        : [],
    [route]
  );
  const places = useMemo(() => route?.places || [], [route]);
  const waypoints = useMemo(() => route?.waypoints || [], [route]);

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
    <div className="relative h-full w-full overflow-hidden isolate z-0">
      <CachedTileBadge isOffline={isOffline} hasOfflineMap={hasOfflineMap} />
      <MapContainer
        center={[28.6139, 77.209]}
        zoom={5}
        style={{ height: "100%", width: "100%", position: "relative", zIndex: 0 }}
      >
        <ResizeHandler />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds
          positions={positions}
          currentLocation={currentLocation}
          shouldFollowUser={isNavigating}
          focusedPlace={focusedPlace}
        />
        {positions.length > 0 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: "#06b6d4", weight: 5, opacity: 0.85 }}
          />
        )}

        {/* Start Point Marker */}
        {route?.start && (
          <Marker position={[route.start.lat, route.start.lon]} icon={startIcon}>
            <Popup>
              <b>Start: {route.start.name || "Origin"}</b>
            </Popup>
          </Marker>
        )}

        {/* Intermediate Waypoint Markers */}
        {waypoints.map((wp, idx) => (
          <Marker
            key={idx}
            position={[wp.lat, wp.lon]}
            icon={createNumberedIcon(idx + 1)}
          >
            <Popup>
              <b>Stop {idx + 1}: {wp.name || `Waypoint ${idx + 1}`}</b>
            </Popup>
          </Marker>
        ))}

        {/* Destination Marker */}
        {route?.destination && (
          <Marker position={[route.destination.lat, route.destination.lon]} icon={destIcon}>
            <Popup>
              <b>Destination: {route.destination.name || "Destination"}</b>
            </Popup>
          </Marker>
        )}

        {/* Places Markers */}
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
