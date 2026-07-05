// Seed script — fills the DB with fake users + listings across the five boroughs
// so the map and feed have something to show while testing/demoing.
//
// Run inside Docker:  docker compose exec server npm run seed
// (rebuild the server image first if you just added this file, since the
//  Dockerfile COPYs Backend/ at build time.)
//
// Idempotent: users are upserted by email and this script's own items are
// deleted before re-inserting, so it never touches non-seed data and can be
// re-run freely. It does NOT call the geocoder — coordinates are hardcoded.

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { connectDb } from "../db.js";
import User from "../models/User.js";
import Item from "../models/Item.js";
import {
  ITEM_STATUS,
  POST_EXPIRY_MS,
  RESERVATION_WINDOW_MS,
} from "@curbside/shared";

dotenv.config();

const SEED_PASSWORD = "password123"; // shared by all seed users, for testing

const SEED_USERS = [
  { username: "alice_nyc", email: "alice@example.com" },
  { username: "bob_bk", email: "bob@example.com" },
  { username: "carol_qns", email: "carol@example.com" },
  { username: "dave_si", email: "dave@example.com" },
];

// Real, plausible addresses with hand-picked coordinates ([lng, lat]) that all
// sit inside NYC_BOUNDS. neighborhood/borough are what the public sees.
const LISTINGS = [
  // --- Manhattan (8) ---
  { title: "Solid oak dresser", category: "furniture", address: "350 5th Ave, New York, NY 10118", neighborhood: "Midtown", borough: "Manhattan", coordinates: [-73.9857, 40.7484] },
  { title: "Working microwave", category: "kitchen", address: "100 St Marks Pl, New York, NY 10009", neighborhood: "East Village", borough: "Manhattan", coordinates: [-73.9855, 40.7276] },
  { title: "Box of paperbacks", category: "books", address: "55 W 125th St, New York, NY 10027", neighborhood: "Harlem", borough: "Manhattan", coordinates: [-73.9470, 40.8085] },
  { title: "Standing desk lamp", category: "furniture", address: "2109 Broadway, New York, NY 10023", neighborhood: "Upper West Side", borough: "Manhattan", coordinates: [-73.9810, 40.7800] },
  { title: "Winter coats, size M", category: "clothing", address: "200 W 23rd St, New York, NY 10011", neighborhood: "Chelsea", borough: "Manhattan", coordinates: [-73.9970, 40.7440] },
  { title: "Vintage record player", category: "electronics", address: "130 Prince St, New York, NY 10012", neighborhood: "SoHo", borough: "Manhattan", coordinates: [-74.0010, 40.7250] },
  { title: "Kids' board games", category: "toys", address: "131 Delancey St, New York, NY 10002", neighborhood: "Lower East Side", borough: "Manhattan", coordinates: [-73.9870, 40.7185] },
  { title: "Assorted picture frames", category: "other", address: "4400 Broadway, New York, NY 10040", neighborhood: "Washington Heights", borough: "Manhattan", coordinates: [-73.9370, 40.8500] },

  // --- Brooklyn (8) ---
  { title: "Mid-century armchair", category: "furniture", address: "200 Eastern Pkwy, Brooklyn, NY 11238", neighborhood: "Prospect Heights", borough: "Brooklyn", coordinates: [-73.9636, 40.6712] },
  { title: "Bluetooth speaker", category: "electronics", address: "240 Bedford Ave, Brooklyn, NY 11249", neighborhood: "Williamsburg", borough: "Brooklyn", coordinates: [-73.9575, 40.7175] },
  { title: "Toddler clothes bundle", category: "clothing", address: "200 7th Ave, Brooklyn, NY 11215", neighborhood: "Park Slope", borough: "Brooklyn", coordinates: [-73.9800, 40.6710] },
  { title: "Cast-iron skillet set", category: "kitchen", address: "1 Main St, Brooklyn, NY 11201", neighborhood: "DUMBO", borough: "Brooklyn", coordinates: [-73.9905, 40.7033] },
  { title: "Cookbooks, like new", category: "books", address: "1234 Myrtle Ave, Brooklyn, NY 11221", neighborhood: "Bushwick", borough: "Brooklyn", coordinates: [-73.9265, 40.6975] },
  { title: "Wooden bookshelf", category: "furniture", address: "6800 3rd Ave, Brooklyn, NY 11220", neighborhood: "Bay Ridge", borough: "Brooklyn", coordinates: [-74.0270, 40.6355] },
  { title: "Lego bins", category: "toys", address: "1000 Fulton St, Brooklyn, NY 11238", neighborhood: "Bed-Stuy", borough: "Brooklyn", coordinates: [-73.9560, 40.6810] },
  { title: "Desk monitor, 24 inch", category: "electronics", address: "700 Franklin Ave, Brooklyn, NY 11238", neighborhood: "Crown Heights", borough: "Brooklyn", coordinates: [-73.9570, 40.6690] },

  // --- Queens (6) ---
  { title: "Dining table + 2 chairs", category: "furniture", address: "90-15 Queens Blvd, Elmhurst, NY 11373", neighborhood: "Elmhurst", borough: "Queens", coordinates: [-73.8760, 40.7355] },
  { title: "Coffee maker", category: "kitchen", address: "31-01 Steinway St, Astoria, NY 11103", neighborhood: "Astoria", borough: "Queens", coordinates: [-73.9200, 40.7640] },
  { title: "Children's picture books", category: "books", address: "136-20 Roosevelt Ave, Flushing, NY 11354", neighborhood: "Flushing", borough: "Queens", coordinates: [-73.8300, 40.7590] },
  { title: "Floor lamp", category: "furniture", address: "4-40 44th Dr, Long Island City, NY 11101", neighborhood: "Long Island City", borough: "Queens", coordinates: [-73.9500, 40.7470] },
  { title: "Winter jackets", category: "clothing", address: "37-15 74th St, Jackson Heights, NY 11372", neighborhood: "Jackson Heights", borough: "Queens", coordinates: [-73.8910, 40.7470] },
  { title: "Board game lot", category: "toys", address: "71-30 Austin St, Forest Hills, NY 11375", neighborhood: "Forest Hills", borough: "Queens", coordinates: [-73.8460, 40.7210] },

  // --- Bronx (4) ---
  { title: "Two nightstands", category: "furniture", address: "1 E 161st St, Bronx, NY 10451", neighborhood: "Concourse", borough: "Bronx", coordinates: [-73.9262, 40.8296] },
  { title: "Space heater", category: "electronics", address: "2500 Grand Concourse, Bronx, NY 10458", neighborhood: "Fordham", borough: "Bronx", coordinates: [-73.9010, 40.8620] },
  { title: "Kitchen dishes set", category: "kitchen", address: "5600 Riverdale Ave, Bronx, NY 10471", neighborhood: "Riverdale", borough: "Bronx", coordinates: [-73.9090, 40.8930] },
  { title: "Assorted textbooks", category: "books", address: "3200 E Tremont Ave, Bronx, NY 10461", neighborhood: "Throggs Neck", borough: "Bronx", coordinates: [-73.8230, 40.8280] },

  // --- Staten Island (4) ---
  { title: "Patio chairs", category: "furniture", address: "10 Richmond Terrace, Staten Island, NY 10301", neighborhood: "St. George", borough: "Staten Island", coordinates: [-74.0760, 40.6430] },
  { title: "Kids' bicycle", category: "toys", address: "7326 Amboy Rd, Staten Island, NY 10307", neighborhood: "Tottenville", borough: "Staten Island", coordinates: [-74.2460, 40.5100] },
  { title: "Blender + toaster", category: "kitchen", address: "200 New Dorp Ln, Staten Island, NY 10306", neighborhood: "New Dorp", borough: "Staten Island", coordinates: [-74.1160, 40.5730] },
  { title: "Men's clothing, size L", category: "clothing", address: "100 Bay St, Staten Island, NY 10301", neighborhood: "Stapleton", borough: "Staten Island", coordinates: [-74.0770, 40.6270] },
];

