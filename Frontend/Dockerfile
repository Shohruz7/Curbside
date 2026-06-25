# Dockerfile for the Curbside client
# Builds the React app and serves the static files.
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# build the production bundle, then preview it
RUN npm run build

EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]
