// Leaflet map showing nearby items as markers.
// Uses react-leaflet. Takes an `items` array as a prop.

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// default map center -> roughly NYC (used if geolocation is denied)
const defaultCenter = [40.7128, -74.006];

export default function MapView({ items = [] }) {
  return (
    <MapContainer center={defaultCenter} zoom={13} style={{ height: "400px" }}>
      {/* the actual map tiles (OpenStreetMap is free) */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* drop a marker for each item */}
      {items.map((item) => {
        // remember: coordinates are stored [lng, lat], Leaflet wants [lat, lng]
        const lng = item.location.coordinates[0];
        const lat = item.location.coordinates[1];

        return (
          <Marker key={item._id} position={[lat, lng]}>
            <Popup>{item.title}</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
