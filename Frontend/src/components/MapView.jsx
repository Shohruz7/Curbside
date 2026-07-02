import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapView({ items = [], center = [40.7128, -74.006] }) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-[400px] w-full rounded border"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {items.map((item) => {
        if (!item.location?.coordinates) return null;

        const [lng, lat] = item.location.coordinates;

        return (
          <Marker key={item.id} position={[lat, lng]}>
            <Popup>
              <div>
                <strong>{item.title}</strong>
                <p>{item.category}</p>
                <p>Status: {item.status}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
