// User routes -> /api/users

import express from "express";

import Item from "../models/Item.js";

const router = express.Router();

// GET /api/users/:id/items  (public)
// list all posts created by one user
router.get("/:id/items", async (req, res) => {
  // TODO: find items where postedBy === req.params.id
  res.status(501).json({ error: "user items not implemented yet" });
});

export default router;
