import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import MapView from "../components/MapView.jsx";
import ItemCard from "../components/ItemCard.jsx";
import { apiRequest } from "../api/client.js";

export default function ItemDetail() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadItem() {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest(`/items/${id}`);

        if (active) setItem(data.item);
      } catch (err) {
        if (active) setError(err.message || "Could not load this item.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadItem();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
          Loading item...
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          {error || "Item not found."}
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-semibold text-green-700 hover:underline">
            Back to nearby items
          </Link>
        </div>
      </main>
    );
  }

  const coordinates = item.location?.coordinates;
  const center = coordinates ? [coordinates[1], coordinates[0]] : undefined;
  const postedAt = item.createdAt ? new Date(item.createdAt).toLocaleString() : null;
  const locationLabel = [item.neighborhood, item.borough].filter(Boolean).join(", ");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/" className="text-sm font-semibold text-green-700 hover:underline">
        ← Back to nearby items
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <section>
          <h1 className="text-4xl font-black tracking-tight">{item.title}</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-green-700">
            {item.category || "other"}
          </p>

          <div className="mt-4 space-y-1 text-sm text-gray-600">
            {item.postedBy?.username && <p>Posted by {item.postedBy.username}</p>}
            {locationLabel && <p>📍 {locationLabel}</p>}
            {item.address && <p className="font-medium text-gray-800">Pickup address: {item.address}</p>}
            {postedAt && <p>Posted {postedAt}</p>}
          </div>

          <p className="mt-6 whitespace-pre-line text-gray-700">
            {item.description || "No description provided."}
          </p>

          {center && (
            <div className="mt-6">
              <MapView items={[item]} center={center} />
              {item.locationIsApproximate && (
                <p className="mt-2 text-sm text-gray-500">
                  Approximate location — the exact address is shown after you reserve.
                </p>
              )}
            </div>
          )}
        </section>

        <aside>
          {/* Reuse ItemCard so reserve/cancel/claim behavior stays in one place.
              onUpdate keeps this page's item (and its map) in sync after actions. */}
          <ItemCard item={item} onUpdate={setItem} />
        </aside>
      </div>
    </main>
  );
}
