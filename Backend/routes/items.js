// Item routes -> /api/items
// This is the core of the app: browsing, posting, editing, deleting,
// reserving, canceling reservations, and claiming picked-up items.

import express from "express";
import mongoose from "mongoose";

import Item from "../models/Item.js";
import { requireAuth } from "../middleware/auth.js";

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

const itemPopulate = [
  { path: "postedBy", select: "username email" },
  { path: "reservedBy", select: "username email" },
];

/**
 * Checks whether a MongoDB id is valid before passing it to Mongoose.
 * This prevents ugly CastError responses for bad ids.
 */
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Converts a populated user, ObjectId, or missing value into a safe API response.
 */
function userRefResponse(userRef) {
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

/**
 * Formats an Item document before sending it to the client.
 * This gives the frontend a predictable id field instead of only _id.
 */
function itemResponse(item) {
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

/**
 * Reads location from the request body.
 * Supports both:
 *   { location: { coordinates: [lng, lat] } }
 * and:
 *   { lng: -73.9857, lat: 40.7484 }
 */
function readCoordinatesFromBody(body) {
  if (Array.isArray(body?.location?.coordinates)) {
    return [
      Number(body.location.coordinates[0]),
      Number(body.location.coordinates[1]),
    ];
  }

  if (Array.isArray(body?.coordinates)) {
    return [Number(body.coordinates[0]), Number(body.coordinates[1])];
  }

  if (body.lng !== undefined && body.lat !== undefined) {
    return [Number(body.lng), Number(body.lat)];
  }

  return null;
}

/**
 * Validates that coordinates are a real [lng, lat] pair inside the NYC service area.
 */
function validateCoordinates(coordinates) {
  if (!coordinates) {
    return "Location is required";
  }

  if (!isValidLngLat(coordinates)) {
    return "Location coordinates must be a valid [lng, lat] pair";
  }

  if (!isWithinNyc(coordinates)) {
    return "Location must be inside the NYC service area";
  }

  return null;
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
// Public route.
// Lists nearby items using lat, lng, radius, and optional status/category filters.
router.get("/", async (req, res) => {
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

    if (!isWithinNyc(coordinates)) {
      return res.status(400).json({
        error: "Search location must be inside the NYC service area",
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
      items: items.map(itemResponse),
    });
  } catch (err) {
    console.error("List items error:", err);

    return res.status(500).json({
      error: "Failed to list items",
    });
  }
});

// GET /api/items/:id
// Public route.
// Returns one item by id.
router.get("/:id", async (req, res) => {
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
      item: itemResponse(item),
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

    const coordinates = readCoordinatesFromBody(req.body);
    const coordinateError = validateCoordinates(coordinates);

    if (coordinateError) {
      errors.push(coordinateError);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors[0],
        details: errors,
      });
    }

    const title = String(req.body.title).trim();
    const description = String(req.body.description || "").trim();
    const photoUrl = String(req.body.photoUrl || "").trim();
    const category = String(req.body.category).trim();

    const item = await Item.create({
      title,
      description,
      photoUrl,
      category,
      location: {
        type: "Point",
        coordinates,
      },
      postedBy: req.userId,
      expiresAt: new Date(Date.now() + POST_EXPIRY_MS),
    });

    await item.populate(itemPopulate);

    return res.status(201).json({
      item: itemResponse(item),
    });
  } catch (err) {
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

    if (
      req.body.location !== undefined ||
      req.body.coordinates !== undefined ||
      req.body.lat !== undefined ||
      req.body.lng !== undefined
    ) {
      const coordinates = readCoordinatesFromBody(req.body);
      const coordinateError = validateCoordinates(coordinates);

      if (coordinateError) {
        errors.push(coordinateError);
      } else {
        item.location = {
          type: "Point",
          coordinates,
        };
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors[0],
        details: errors,
      });
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
      item: itemResponse(item),
    });
  } catch (err) {
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
      item: itemResponse(item),
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
      item: itemResponse(item),
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
    item.reservedBy = undefined;
    item.reservedUntil = undefined;

    await item.save();
    await item.populate(itemPopulate);

    return res.json({
      item: itemResponse(item),
    });
  } catch (err) {
    console.error("Claim item error:", err);

    return res.status(500).json({
      error: "Failed to claim item",
    });
  }
});

export default router;
