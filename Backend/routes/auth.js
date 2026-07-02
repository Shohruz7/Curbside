// Auth routes for /api/auth
// Handles user registration, login, and checking the currently logged-in user (who am I).

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { VALIDATION } from "@curbside/shared";

const router = express.Router();

/**
 * Creates a signed JWT for a user.
 * The token stores the user's MongoDB id so protected routes can identify them later.
 */
function makeToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/**
 * Formats a user object before sending it to the client.
 * This prevents sensitive fields like passwordHash from being returned.
 */
function userResponse(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

// POST /api/auth/register
// Creates a new user account.
// Public route: no JWT is required.
router.post("/register", async (req, res) => {
  try {
    // Read and normalize request body values.
    // Email is lowercased so Test@Email.com and test@email.com are treated the same.
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    // Pull validation rules from the shared package so frontend and backend stay in sync.
    const usernameMin = VALIDATION?.username?.min ?? 3;
    const usernameMax = VALIDATION?.username?.max ?? 30;
    const passwordMin = VALIDATION?.password?.min ?? 8;

    // Make sure required fields are present.
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email, and password are required",
      });
    }

    // Validate username length.
    if (username.length < usernameMin || username.length > usernameMax) {
      return res.status(400).json({
        error: `Username must be between ${usernameMin} and ${usernameMax} characters`,
      });
    }

    // Basic email check.
    // This is intentionally simple; the unique database index still protects against duplicates.
    if (!email.includes("@")) {
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    // Validate password length before hashing.
    if (password.length < passwordMin) {
      return res.status(400).json({
        error: `Password must be at least ${passwordMin} characters`,
      });
    }

    // Check whether the username or email already belongs to another account.
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        error:
          existingUser.email === email
            ? "Email is already registered"
            : "Username is already taken",
      });
    }

    // Hash the password before saving.
    // The raw password should never be stored in MongoDB.
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the user document in MongoDB.
    const user = await User.create({
      username,
      email,
      passwordHash,
    });

    // Create a JWT so the user is logged in immediately after registering.
    const token = makeToken(user._id);

    return res.status(201).json({
      token,
      user: userResponse(user),
    });
  } catch (err) {
    console.error("Register error:", err);

    // Handles duplicate key errors from MongoDB unique indexes.
    // This is a backup in case two requests pass the manual duplicate check at the same time.
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Username or email already exists",
      });
    }

    return res.status(500).json({
      error: "Failed to register user",
    });
  }
});

// POST /api/auth/login
// Authenticates an existing user and returns a JWT.
// Public route: no JWT is required.
router.post("/login", async (req, res) => {
  try {
    // Normalize email so login is case-insensitive.
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    // Both email and password are required to log in.
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Look up the user by email.
    const user = await User.findOne({ email });

    // Do not reveal whether the email or password was wrong.
    // This prevents account enumeration.
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Compare the submitted password with the stored password hash.
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Create a JWT for future authenticated requests.
    const token = makeToken(user._id);

    return res.json({
      token,
      user: userResponse(user),
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      error: "Failed to log in",
    });
  }
});

// GET /api/auth/me
// Returns the currently authenticated user.
// Protected route: requires a valid Authorization: Bearer <token> header.
router.get("/me", requireAuth, async (req, res) => {
  try {
    // requireAuth verifies the token and places the user's id on req.userId.
    // Exclude passwordHash from the database result.
    const user = await User.findById(req.userId).select("-passwordHash");

    // This can happen if the token is valid but the user was deleted.
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json({
      user: userResponse(user),
    });
  } catch (err) {
    console.error("Me error:", err);

    return res.status(500).json({
      error: "Failed to load current user",
    });
  }
});

export default router;
