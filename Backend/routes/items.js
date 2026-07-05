// Item routes -> /api/items
// This is the core of the app: browsing, posting, editing, deleting,
// reserving, canceling reservations, and claiming picked-up items.

import express from "express";
import mongoose from "mongoose";

import Item from "../models/Item.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { itemPopulate, itemResponse } from "../lib/itemFormat.js";
import { geocodeAddress } from "../lib/geocode.js";

import {
  ITEM_STATUS,
  CATEGORIES,
  RESERVATION_WINDOW_MS,
  POST_EXPIRY_MS,
  DEFAULT_SEARCH_RADIUS_M,
  MAX_SEARCH_RADIUS_M,
  VALIDATION,
  isValidLngLat,
  isWithinNyc,
} from "@curbside/shared";

const router = express.Router();

/**
 * Checks whether a MongoDB id is valid before passing it to Mongoose.
 * This prevents ugly CastError responses for bad ids.
 */
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Sentinel error used by resolveAddress so the route can map geocoder trouble
// to a 502 (temporary) instead of a 400 (bad input) or a generic 500.
class GeocodeUnavailableError extends Error {}

/**
 * Turns a free-text address from the request body into the location fields we
 * store: { address, neighborhood, borough, coordinates }.
 *
 * Throws with a `.status` so the caller can just forward it:
 *   400 - address missing / too long / not found / outside NYC
 *   502 - geocoding service failed (network/HTTP/timeout)
 */
async function resolveAddress(rawAddress) {
  const address = String(rawAddress || "").trim();
  const maxLen = VALIDATION?.address?.max ?? 200;

  if (!address) {
    const err = new Error("Address is required");
    err.status = 400;
    throw err;
  }
  if (address.length > maxLen) {
    const err = new Error(`Address must be ${maxLen} characters or less`);
    err.status = 400;
    throw err;
  }

  let geo;
  try {
    geo = await geocodeAddress(address);
  } catch (cause) {
    console.error("Geocoding failed:", cause);
    throw new GeocodeUnavailableError();
  }

  if (!geo || !isValidLngLat(geo.coordinates)) {
    const err = new Error("Could not find that address");
    err.status = 400;
    throw err;
  }

  if (!isWithinNyc(geo.coordinates)) {
    const err = new Error("Location must be inside the NYC service area");
    err.status = 400;
    throw err;
  }

  return {
    address,
    neighborhood: geo.neighborhood,
    borough: geo.borough,
    coordinates: geo.coordinates,
  };
}

/**
 * Validates common item fields for create/edit routes.
 * partial=true means fields are optional, useful for PATCH.
 */
function validateItemFields(body, { partial = false } = {}) {
  const errors = [];

  const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
  const hasDescription = Object.prototype.hasOwnProperty.call(
    body,
    "description"
  );
  const hasCategory = Object.prototype.hasOwnProperty.call(body, "category");

  const titleMin = VALIDATION?.title?.min ?? 1;
  const titleMax = VALIDATION?.title?.max ?? 100;
  const descriptionMax = VALIDATION?.description?.max ?? 1000;

  if (!partial || hasTitle) {
    const title = String(body.title || "").trim();

    if (!title) {
      errors.push("Title is required");
    } else if (title.length < titleMin || title.length > titleMax) {
      errors.push(`Title must be between ${titleMin} and ${titleMax} characters`);
    }
  }

  if (hasDescription) {
    const description = String(body.description || "").trim();

    if (description.length > descriptionMax) {
      errors.push(`Description must be ${descriptionMax} characters or less`);
    }
  }

  if (!partial || hasCategory) {
    const category = String(body.category || "").trim();

    if (!category) {
      errors.push("Category is required");
    } else if (!CATEGORIES.includes(category)) {
      errors.push("Invalid category");
    }
  }

  return errors;
}

