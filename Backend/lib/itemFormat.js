// Shared formatting helpers for Item API responses.
// Kept in one place so every route that returns items (items.js, users.js)
// produces the exact same shape and can never drift out of sync.
//
// This is also the privacy gate: the exact street address and precise
// coordinates are only ever serialized for the item's owner or its current
// reserver. Everyone else gets the coarse neighborhood/borough and a fuzzed
// map pin. Because all item responses flow through itemResponse(), gating here
// means no route can accidentally leak an address.

// Populate config used whenever we return items to the client.
// NOTE: we deliberately do NOT select `email` — it must never reach the client.
export const itemPopulate = [
  { path: "postedBy", select: "username" },
  { path: "reservedBy", select: "username" },
];

// Coordinate precision (decimal places) shown to non-privileged viewers.
// 3 decimals ~= 110m of latitude. We round (deterministic) rather than add
// random jitter so repeated requests can't be averaged to recover the point.
const FUZZ_DECIMALS = 3;

/**
 * Converts a populated user, ObjectId, or missing value into a safe API response.
 */
export function userRefResponse(userRef) {
  if (!userRef) return null;

  // If populated, userRef is an object with _id and username (never email).
  if (userRef._id) {
    return {
      id: userRef._id.toString(),
      username: userRef.username,
    };
  }

  // If not populated, userRef is probably just an ObjectId.
  return userRef.toString();
}

/**
 * Extracts a string id from a user ref that may be a populated doc, a raw
 * ObjectId, or missing.
 */
function refId(userRef) {
  const raw = userRef?._id ?? userRef;
  return raw ? raw.toString() : undefined;
}

/**
 * Rounds a [lng, lat] pair to FUZZ_DECIMALS so the public sees only an
 * approximate location.
 */
function fuzzCoordinates(coordinates) {
  if (!Array.isArray(coordinates)) return coordinates;
  const factor = 10 ** FUZZ_DECIMALS;
  return coordinates.map((n) => Math.round(n * factor) / factor);
}

/**
 * Formats an Item document before sending it to the client.
 * @param {object} item   Mongoose Item document (populated) or plain object.
 * @param {string} [viewerId]  The requesting user's id (from optionalAuth /
 *   requireAuth). When it matches the owner or current reserver, the exact
 *   address and precise coordinates are included; otherwise they are withheld.
 */
export function itemResponse(item, viewerId) {
  const obj = item.toObject ? item.toObject() : item;

  const isOwner = Boolean(viewerId) && viewerId === refId(obj.postedBy);
  const isReserver = Boolean(viewerId) && viewerId === refId(obj.reservedBy);
  const privileged = isOwner || isReserver;

  const location = privileged
    ? obj.location
    : obj.location && {
        ...obj.location,
        coordinates: fuzzCoordinates(obj.location.coordinates),
      };

  const response = {
    id: obj._id.toString(),
    title: obj.title,
    description: obj.description,
    photoUrl: obj.photoUrl,
    category: obj.category,
    location,
    neighborhood: obj.neighborhood,
    borough: obj.borough,
    locationIsApproximate: !privileged,
    status: obj.status,
    postedBy: userRefResponse(obj.postedBy),
    reservedBy: userRefResponse(obj.reservedBy),
    reservedUntil: obj.reservedUntil,
    createdAt: obj.createdAt,
    expiresAt: obj.expiresAt,
  };

  // Exact street address is owner/reserver-only.
  if (privileged) {
    response.address = obj.address;
  }

  return response;
}
