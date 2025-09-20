# CodeVenture Authentication Integration Guide

This guide explains how to use the CodeVenture authentication system that has been integrated into the Scratch Editor.

## Quick Start

The CodeVenture authentication system is now available as exports from the main `index.ts` file:

```javascript
import { 
    CodeVentureAuthHOC,
    validateAuthParams,
    validateTokenWithAPI,
    createUserData,
    cleanAuthFromURL,
    DEFAULT_CONFIG
} from './src/index.ts';
```

## Usage Examples

### 1. Using the Higher-Order Component (HOC)

The easiest way to add CodeVenture authentication to your component is by wrapping it with the `CodeVentureAuthHOC`:

```javascript
import React from 'react';
import { CodeVentureAuthHOC } from './src/index.ts';

const MyScratchEditor = ({ codeventureUser, isValidatingCodeVentureAuth }) => {
    return (
        <div>
            <h1>Scratch Editor</h1>
            {isValidatingCodeVentureAuth && (
                <div>Validating authentication...</div>
            )}
            {codeventureUser && (
                <div>Welcome, {codeventureUser.username}!</div>
            )}
        </div>
    );
};

// Wrap with authentication HOC
const AuthenticatedScratchEditor = CodeVentureAuthHOC(MyScratchEditor);
```

### 2. Manual Authentication Validation

You can also manually validate authentication parameters:

```javascript
import { validateAuthParams, createUserData } from './src/index.ts';

const authParams = {
    token: 'your-jwt-token',
    username: 'user123',
    userId: '456',
    source: 'codeventure'
};

const validation = validateAuthParams(authParams);
if (validation.isValid) {
    const userData = createUserData(authParams);
    console.log('User authenticated:', userData);
}
```

### 3. API Validation (Production)

For production environments, enable API validation:

```javascript
import { validateTokenWithAPI, DEFAULT_CONFIG } from './src/index.ts';

// Configure for production
const config = {
    ...DEFAULT_CONFIG,
    requireAPIValidation: true,
    apiUrl: 'https://codeventure.app/api/auth/validate'
};

const apiValidation = await validateTokenWithAPI(
    token,
    username,
    userId,
    config.apiUrl
);
```

## URL Parameters

The authentication system expects these URL parameters:

- `token` - JWT token from CodeVenture
- `username` - User's username
- `user_id` - User's unique identifier
- `source` - Must be "codeventure"

Example URL:
```
https://your-scratch-editor.com/?token=JWT_TOKEN&username=john_doe&user_id=12345&source=codeventure
```

## Configuration

Configure the authentication system by modifying the `DEFAULT_CONFIG`:

```javascript
import { DEFAULT_CONFIG } from './src/index.ts';

const config = {
    apiUrl: 'https://codeventure.app/api/auth/validate',
    tokenExpiration: 24 * 60 * 60 * 1000, // 24 hours
    requireAPIValidation: false, // Set to true in production
    cleanUrlAfterAuth: true
};
```

## Integration with Existing Components

The authentication system is already integrated into the main Scratch GUI through the `render-gui-standalone.jsx` file. The menu bar automatically displays CodeVenture users with a "CV" indicator.

## Security Features

- JWT token validation
- URL parameter cleanup
- Configurable API validation
- Token expiration checking
- Secure parameter handling

## Testing

Use the provided test URLs in `codeventure-auth-example.html` to test the authentication flow:

```bash
npm run build
# Serve the built files and open the example HTML file
```

## Support

For more detailed information, see the complete documentation in `CODEVENTURE_AUTH.md`.
