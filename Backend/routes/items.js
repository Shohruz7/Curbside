// Item routes -> /api/items
// This is the heart of the app: posting, browsing, reserving, claiming.
// Most handlers are stubs for now.

import express from "express";

import Item from "../models/Item.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/items  (public)
// list nearby items using lat, lng, radius (+ optional status/category filters)
router.get("/", async (req, res) => {
  const { lat, lng, radius, status, category } = req.query;

  // TODO: build a $near query against the 2dsphere index using lat/lng/radius
  // TODO: add status/category to the filter if they were passed

  res.status(501).json({ error: "list items not implemented yet" });
});

// GET /api/items/:id  (public)
router.get("/:id", async (req, res) => {
  // TODO: find the item by req.params.id, 404 if missing
  res.status(501).json({ error: "get item not implemented yet" });
});

// POST /api/items  (auth required)
router.post("/", requireAuth, async (req, res) => {
  // TODO: validate body, set postedBy = req.userId, set expiresAt, create item
  res.status(501).json({ error: "create item not implemented yet" });
});

// PATCH /api/items/:id  (owner only)
router.patch("/:id", requireAuth, async (req, res) => {
  // TODO: make sure the item's postedBy matches req.userId before editing
  res.status(501).json({ error: "edit item not implemented yet" });
});

// DELETE /api/items/:id  (owner only)
router.delete("/:id", requireAuth, async (req, res) => {
  // TODO: owner check, then delete
  res.status(501).json({ error: "delete item not implemented yet" });
});

// POST /api/items/:id/reserve  (auth required)
router.post("/:id/reserve", requireAuth, async (req, res) => {
  // IMPORTANT: use an atomic findOneAndUpdate that only matches an available
  // item so two people can't reserve the same thing at once (see design doc).
  // Also: a user should not be able to reserve their own post.
  res.status(501).json({ error: "reserve not implemented yet" });
});

// DELETE /api/items/:id/reserve  (auth required)
router.delete("/:id/reserve", requireAuth, async (req, res) => {
  // TODO: only the person who reserved it can cancel; set status back to available
  res.status(501).json({ error: "cancel reservation not implemented yet" });
});

// POST /api/items/:id/claim  (auth required)
router.post("/:id/claim", requireAuth, async (req, res) => {
  // TODO: mark the item as claimed (picked up)
  res.status(501).json({ error: "claim not implemented yet" });
});

export default router;
