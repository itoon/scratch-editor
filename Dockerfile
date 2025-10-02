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

# Build the dependencies in the correct order before building the GUI
WORKDIR /app/packages/scratch-svg-renderer
RUN npm run build

WORKDIR /app/packages/scratch-render
RUN npm run build

WORKDIR /app/packages/scratch-vm
RUN npm run build

# Build the GUI with environment variables available
WORKDIR /app/packages/scratch-gui
ENV CODEVENTURE_API_URL=http://localhost:4000
ENV CODEVENTURE_APP_URL=http://localhost:3000
# Environment variables from Cloud Run will be available during build
RUN npm run build
RUN npm link
RUN npm link scratch-gui

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