# Dockerfile for the Curbside API
# NOTE: build context is the repo root (see docker-compose.yml) so the shared/
# package referenced via "file:../shared" is available during npm install.
FROM node:20

WORKDIR /app

# The shared package must sit at /shared so that file:../shared (relative to
# /app) resolves correctly during install.
COPY shared /shared

# install deps first so Docker can cache this layer
COPY Backend/package*.json ./
RUN npm install

COPY Backend/ ./

EXPOSE 4000
CMD ["npm", "start"]
