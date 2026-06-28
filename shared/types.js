// Shared JSDoc typedefs describing the shapes that cross the client/server
// boundary. There is no runtime export here — importing this file is enough for
// editors to pick up the `@typedef`s for autocomplete and inline hints.
//
// Usage in either package:
//   /** @typedef {import("@curbside/shared").Item} Item */

/**
 * GeoJSON Point. Coordinates are [longitude, latitude] (note the order!).
 * @typedef {Object} GeoPoint
 * @property {"Point"} type
 * @property {[number, number]} coordinates
 */

/**
 * A public user record (never includes passwordHash).
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {string} createdAt - ISO timestamp
 */

/**
 * A giveaway post.
 * @typedef {Object} Item
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [photoUrl] - Cloudinary URL
 * @property {string} [category] - one of CATEGORIES
 * @property {GeoPoint} location
 * @property {"available"|"reserved"|"claimed"} status
 * @property {string} postedBy - user id
 * @property {string} [reservedBy] - user id
 * @property {string} [reservedUntil] - ISO timestamp
 * @property {string} createdAt - ISO timestamp
 * @property {string} [expiresAt] - ISO timestamp
 */

/**
 * Standard error envelope returned by the API.
 * @typedef {Object} ApiError
 * @property {string} code - one of API_ERRORS codes
 * @property {string} error - human-readable message
 */

/**
 * Response from register/login.
 * @typedef {Object} AuthResponse
 * @property {string} token - JWT
 * @property {User} user
 */

export {};
