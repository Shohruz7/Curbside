// Item model
// This is the giveaway post. Fields come from the design doc.
// location is stored as a GeoJSON Point so we can do "nearby" queries.

import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  photoUrl: { type: String }, // hosted on Cloudinary, we only keep the URL
  category: { type: String },

  // GeoJSON Point -> coordinates are [lng, lat] (note the order!)
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }
  },

  status: {
    type: String,
    enum: ["available", "reserved", "claimed"],
    default: "available"
  },

  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reservedUntil: { type: Date },

  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date } // used by the TTL index below
});

// 2dsphere index -> powers GET /api/items nearby search
itemSchema.index({ location: "2dsphere" });

// TTL index -> MongoDB auto-deletes the doc once expiresAt passes
// TODO: confirm expireAfterSeconds: 0 is what we want here
itemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Item", itemSchema);
