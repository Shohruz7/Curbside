// Database connection helper.
// We keep this in its own file so server.js stays clean.

import mongoose from "mongoose";

// Only query on fields declared in the schema; silently drops unknown filter
// fields instead of letting them through.
mongoose.set("strictQuery", true);

export async function connectDb() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/curbside";

  // Log connection drops/recoveries so problems are visible in the API logs
  // rather than surfacing only as failed requests later.
  mongoose.connection.on("error", (err) => {
    console.log("MongoDB connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // fail fast if mongo isn't reachable at startup
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Could not connect to MongoDB:", err.message);
    process.exit(1); // no point running the API with no database
  }
}