// Which listing indices are reserved / claimed (rest are available).
const RESERVED_INDEXES = new Set([3, 9, 15, 21, 27]);
const CLAIMED_INDEXES = new Set([6, 18, 24]);

async function seed() {
  await connectDb();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // Upsert seed users by email; collect their ids in order.
  const users = [];
  for (const u of SEED_USERS) {
    const user = await User.findOneAndUpdate(
      { email: u.email },
      { $set: { username: u.username, passwordHash } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    users.push(user);
  }
  const userIds = users.map((u) => u._id);

  // Clear only this script's items so re-runs are clean.
  const removed = await Item.deleteMany({ postedBy: { $in: userIds } });

  const now = Date.now();

  const docs = LISTINGS.map((listing, i) => {
    const poster = users[i % users.length];

    // Stagger createdAt over the last ~5 days; expiresAt is always in the future.
    const hoursAgo = (i * 3) % 120;
    const createdAt = new Date(now - hoursAgo * 60 * 60 * 1000);
    const expiresAt = new Date(createdAt.getTime() + POST_EXPIRY_MS);

    let status = ITEM_STATUS.AVAILABLE;
    let reservedBy;
    let reservedUntil;

    if (RESERVED_INDEXES.has(i)) {
      status = ITEM_STATUS.RESERVED;
      // Reserve to a different user than the poster.
      reservedBy = userIds[(i + 1) % userIds.length];
      // Keep it in the future so the background sweeper doesn't release it.
      reservedUntil = new Date(now + RESERVATION_WINDOW_MS);
    } else if (CLAIMED_INDEXES.has(i)) {
      status = ITEM_STATUS.CLAIMED;
    }

    return {
      title: listing.title,
      description: `${listing.title} — free curbside pickup in ${listing.neighborhood}. First come, first served.`,
      photoUrl: `https://picsum.photos/seed/curbside-${i}/800/600`,
      category: listing.category,
      address: listing.address,
      neighborhood: listing.neighborhood,
      borough: listing.borough,
      location: { type: "Point", coordinates: listing.coordinates },
      status,
      reservedBy,
      reservedUntil,
      postedBy: poster._id,
      createdAt,
      expiresAt,
    };
  });

  const inserted = await Item.insertMany(docs);

  const counts = inserted.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  console.log("--- Seed complete ---");
  console.log(`Users upserted: ${users.length} (password for all: ${SEED_PASSWORD})`);
  users.forEach((u) => console.log(`  ${u.username} <${u.email}>`));
  console.log(`Items removed:  ${removed.deletedCount}`);
  console.log(`Items inserted: ${inserted.length}`);
  console.log(`  by status:    ${JSON.stringify(counts)}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
