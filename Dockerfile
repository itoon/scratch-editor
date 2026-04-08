# Use official Node.js image to build the app
# Keep Node version aligned with local/dev to reduce build/runtime drift.
ARG NODE_VERSION=20
FROM node:${NODE_VERSION} AS build

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

# IMPORTANT:
# - This container serves static files, so runtime Cloud Run env vars won't reach browser JS.
# - Values must be baked into the bundle at build time via build args.
ARG CODEVENTURE_API_URL=https://codeventure-mvp-api-89482725665.asia-southeast1.run.app
ARG CODEVENTURE_APP_URL=https://uat-codeventure-frontend-89482725665.asia-southeast1.run.app/
ENV CODEVENTURE_API_URL=${CODEVENTURE_API_URL}
ENV CODEVENTURE_APP_URL=${CODEVENTURE_APP_URL}
ENV NODE_ENV=production

RUN npm run build
RUN npm link
RUN npm link scratch-gui

# --- Production image ---
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-slim

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