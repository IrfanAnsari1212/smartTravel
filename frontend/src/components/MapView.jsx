
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

function FitBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions);
    }
  }, [map, positions]);

  return null;
}

export default function MapView({ route }) {
  const positions = route
    ? route.geometry.coordinates.map((coord) => [coord[1], coord[0]])
    : [];

  const places = route?.places || [];

  return (
    <MapContainer
      center={[28.6139, 77.209]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <FitBounds positions={positions} />

      {positions.length > 0 && <Polyline positions={positions} />}

      {places.map((place, index) => (
        <Marker key={index} position={[place.lat, place.lon]}>
          <Popup>
            <b>{place.tags?.name || "Unknown Place"}</b>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
