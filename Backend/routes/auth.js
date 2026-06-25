// Auth routes -> /api/auth
// register, login, and "who am I"
// NOTE: these are stubs. The logic is sketched out but left for us to finish.

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register  (public)
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // TODO: validate the fields are actually there
  // TODO: hash the password with bcrypt -> passwordHash
  // TODO: create the User, then return a token (or just a success message)

  res.status(501).json({ error: "register not implemented yet" });
});

// POST /api/auth/login  (public)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // TODO: find the user by email
  // TODO: compare password with bcrypt.compare
  // TODO: if good, sign a JWT with jwt.sign({ userId }, process.env.JWT_SECRET)

  res.status(501).json({ error: "login not implemented yet" });
});

// GET /api/auth/me  (auth required)
router.get("/me", requireAuth, async (req, res) => {
  // req.userId is set by the middleware
  // TODO: look up the user and return it (leave out the passwordHash!)

  res.status(501).json({ error: "me not implemented yet" });
});

export default router;
