// User routes -> /api/users

import express from "express";
import mongoose from "mongoose";

import Item from "../models/Item.js";
import { itemPopulate, itemResponse } from "../lib/itemFormat.js";

const router = express.Router();

// GET /api/users/:id/items  (public)
// Lists all posts created by one user, newest first.
// Backs the "My Posts" page; returns every status so owners see reserved/claimed
// items too. Expired posts are already removed by the TTL index.
router.get("/:id/items", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const items = await Item.find({ postedBy: req.params.id })
      .sort({ createdAt: -1 })
      .populate(itemPopulate);

    return res.json({
      items: items.map(itemResponse),
    });
  } catch (err) {
    console.error("List user items error:", err);

    return res.status(500).json({
      error: "Failed to list user items",
    });
  }
});

export default router;
