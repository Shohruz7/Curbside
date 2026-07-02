import { useEffect, useState } from "react";

import MapView from "../components/MapView.jsx";
import ItemCard from "../components/ItemCard.jsx";
import { apiRequest } from "../api/client.js";

const defaultLocation = {
  lat: 40.7128,
  lng: -74.006,
};

export default function Home() {
  const [itemList, setItemList] = useState([]);
  const [location, setLocation] = useState(defaultLocation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadItems(lat, lng) {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        `/items?lat=${lat}&lng=${lng}&radius=5000`
      );

      if (Array.isArray(data.items)) {
        setItemList(data.items);
      } else {
        setItemList([]);
        setError(data.error || "Could not load nearby items.");
      }
    } catch (err) {
      setError("Could not connect to the API.");
      setItemList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      loadItems(defaultLocation.lat, defaultLocation.lng);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocation(userLocation);
        loadItems(userLocation.lat, userLocation.lng);
      },
      () => {
        loadItems(defaultLocation.lat, defaultLocation.lng);
      }
    );
  }, []);

  return (
    <div className="p-4">
      <MapView items={itemList} center={[location.lat, location.lng]} />

      <div className="flex items-center justify-between my-4">
        <h2 className="text-xl font-bold">Nearby items</h2>
        <button
          onClick={() => loadItems(location.lat, location.lng)}
          className="border rounded px-3 py-1 text-sm"
        >
          Refresh
        </button>
      </div>

      {loading && <p>Loading nearby items...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && itemList.length === 0 && !error && (
        <p>No items nearby right now.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {itemList.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
