import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

import { apiRequest, getToken, getSavedUser } from "../api/client.js";

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

// Popup body with a Reserve action, so users can reserve straight from the map.
function MapItemPopup({ item, onUpdate }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const user = getSavedUser();
  const isOwner = user && item.postedBy?.id === user.id;
  const isReserver = user && item.reservedBy?.id === user.id;
  const place = [item.neighborhood, item.borough].filter(Boolean).join(", ");

  // Reserve (POST) and unreserve (DELETE) both hit /reserve and swap in the
  // updated item, which recolors the pin and re-renders this popup.
  async function runAction(method) {
    setError("");
    if (!getToken()) {
      setError("Log in to manage this item.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiRequest(`/items/${item.id}/reserve`, { method });
      onUpdate(res.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const reserve = () => runAction("POST");
  const unreserve = () => runAction("DELETE");

  return (
    <Popup minWidth={210}>
      {/* Fixed width so Leaflet sizes the popup correctly and the image
          actually renders (percentage widths race the popup's own sizing). */}
      <div className="w-[200px]">
        {item.photoUrl && (
          <img
            src={item.photoUrl}
            alt=""
            className="mb-2 h-28 w-[200px] rounded-lg object-cover"
          />
        )}

        <Link
          to={`/items/${item.id}`}
          className="block font-bold text-green-700 hover:underline"
        >
          {item.title}
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {item.category || "other"}
        </p>
        {place && <p className="text-sm text-gray-600">📍 {place}</p>}

        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

        {item.status === "available" && !isOwner && (
          <button
            onClick={reserve}
            disabled={busy}
            className="mt-2 w-full rounded-full bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Reserving…" : "Reserve item"}
          </button>
        )}
        {item.status === "available" && isOwner && (
          <p className="mt-2 text-xs text-gray-500">This is your post.</p>
        )}
        {item.status === "reserved" && isReserver && (
          <button
            onClick={unreserve}
            disabled={busy}
            className="mt-2 w-full rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Unreserving…" : "Unreserve"}
          </button>
        )}
        {item.status === "reserved" && !isReserver && (
          <p className="mt-2 text-xs font-medium text-amber-700">Reserved</p>
        )}
        {item.status === "claimed" && (
          <p className="mt-2 text-xs text-gray-500">Picked up.</p>
        )}
      </div>
    </Popup>
  );
}

export default function MapView({ items = [], center = [40.7128, -74.006] }) {
  // Local overrides let a reserve action update the pin + popup in place
  // without the parent having to refetch.
  const [overrides, setOverrides] = useState({});
  const merged = items.map((i) => overrides[i.id] || i);
  const handleUpdate = (it) => setOverrides((o) => ({ ...o, [it.id]: it }));

  // Fit uses the original items so reserving (which can reveal exact coords)
  // doesn't re-pan the map.
  const basePoints = items
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

        <FitToMarkers points={basePoints} />

        {merged.map((item) => {
          if (!item.location?.coordinates) return null;

          const [lng, lat] = item.location.coordinates;

          return (
            <Marker
              key={item.id}
              position={[lat, lng]}
              icon={pinIcon(item.status)}
            >
              <MapItemPopup item={item} onUpdate={handleUpdate} />
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
