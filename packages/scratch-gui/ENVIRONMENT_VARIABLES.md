# Environment Variables Configuration

This document describes the environment variables used in the Scratch GUI with CodeVenture integration.

## Setup

### For Monorepo Structure

Since this is a monorepo with multiple packages, you have two options for environment variables:

#### Option 1: GUI-specific .env file (Recommended)
Create a `.env` file in the `packages/scratch-gui/` directory with the following variables:

#### Option 2: Root-level .env file
Create a `.env` file in the root directory (same level as package.json) with the following variables:

```bash
# CodeVenture API Configuration
CODEVENTURE_API_URL=http://localhost:4000
CODEVENTURE_APP_URL=https://codeventure.app

# Optional: Google Analytics
GA_ID=UA-000000-01

# Optional: Google Tag Manager
GTM_ID=
GTM_ENV_AUTH=

# Optional: Debug mode
DEBUG=false
```

## Environment Variables

### CODEVENTURE_API_URL
- **Default**: `http://localhost:4000`
- **Description**: The base URL for the CodeVenture backend API
- **Used for**:
  - Project saving API calls
  - SSO token exchange
  - User authentication

### CODEVENTURE_APP_URL
- **Default**: `https://codeventure.app`
- **Description**: The base URL for the CodeVenture frontend application
- **Used for**:
  - Loading user avatar images
  - Default avatar URLs

## Development vs Production

### Development
```bash
CODEVENTURE_API_URL=http://localhost:4000
CODEVENTURE_APP_URL=http://localhost:3000
```

### Staging
```bash
CODEVENTURE_API_URL=https://api-staging.codeventure.app
CODEVENTURE_APP_URL=https://staging.codeventure.app
```

### Production
```bash
CODEVENTURE_API_URL=https://api.codeventure.app
CODEVENTURE_APP_URL=https://codeventure.app
```

## How to Use

### Local Development

1. **Choose your approach**:
   - **GUI-specific**: Create a `.env` file in `packages/scratch-gui/`
   - **Root-level**: Create a `.env` file in the root directory

2. Add your environment-specific values

3. Rebuild the project:
   ```bash
   # From root directory
   pnpm run build
   
   # Or from packages/scratch-gui directory
   cd packages/scratch-gui
   pnpm run build
   ```

4. The values will be injected at build time via webpack DefinePlugin

### Docker Build (Monorepo)

When building with Docker in a monorepo structure:

1. **Environment variables are automatically available** during the Docker build process
2. **Cloud Run environment variables** will override any defaults
3. **No .env file needed** in the container - variables come from Cloud Run service configuration

## Google Cloud Run Deployment

When deploying to Google Cloud Run, environment variables are set at the service level and will automatically override the default values:

### Setting Environment Variables in Cloud Run

1. **Via Google Cloud Console**:
   - Go to Cloud Run → Your Service → Edit & Deploy New Revision
   - Navigate to "Variables & Secrets" tab
   - Add your environment variables:
     - `CODEVENTURE_API_URL`: Your production API URL
     - `CODEVENTURE_APP_URL`: Your production app URL
     - `GA_ID`: Your Google Analytics ID
     - `GTM_ID`: Your Google Tag Manager ID

2. **Via gcloud CLI**:
   ```bash
   gcloud run deploy scratch-editor \
     --set-env-vars="CODEVENTURE_API_URL=https://api.codeventure.app,CODEVENTURE_APP_URL=https://codeventure.app"
   ```

3. **Via Cloud Build** (in your `cloudbuild.yaml`):
   ```yaml
   steps:
   - name: 'gcr.io/cloud-builders/gcloud'
     args: ['run', 'deploy', 'scratch-editor', '--set-env-vars=CODEVENTURE_API_URL=https://api.codeventure.app']
   ```

### Environment Variable Priority

1. **Google Cloud Run environment variables** (highest priority)
2. **Local `.env` file** (for development)
3. **Default values** (fallback)

## Note

- These variables are **build-time** variables, not runtime
- You must rebuild after changing environment variables
- The `.env` file is gitignored for security
- In Cloud Run, environment variables are automatically available during the build process

