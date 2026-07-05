// Cross-cutting constants shared by the Curbside client and server.
// This is the single source of truth: keep enums, limits, and error codes here
// so the API and the UI can never drift out of sync.

// Lifecycle of a giveaway post.
export const ITEM_STATUS = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  CLAIMED: "claimed"
};

// Categories a poster can pick from. Used to populate the form dropdown on the
// client and to validate the `category` field on the server.
export const CATEGORIES = [
  "furniture",
  "electronics",
  "books",
  "clothing",
  "kitchen",
  "toys",
  "other"
];

// How long a reservation holds an item before it is released back to available.
export const RESERVATION_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// Default lifetime of a post. The server sets `expiresAt = now + POST_EXPIRY_MS`
// and a MongoDB TTL index deletes the document once that time passes.
export const POST_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Nearby-search radius defaults (meters), used by GET /api/items.
export const DEFAULT_SEARCH_RADIUS_M = 2000; // 2 km
export const MAX_SEARCH_RADIUS_M = 20000; // 20 km

// Rough bounding box for New York City. Handy for sanity-checking that a
// submitted location is actually in the service area.
export const NYC_BOUNDS = {
  minLat: 40.4774,
  maxLat: 40.9176,
  minLng: -74.2591,
  maxLng: -73.7004
};

// Validate a GeoJSON coordinate pair. Note the order: [longitude, latitude].
export function isValidLngLat(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  const [lng, lat] = coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") return false;
  if (Number.isNaN(lng) || Number.isNaN(lat)) return false;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

// Returns true if a [lng, lat] pair falls inside the NYC bounding box.
export function isWithinNyc(coordinates) {
  if (!isValidLngLat(coordinates)) return false;
  const [lng, lat] = coordinates;
  return (
    lat >= NYC_BOUNDS.minLat &&
    lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng &&
    lng <= NYC_BOUNDS.maxLng
  );
}

// Field constraints, shared so client-side and server-side validation agree.
export const VALIDATION = {
  username: { min: 3, max: 30 },
  password: { min: 8 },
  title: { max: 100 },
  description: { max: 1000 },
  address: { max: 200 }
};

// Stable error codes the API returns and the client can switch on. Keeping the
// codes here (rather than matching on message strings) lets the UI react to
// specific failures without breaking when wording changes.
export const API_ERRORS = {
  VALIDATION: { code: "validation_error", message: "Request validation failed" },
  UNAUTHORIZED: { code: "unauthorized", message: "Authentication required" },
  FORBIDDEN: { code: "forbidden", message: "You do not have permission to do that" },
  NOT_FOUND: { code: "not_found", message: "Resource not found" },
  CONFLICT: { code: "conflict", message: "Resource already exists or is in use" },
  ITEM_UNAVAILABLE: { code: "item_unavailable", message: "Item is no longer available" }
};
