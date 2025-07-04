# Use official Node.js image to build the app
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY packages/scratch-gui/package*.json ./packages/scratch-gui/
COPY packages/scratch-vm/package*.json ./packages/scratch-vm/
COPY packages/scratch-render/package*.json ./packages/scratch-render/
COPY packages/scratch-svg-renderer/package*.json ./packages/scratch-svg-renderer/

# Copy scripts directory that contains prepare.mjs needed for npm install
COPY packages/scratch-gui/scripts ./packages/scratch-gui/scripts/

RUN npm install

# Copy the rest of the source code
COPY . .

# Build the GUI (adjust if your build command is different)
WORKDIR /app/packages/scratch-gui
RUN npm run build

# --- Production image ---
FROM node:18-slim

# Install serve to serve the build directory
RUN npm install -g serve

WORKDIR /app

# Copy built files from previous stage
COPY --from=build /app/packages/scratch-gui/build ./build

# Cloud Run expects the app to listen on $PORT
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the app
CMD ["serve", "-s", "build", "-l", "8080"]