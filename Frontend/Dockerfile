# Dockerfile for the Curbside client
# Builds the React app and serves the static files.
# NOTE: build context is the repo root (see docker-compose.yml) so the shared/
# package referenced via "file:../shared" is available during npm install/build.
FROM node:20

WORKDIR /app

# The shared package must sit at /shared so that file:../shared (relative to
# /app) resolves correctly during install and the Vite build can bundle it.
COPY shared /shared

COPY Frontend/package*.json ./
RUN npm install

COPY Frontend/ ./

# build the production bundle, then preview it
RUN npm run build

EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]
