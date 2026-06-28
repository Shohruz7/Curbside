# Curbside

A neighborhood giveaway platform for New York City.

> Status: In development. This project is not finished yet.

## Overview

In New York, usable items (furniture, electronics, books, household goods) are left on the curb every day. Most go unnoticed until they are rained on or thrown out. The real problem is timing and visibility: the person giving an item away and the person who wants it have no way to find each other before it is gone.

Curbside closes that gap. A giver posts an item in seconds with a photo, a short description, and a location. The post shows up on a live map and feed for nearby users, and anyone interested can reserve it for a limited window so no one makes a wasted trip. Posts expire automatically, so the feed stays current.

## Problems It Solves

- Useful items are wasted because no one nearby knows they are available.
- Givers and takers cannot coordinate before an item is gone.
- Stale listings clutter community feeds and lead to wasted trips.

## Features

- Post an item with a photo, description, category, and location.
- Browse nearby items on an interactive map and feed.
- Reserve an available item for a limited window, then claim it on pickup.
- Automatic expiration of posts and release of stale reservations.
- User accounts with secure authentication.

## Architecture

Curbside has three layers:

- **React client** renders the map, feed, and post forms, and talks to the API over HTTPS, attaching a JWT on authenticated requests.
- **Express REST API** (stateless) validates input, enforces ownership, and handles all reads and writes.
- **MongoDB** stores users and items, using a 2dsphere index for nearby-item queries and a TTL index to expire posts automatically.

Image uploads go straight from the client to Cloudinary, which returns a hosted URL that is saved on the item. Image data never sits in the API or database. The client and API are both containerized with Docker and published to Docker Hub.

## Project Structure

```
Backend/    Express REST API (Mongoose models, routes, JWT auth)
Frontend/   React client (Vite, Tailwind, Leaflet)
shared/     @curbside/shared — constants and JSDoc typedefs used by both
```

`shared/` is a small local package (`@curbside/shared`) that holds cross-cutting
constants (item statuses, categories, reservation/expiry windows, validation
limits, API error codes) and JSDoc type definitions. Both `Backend` and
`Frontend` depend on it via `"@curbside/shared": "file:../shared"`, so the API
and UI share one source of truth and cannot drift out of sync.

## Running with Docker

Docker builds use the **repo root** as the build context (see
`docker-compose.yml`) so the `shared/` package is available to both images.
Before starting, copy `.env.example` to `.env` and set a real `JWT_SECRET` —
compose refuses to start the server without it:

```
cp .env.example .env   # then edit JWT_SECRET
docker compose up
```

## Tech Stack

- **Frontend:** React, Tailwind CSS, React Router, Leaflet
- **Backend:** Node.js, Express, JSON Web Tokens, bcrypt, Mongoose
- **Database:** MongoDB (2dsphere geospatial index, TTL index)
- **Image hosting:** Cloudinary
- **Tooling and deployment:** Git, GitHub, Docker, Docker Hub

## Team

Shohruzbek Abdumuminov, Sanjar Melikov, Ilobi Michael, Sara Ahmed El Sayed
