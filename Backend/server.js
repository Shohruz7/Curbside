// Curbside API - main entry point
// This is where the Express app is set up and the routes get plugged in.

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import itemRoutes from "./routes/items.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const portNumber = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json()); // lets us read JSON request bodies

// quick health check so we know the server is alive
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// all the real routes live under /api
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/users", userRoutes);

// connect to mongo, then start listening
connectDb().then(() => {
  app.listen(portNumber, () => {
    console.log("Curbside API running on port " + portNumber);
  });
});
