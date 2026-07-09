import { useEffect } from "react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

// Pin color per status, matching the card status badges.
const STATUS_COLOR = {
  available: "#15803d", // green-700
  reserved: "#b45309", // amber-700
  claimed: "#6b7280", // gray-500
};

// Custom SVG pin. Using a divIcon avoids Leaflet's default marker-icon.png,
// which doesn't resolve under Vite bundling (that was the broken "Mark" boxes).
function pinIcon(status) {
  const color = STATUS_COLOR[status] || STATUS_COLOR.available;
  return L.divIcon({
    className: "curbside-pin",
    html: `<svg width="26" height="38" viewBox="0 0 26 38" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 0C5.82 0 0 5.82 0 13c0 8.6 11.1 23.2 11.9 24.2.55.72 1.65.72 2.2 0C14.9 36.2 26 21.6 26 13 26 5.82 20.18 0 13 0z" fill="${color}"/>
        <circle cx="13" cy="13" r="4.6" fill="#ffffff"/>
      </svg>`,
    iconSize: [26, 38],
    iconAnchor: [13, 38], // tip of the pin
    popupAnchor: [0, -34],
  });
}

// Pans/zooms the map so every listing pin is visible.
function FitToMarkers({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function MapView({ items = [], center = [40.7128, -74.006] }) {
  const points = items
    .filter((i) => i.location?.coordinates)
    .map((i) => {
      const [lng, lat] = i.location.coordinates;
      return [lat, lng];
    });

  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border bg-white shadow-sm">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        {/* CARTO Voyager: cleaner, more modern basemap than raw OSM tiles. */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
        />

        <FitToMarkers points={points} />

        {items.map((item) => {
          if (!item.location?.coordinates) return null;

          const [lng, lat] = item.location.coordinates;
          const place = [item.neighborhood, item.borough].filter(Boolean).join(", ");

          return (
            <Marker key={item.id} position={[lat, lng]} icon={pinIcon(item.status)}>
              <Popup>
                <div className="min-w-[170px]">
                  {item.photoUrl && (
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="mb-2 h-20 w-full rounded object-cover"
                    />
                  )}
                  <Link
                    to={`/items/${item.id}`}
                    className="font-bold text-green-700 hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {item.category || "other"}
                  </p>
                  {place && <p className="text-sm text-gray-600">📍 {place}</p>}
                  <p className="text-sm capitalize text-gray-600">
                    Status: {item.status}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
