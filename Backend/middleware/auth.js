// Auth middleware
// Put this in front of any route that needs a logged-in user.
// It reads the JWT from the Authorization header and, if valid,
// attaches the user id to req so the route can use it.

import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // expecting "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const tokenString = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(tokenString, process.env.JWT_SECRET);
    req.userId = payload.userId; // routes can read this
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
