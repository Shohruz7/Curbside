// Database connection helper.
// We keep this in its own file so server.js stays clean.

import mongoose from "mongoose";

export async function connectDb() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/curbside";

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Could not connect to MongoDB:", err.message);
    process.exit(1); // no point running the API with no database
  }
}
