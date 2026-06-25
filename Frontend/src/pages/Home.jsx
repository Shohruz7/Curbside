// Home page = the map + the feed of nearby items.

import { useEffect, useState } from "react";

import MapView from "../components/MapView.jsx";
import ItemCard from "../components/ItemCard.jsx";
import { apiRequest } from "../api/client.js";

export default function Home() {
  const [itemList, setItemList] = useState([]);

  // load nearby items when the page first renders
  useEffect(() => {
    // TODO: get the user's lat/lng (geolocation) and pass them as query params
    // TODO: refetch when the map is panned/zoomed
    apiRequest("/items").then((data) => {
      // guard in case the API isn't ready yet
      if (Array.isArray(data)) setItemList(data);
    });
  }, []);

  return (
    <div className="p-4">
      <MapView items={itemList} />

      <h2 className="text-xl font-bold my-4">Nearby items</h2>

      {/* empty state */}
      {itemList.length === 0 && <p>No items nearby right now.</p>}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {itemList.map((item) => (
          <ItemCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}
