import { useState } from "react";
import { apiRequest, getToken } from "../api/client.js";

export default function ItemCard({ item }) {
  const [currentItem, setCurrentItem] = useState(item);
  const [error, setError] = useState("");

  const badge =
    currentItem.status === "available"
      ? "bg-green-100 text-green-800"
      : currentItem.status === "reserved"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-700";

  async function handleReserve() {
    setError("");

    if (!getToken()) {
      setError("Log in to reserve this item.");
      return;
    }

    try {
      const result = await apiRequest(`/items/${currentItem.id}/reserve`, {
        method: "POST"
      });
      setCurrentItem(result.item);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {currentItem.photoUrl ? (
        <img
          src={currentItem.photoUrl}
          alt={currentItem.title}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-green-50 to-stone-100 text-gray-500">
          No photo yet
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold">{currentItem.title}</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${badge}`}>
            {currentItem.status}
          </span>
        </div>

        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-green-700">
          {currentItem.category || "other"}
        </p>

        <p className="mt-3 line-clamp-3 text-sm text-gray-600">
          {currentItem.description || "No description provided."}
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {currentItem.status === "available" && (
          <button
            onClick={handleReserve}
            className="mt-4 w-full rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Reserve item
          </button>
        )}
      </div>
    </article>
  );
}
