# Dockerfile for the Curbside client
# Multi-stage: build the static bundle with Node, then serve it from a tiny
# nginx image (~50MB) instead of shipping Node + node_modules + `vite preview`.
# NOTE: build context is the repo root so shared/ (file:../shared) is available.

# --- build stage ---
FROM node:20 AS build

WORKDIR /app

# The shared package must sit at /shared so that file:../shared resolves during
# install and the Vite build can bundle it.
COPY shared /shared

COPY Frontend/package*.json ./
RUN npm install

COPY Frontend/ ./

# Vite only bakes VITE_-prefixed vars into the bundle at BUILD time, and shell
# env takes priority over .env files. docker-compose.yml passes these as build
# args (from the repo-root .env); the defaults keep local builds working.
ARG VITE_API_URL=http://localhost:4000/api
ARG VITE_CLOUDINARY_CLOUD_NAME=
ARG VITE_CLOUDINARY_UPLOAD_PRESET=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME \
    VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET

RUN npm run build

# --- runtime stage ---
FROM nginx:alpine

# SPA routing: serve real files, otherwise fall back to index.html.
COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Just the built static assets — no Node, no node_modules.
COPY --from=build /app/dist /usr/share/nginx/html

# Keep the container port at 5173 so existing compose port mappings still apply.
EXPOSE 5173
