// Forward geocoding via Nominatim (OpenStreetMap). Free, no API key.
// Turns a street address the poster typed into { coordinates, neighborhood,
// borough } so we can store an exact location while showing the public only a
// coarse neighborhood/borough.
//
// Nominatim usage policy: a descriptive User-Agent with contact info is
// REQUIRED (requests without one may be blocked), and there is a ~1 req/sec
// courtesy limit. That's fine for interactive posting; the seed script hardcodes
// coordinates instead of calling this.

import { NYC_BOUNDS } from "@curbside/shared";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Descriptive UA is mandatory per Nominatim policy. Override via env in prod.
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  "curbside-app/0.1 (contact: shohruzabd19@gmail.com)";

const REQUEST_TIMEOUT_MS = 8000;

// NYC counties -> borough names. Nominatim often labels the borough only via
// the county for NYC results, so this is the reliable fallback.
const COUNTY_TO_BOROUGH = {
  "Kings County": "Brooklyn",
  "New York County": "Manhattan",
  "Queens County": "Queens",
  "Bronx County": "Bronx",
  "Richmond County": "Staten Island",
};

/**
 * Pulls a coarse borough label out of a Nominatim `address` object.
 * The key that holds the borough varies by result type, so we try several.
 */
function extractBorough(address) {
  if (!address) return undefined;
  return (
    address.borough ||
    address.city_district ||
    COUNTY_TO_BOROUGH[address.county] ||
    address.suburb ||
    undefined
  );
}

/**
 * Pulls a neighborhood label out of a Nominatim `address` object, falling back
 * to the borough so the UI always has something coarse to show.
 */
function extractNeighborhood(address, borough) {
  if (!address) return borough;
  return (
    address.neighbourhood ||
    address.quarter ||
    address.residential ||
    address.suburb ||
    borough
  );
}

/**
 * Geocodes a free-text address.
 * @returns {Promise<{coordinates: [number, number], neighborhood?: string, borough?: string} | null>}
 *   null when Nominatim finds no match. Throws on network/HTTP failure so the
 *   caller can distinguish "bad address" (400) from "lookup unavailable" (502).
 */
export async function geocodeAddress(address) {
  // viewbox biases results toward NYC. We deliberately DO NOT pass bounded=1 so
  // a valid non-NYC address still geocodes -> the route can then return the
  // specific "must be inside NYC" error instead of a misleading "not found".
  const viewbox = [
    NYC_BOUNDS.minLng,
    NYC_BOUNDS.maxLat,
    NYC_BOUNDS.maxLng,
    NYC_BOUNDS.minLat,
  ].join(",");

  const params = new URLSearchParams({
    q: address,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    countrycodes: "us",
    viewbox,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Nominatim responded ${response.status}`);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const match = results[0];
  const lat = Number(match.lat);
  const lng = Number(match.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const borough = extractBorough(match.address);

  return {
    coordinates: [lng, lat], // GeoJSON order
    neighborhood: extractNeighborhood(match.address, borough),
    borough,
  };
}
