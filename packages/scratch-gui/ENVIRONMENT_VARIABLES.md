# Environment Variables Configuration

This document describes the environment variables used in the Scratch GUI with CodeVenture integration.

## Setup

Create a `.env` file in the `packages/scratch-gui/` directory with the following variables:

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

1. Create a `.env` file in `packages/scratch-gui/`
2. Add your environment-specific values
3. Rebuild the project with `pnpm run build` or restart the dev server
4. The values will be injected at build time via webpack DefinePlugin

## Note

- These variables are **build-time** variables, not runtime
- You must rebuild after changing environment variables
- The `.env` file is gitignored for security

