// Background job: release expired reservations.
//
// The TTL index on `expiresAt` deletes stale *posts*, but a reservation has a
// separate, shorter lifetime (RESERVATION_WINDOW_MS). When a reservation's
// `reservedUntil` passes, the item should return to `available` so someone else
// can grab it. Nothing else does this, so we sweep on an interval.

import Item from "../models/Item.js";
import { ITEM_STATUS } from "@curbside/shared";

// How often to sweep for expired reservations.
const SWEEP_INTERVAL_MS = 60 * 1000; // 60 seconds

/**
 * Finds every reserved item whose hold has lapsed and returns it to available,
 * clearing the reserver fields. Mirrors the atomic cancel logic in the
 * DELETE /api/items/:id/reserve route, just applied in bulk.
 */
export async function releaseExpiredReservations() {
  try {
    const result = await Item.updateMany(
      {
        status: ITEM_STATUS.RESERVED,
        reservedUntil: { $lte: new Date() },
      },
      {
        $set: { status: ITEM_STATUS.AVAILABLE },
        $unset: { reservedBy: "", reservedUntil: "" },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `Released ${result.modifiedCount} expired reservation(s) back to available`
      );
    }

    return result;
  } catch (err) {
    console.error("Release expired reservations error:", err);
  }
}

/**
 * Runs one sweep immediately, then schedules recurring sweeps.
 * Returns the interval handle so callers can clear it if needed.
 */
export function startReservationReleaser() {
  releaseExpiredReservations();

  const handle = setInterval(releaseExpiredReservations, SWEEP_INTERVAL_MS);

  // Don't let this timer keep the process alive on its own.
  if (typeof handle.unref === "function") {
    handle.unref();
  }

  return handle;
}
