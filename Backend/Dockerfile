# Dockerfile for the Curbside API
# NOTE: build context is the repo root (see docker-compose.yml) so the shared/
# package referenced via "file:../shared" is available during npm install.
#
# node:20-slim (Debian slim, glibc) keeps the image small while still letting
# bcrypt's prebuilt native binary install without a compiler toolchain (glibc,
# unlike alpine/musl, matches the prebuild).
FROM node:20-slim

WORKDIR /app

# The shared package must sit at /shared so that file:../shared (relative to
# /app) resolves correctly during install.
COPY shared /shared

# install prod deps only (drops nodemon); cache this layer
COPY Backend/package*.json ./
RUN npm install --omit=dev

COPY Backend/ ./

EXPOSE 4000
CMD ["npm", "start"]
