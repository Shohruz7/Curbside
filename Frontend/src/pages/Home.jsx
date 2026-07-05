import { useEffect, useState } from "react";
import { isWithinNyc } from "@curbside/shared";

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
  const [outsideNyc, setOutsideNyc] = useState(false);

  async function loadItems(lat, lng) {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(`/items?lat=${lat}&lng=${lng}&radius=5000`);

      setItemList(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err.message || "Could not load nearby items.");
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
        const { latitude, longitude } = position.coords;

        // All listings are NYC-only. Visitors outside NYC can still browse, but
        // we snap them to the NYC feed (and flag it) so they see real content.
        if (!isWithinNyc([longitude, latitude])) {
          setOutsideNyc(true);
          loadItems(defaultLocation.lat, defaultLocation.lng);
          return;
        }

        const userLocation = { lat: latitude, lng: longitude };
        setLocation(userLocation);
        loadItems(userLocation.lat, userLocation.lng);
      },
      () => {
        loadItems(defaultLocation.lat, defaultLocation.lng);
      }
    );
  }, []);

  return (
    <main>
      <section className="bg-gradient-to-br from-green-50 via-white to-stone-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-700">
              Neighborhood reuse, made simple
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Find free curbside items before they disappear.
            </h1>
            <p className="mt-4 max-w-xl text-gray-600">
              Browse nearby furniture, books, electronics, clothing, and other
              giveaways around NYC on a live map and feed.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="#nearby"
                className="rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
              >
                Browse nearby
              </a>
              <a
                href="/new"
                className="rounded-full border bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                Post an item
              </a>
            </div>
          </div>

          <MapView items={itemList} center={[location.lat, location.lng]} />
        </div>
      </section>

      <section id="nearby" className="mx-auto max-w-6xl px-4 py-10">
        {outsideNyc && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You're browsing NYC listings — posting is limited to NYC.
          </div>
        )}

        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Live feed
            </p>
            <h2 className="text-3xl font-black">Nearby items</h2>
          </div>

          <button
            onClick={() => loadItems(location.lat, location.lng)}
            className="rounded-full border bg-white px-5 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
            Loading nearby items...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && itemList.length === 0 && (
          <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
            <h3 className="text-xl font-bold">No items nearby right now</h3>
            <p className="mt-2 text-gray-600">
              Check back later or post the first giveaway in your area.
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {itemList.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
