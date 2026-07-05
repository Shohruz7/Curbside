import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getToken, getSavedUser } from "../api/client.js";

// How much of the reservation window is left, as a human label.
// The backend sweep releases expired reservations within ~a minute,
// so "any moment now" covers the short gap before it runs.
function timeLeftLabel(reservedUntil, now) {
  const msLeft = new Date(reservedUntil).getTime() - now;

  if (msLeft <= 0) return "Reservation expiring any moment now";

  const totalMinutes = Math.ceil(msLeft / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `Reserved for another ${hours} hr ${minutes} min`;
  return `Reserved for another ${minutes} min`;
}

export default function ItemCard({ item, onUpdate = () => {} }) {
  const [currentItem, setCurrentItem] = useState(item);
  const [error, setError] = useState("");

  // Re-render every 30s while reserved so the countdown stays fresh.
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (currentItem.status !== "reserved") return;

    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [currentItem.status]);

  const user = getSavedUser();
  const isOwner = user && currentItem.postedBy?.id === user.id;
  const isReserver = user && currentItem.reservedBy?.id === user.id;

  const locationLabel = [currentItem.neighborhood, currentItem.borough]
    .filter(Boolean)
    .join(", ");

  const badge =
    currentItem.status === "available"
      ? "bg-green-100 text-green-800"
      : currentItem.status === "reserved"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-700";

  // Runs a status-changing action (reserve/cancel/claim) and swaps in the
  // updated item the server returns.
  async function runAction(path, method) {
    setError("");

    if (!getToken()) {
      setError("Log in to manage this item.");
      return;
    }

    try {
      const result = await apiRequest(path, { method });
      setCurrentItem(result.item);
      // Let the parent (e.g. ItemDetail) react — after reserving, the response
      // carries the exact coords so the detail map can recenter.
      onUpdate(result.item);
    } catch (err) {
      setError(err.message);
    }
  }

  const handleReserve = () =>
    runAction(`/items/${currentItem.id}/reserve`, "POST");
  const handleCancel = () =>
    runAction(`/items/${currentItem.id}/reserve`, "DELETE");
  const handleClaim = () =>
    runAction(`/items/${currentItem.id}/claim`, "POST");

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
          <Link
            to={`/items/${currentItem.id}`}
            className="text-lg font-bold hover:text-green-700"
          >
            {currentItem.title}
          </Link>
          <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${badge}`}>
            {currentItem.status}
          </span>
        </div>

        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-green-700">
          {currentItem.category || "other"}
        </p>

        {locationLabel && (
          <p className="mt-2 text-sm text-gray-500">📍 {locationLabel}</p>
        )}

        {/* Exact address only comes back from the API for the owner/reserver. */}
        {currentItem.address && (
          <p className="mt-1 text-sm font-medium text-gray-700">
            Pickup address: {currentItem.address}
          </p>
        )}

        {currentItem.status === "reserved" && currentItem.reservedUntil && (
          <p className="mt-2 text-xs font-medium text-yellow-700">
            ⏳ {timeLeftLabel(currentItem.reservedUntil, now)}
          </p>
        )}

        <p className="mt-3 line-clamp-3 text-sm text-gray-600">
          {currentItem.description || "No description provided."}
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {/* Available: anyone but the owner can reserve it. */}
        {currentItem.status === "available" && !isOwner && (
          <button
            onClick={handleReserve}
            className="mt-4 w-full rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Reserve item
          </button>
        )}

        {currentItem.status === "available" && isOwner && (
          <p className="mt-4 text-sm text-gray-500">This is your post.</p>
        )}

        {/* Reserved: reserver can cancel or confirm pickup; owner can confirm pickup. */}
        {currentItem.status === "reserved" && (isReserver || isOwner) && (
          <div className="mt-4 space-y-2">
            {isReserver && (
              <button
                onClick={handleCancel}
                className="w-full rounded-full border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel reservation
              </button>
            )}
            <button
              onClick={handleClaim}
              className="w-full rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Mark as picked up
            </button>
          </div>
        )}

        {currentItem.status === "reserved" && !isReserver && !isOwner && (
          <p className="mt-4 text-sm text-gray-500">Reserved by someone else.</p>
        )}

        {currentItem.status === "claimed" && (
          <p className="mt-4 text-sm text-gray-500">Picked up.</p>
        )}
      </div>
    </article>
  );
}