// GET /api/items
// Public route (optionalAuth: owner/reserver see exact address + coords).
// Lists nearby items using lat, lng, radius, and optional status/category filters.
// Search is NOT restricted to NYC -> visitors anywhere can browse the feed
// (posting stays NYC-only, enforced at create time).
router.get("/", optionalAuth, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = req.query.radius
      ? Number(req.query.radius)
      : DEFAULT_SEARCH_RADIUS_M;

    const status = req.query.status;
    const category = req.query.category;

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    const coordinates = [lng, lat];

    if (!isValidLngLat(coordinates)) {
      return res.status(400).json({
        error: "lat and lng query parameters are required and must be valid numbers",
      });
    }

    if (!Number.isFinite(radius) || radius <= 0 || radius > MAX_SEARCH_RADIUS_M) {
      return res.status(400).json({
        error: `radius must be between 1 and ${MAX_SEARCH_RADIUS_M} meters`,
      });
    }

    const filter = {
      expiresAt: { $gt: new Date() },

      // Uses the 2dsphere index from Item.js.
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates,
          },
          $maxDistance: radius,
        },
      },
    };

    if (status) {
      if (!Object.values(ITEM_STATUS).includes(status)) {
        return res.status(400).json({
          error: "Invalid status filter",
        });
      }

      filter.status = status;
    } else {
      // By default, do not show claimed items in the browse feed.
      filter.status = { $ne: ITEM_STATUS.CLAIMED };
    }

    if (category) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: "Invalid category filter",
        });
      }

      filter.category = category;
    }

    const items = await Item.find(filter)
      .limit(limit)
      .populate(itemPopulate);

    return res.json({
      items: items.map((item) => itemResponse(item, req.userId)),
    });
  } catch (err) {
    console.error("List items error:", err);

    return res.status(500).json({
      error: "Failed to list items",
    });
  }
});

// GET /api/items/:id
// Public route (optionalAuth: owner/reserver see exact address + coords).
// Returns one item by id.
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid item id",
      });
    }

    const item = await Item.findById(req.params.id).populate(itemPopulate);

    if (!item) {
      return res.status(404).json({
        error: "Item not found",
      });
    }

    return res.json({
      item: itemResponse(item, req.userId),
    });
  } catch (err) {
    console.error("Get item error:", err);

    return res.status(500).json({
      error: "Failed to get item",
    });
  }
});

// POST /api/items
// Protected route.
// Creates a new giveaway post.
router.post("/", requireAuth, async (req, res) => {
  try {
    const errors = validateItemFields(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors[0],
        details: errors,
      });
    }

    // Geocode the typed address into exact coords + coarse neighborhood/borough.
    // resolveAddress throws with a .status (400 bad/outside-NYC) or a
    // GeocodeUnavailableError (502) — never a generic 500 for address trouble.
    const resolved = await resolveAddress(req.body.address);

    const title = String(req.body.title).trim();
    const description = String(req.body.description || "").trim();
    const photoUrl = String(req.body.photoUrl || "").trim();
    const category = String(req.body.category).trim();

    const item = await Item.create({
      title,
      description,
      photoUrl,
      category,
      address: resolved.address,
      neighborhood: resolved.neighborhood,
      borough: resolved.borough,
      location: {
        type: "Point",
        coordinates: resolved.coordinates,
      },
      postedBy: req.userId,
      expiresAt: new Date(Date.now() + POST_EXPIRY_MS),
    });

    await item.populate(itemPopulate);

    return res.status(201).json({
      item: itemResponse(item, req.userId),
    });
  } catch (err) {
    if (err instanceof GeocodeUnavailableError) {
      return res.status(502).json({
        error: "Address lookup failed — please try again",
      });
    }
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }

    console.error("Create item error:", err);

    return res.status(500).json({
      error: "Failed to create item",
    });
  }
});

// PATCH /api/items/:id
// Protected route.
// Only the owner of the post can edit it.
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid item id",
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        error: "Item not found",
      });
    }

    if (item.postedBy.toString() !== req.userId) {
      return res.status(403).json({
        error: "Only the owner can edit this item",
      });
    }

    const errors = validateItemFields(req.body, { partial: true });

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors[0],
        details: errors,
      });
    }

    // If the address changed, re-geocode and update all location fields
    // together so address / neighborhood / borough / coords never drift apart.
    if (Object.prototype.hasOwnProperty.call(req.body, "address")) {
      const resolved = await resolveAddress(req.body.address);
      item.address = resolved.address;
      item.neighborhood = resolved.neighborhood;
      item.borough = resolved.borough;
      item.location = {
        type: "Point",
        coordinates: resolved.coordinates,
      };
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      item.title = String(req.body.title).trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      item.description = String(req.body.description || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "photoUrl")) {
      item.photoUrl = String(req.body.photoUrl || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "category")) {
      item.category = String(req.body.category).trim();
    }

    // Do not allow status/reservation fields to be changed through PATCH.
    // Reservation and claim actions have their own routes.

    await item.save();
    await item.populate(itemPopulate);

    return res.json({
      item: itemResponse(item, req.userId),
    });
  } catch (err) {
    if (err instanceof GeocodeUnavailableError) {
      return res.status(502).json({
        error: "Address lookup failed — please try again",
      });
    }
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }

    console.error("Edit item error:", err);

    return res.status(500).json({
      error: "Failed to edit item",
    });
  }
});

