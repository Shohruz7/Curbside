// Shared formatting helpers for Item API responses.
// Kept in one place so every route that returns items (items.js, users.js)
// produces the exact same shape and can never drift out of sync.

// Populate config used whenever we return items to the client.
export const itemPopulate = [
  { path: "postedBy", select: "username email" },
  { path: "reservedBy", select: "username email" },
];

/**
 * Converts a populated user, ObjectId, or missing value into a safe API response.
 */
export function userRefResponse(userRef) {
  if (!userRef) return null;

  // If populated, userRef is an object with _id, username, email.
  if (userRef._id) {
    return {
      id: userRef._id.toString(),
      username: userRef.username,
      email: userRef.email,
    };
  }

  // If not populated, userRef is probably just an ObjectId.
  return userRef.toString();
}

 //Formats an Item document before sending it to the client.
 //This gives the frontend a predictable id field instead of only _id.
 
export function itemResponse(item) {
  const obj = item.toObject ? item.toObject() : item;

  return {
    id: obj._id.toString(),
    title: obj.title,
    description: obj.description,
    photoUrl: obj.photoUrl,
    category: obj.category,
    location: obj.location,
    status: obj.status,
    postedBy: userRefResponse(obj.postedBy),
    reservedBy: userRefResponse(obj.reservedBy),
    reservedUntil: obj.reservedUntil,
    createdAt: obj.createdAt,
    expiresAt: obj.expiresAt,
  };
}
