// Item model
// This is the giveaway post. Fields come from the design doc.
// location is stored as a GeoJSON Point so we can do "nearby" queries.

import mongoose from "mongoose";
import { ITEM_STATUS, CATEGORIES, isValidLngLat } from "@curbside/shared";

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  photoUrl: { type: String }, // hosted on Cloudinary, we only keep the URL
  category: { type: String, enum: CATEGORIES },

  // GeoJSON Point -> coordinates are [lng, lat] (note the order!)
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      // reject anything that isn't a valid [lng, lat] pair before it reaches mongo
      validate: {
        validator: isValidLngLat,
        message: "location.coordinates must be a valid [lng, lat] pair"
      }
    }
  },

  status: {
    type: String,
    enum: Object.values(ITEM_STATUS),
    default: ITEM_STATUS.AVAILABLE
  },

  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reservedUntil: { type: Date },

  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date } // used by the TTL index below
});

// 2dsphere index -> powers GET /api/items nearby search
itemSchema.index({ location: "2dsphere" });

// TTL index -> expireAfterSeconds: 0 means MongoDB deletes the doc as soon as
// the wall-clock time in `expiresAt` passes (the background reaper runs ~every
// 60s). This is exactly the auto-expiry behavior we want for stale posts.
itemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Supports the non-geo filter path of GET /api/items (status / category filters).
itemSchema.index({ status: 1, category: 1 });

// Supports GET /api/users/:id/items, newest first.
itemSchema.index({ postedBy: 1, createdAt: -1 });

export default mongoose.model("Item", itemSchema);
