# Dockerfile for the Curbside API
FROM node:20

WORKDIR /app

# install deps first so Docker can cache this layer
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000
CMD ["npm", "start"]
