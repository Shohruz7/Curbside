import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapView({ items = [], center = [40.7128, -74.006] }) {
  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border bg-white shadow-sm">
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {items.map((item) => {
          if (!item.location?.coordinates) return null;

          const [lng, lat] = item.location.coordinates;

          return (
            <Marker key={item.id} position={[lat, lng]}>
              <Popup>
                <div className="min-w-[160px]">
                  <strong>{item.title}</strong>
                  <p className="capitalize text-sm">{item.category}</p>
                  <p className="text-sm">Status: {item.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
