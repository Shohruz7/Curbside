// User model
// Fields from the design doc: id, username, email, passwordHash, createdAt.

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // never store the raw password
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