// DELETE /api/items/:id
// Protected route.
// Only the owner of the post can delete it.
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid item id",
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        error: "Item not found",
      });
    }

    if (item.postedBy.toString() !== req.userId) {
      return res.status(403).json({
        error: "Only the owner can delete this item",
      });
    }

    await item.deleteOne();

    return res.json({
      message: "Item deleted",
    });
  } catch (err) {
    console.error("Delete item error:", err);

    return res.status(500).json({
      error: "Failed to delete item",
    });
  }
});

// POST /api/items/:id/reserve
// Protected route.
// Reserves an available item for the logged-in user.
// Uses atomic findOneAndUpdate so two users cannot reserve the same item at once.
router.post("/:id/reserve", requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid item id",
      });
    }

    const reservedUntil = new Date(Date.now() + RESERVATION_WINDOW_MS);

    const item = await Item.findOneAndUpdate(
      {
        _id: req.params.id,
        status: ITEM_STATUS.AVAILABLE,
        postedBy: { $ne: req.userId },
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          status: ITEM_STATUS.RESERVED,
          reservedBy: req.userId,
          reservedUntil,
        },
      },
      { new: true }
    ).populate(itemPopulate);

    if (!item) {
      const existingItem = await Item.findById(req.params.id);

      if (!existingItem) {
        return res.status(404).json({
          error: "Item not found",
        });
      }

      if (existingItem.postedBy.toString() === req.userId) {
        return res.status(403).json({
          error: "You cannot reserve your own item",
        });
      }

      if (existingItem.status !== ITEM_STATUS.AVAILABLE) {
        return res.status(409).json({
          error: "Item is no longer available",
        });
      }

      return res.status(409).json({
        error: "Item cannot be reserved",
      });
    }

    return res.json({
      item: itemResponse(item, req.userId),
    });
  } catch (err) {
    console.error("Reserve item error:", err);

    return res.status(500).json({
      error: "Failed to reserve item",
    });
  }
});

// DELETE /api/items/:id/reserve
// Protected route.
// Cancels the current user's reservation and returns the item to available.
router.delete("/:id/reserve", requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid item id",
      });
    }

    const item = await Item.findOneAndUpdate(
      {
        _id: req.params.id,
        status: ITEM_STATUS.RESERVED,
        reservedBy: req.userId,
      },
      {
        $set: {
          status: ITEM_STATUS.AVAILABLE,
        },
        $unset: {
          reservedBy: "",
          reservedUntil: "",
        },
      },
      { new: true }
    ).populate(itemPopulate);

    if (!item) {
      const existingItem = await Item.findById(req.params.id);

      if (!existingItem) {
        return res.status(404).json({
          error: "Item not found",
        });
      }

      if (existingItem.status !== ITEM_STATUS.RESERVED) {
        return res.status(409).json({
          error: "Item is not currently reserved",
        });
      }

      return res.status(403).json({
        error: "Only the user who reserved this item can cancel the reservation",
      });
    }

    return res.json({
      item: itemResponse(item, req.userId),
    });
  } catch (err) {
    console.error("Cancel reservation error:", err);

    return res.status(500).json({
      error: "Failed to cancel reservation",
    });
  }
});

// POST /api/items/:id/claim
// Protected route.
// Marks an item as picked up.
// The owner or the user who reserved the item can mark it as claimed.
router.post("/:id/claim", requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid item id",
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        error: "Item not found",
      });
    }

    if (item.status === ITEM_STATUS.CLAIMED) {
      return res.status(409).json({
        error: "Item is already claimed",
      });
    }

    const isOwner = item.postedBy.toString() === req.userId;
    const isReservedByUser =
      item.reservedBy && item.reservedBy.toString() === req.userId;

    if (!isOwner && !isReservedByUser) {
      return res.status(403).json({
        error: "Only the owner or reserver can claim this item",
      });
    }

    item.status = ITEM_STATUS.CLAIMED;
    // Clearing reservedBy means the claim response no longer treats the former
    // reserver as privileged, so it won't echo the exact address back. That's
    // fine — they already saw it while the item was reserved to them.
    item.reservedBy = undefined;
    item.reservedUntil = undefined;

    await item.save();
    await item.populate(itemPopulate);

    return res.json({
      item: itemResponse(item, req.userId),
    });
  } catch (err) {
    console.error("Claim item error:", err);

    return res.status(500).json({
      error: "Failed to claim item",
    });
  }
});

export default router;
