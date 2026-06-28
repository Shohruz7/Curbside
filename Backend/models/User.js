// User model
// Fields from the design doc: id, username, email, passwordHash, createdAt.

import mongoose from "mongoose";
import { VALIDATION } from "@curbside/shared";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: VALIDATION.username.min,
    maxlength: VALIDATION.username.max
  },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true }, // never store the raw password
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
