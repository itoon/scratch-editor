# CodeVenture Authentication Integration

This document describes the implementation of token-based authentication for integrating the Scratch Editor with [CodeVenture](https://codeventure.app/).

## Overview

The integration allows users logged into CodeVenture to seamlessly access the Scratch Editor without additional authentication. When users click the "Scratch" menu in CodeVenture, they are redirected to the Scratch Editor with authentication parameters that automatically log them in.

## User Flow

1. User is logged into CodeVenture (https://codeventure.app/)
2. User clicks "Scratch" menu item in CodeVenture
3. CodeVenture generates a JWT token for the user
4. User is redirected to: `your-scratch-editor.com/?token=JWT&username=USER&user_id=ID&source=codeventure`
5. Scratch Editor validates the token and automatically authenticates the user
6. URL parameters are cleaned for security
7. User sees their name in the menu bar with "CV" indicator

## Implementation Files

### Core Files

- **`src/lib/codeventure-auth-hoc.jsx`** - Higher-Order Component that handles authentication
- **`src/lib/codeventure-auth.js`** - Utility functions for token validation and user management
- **`src/playground/render-gui-standalone.jsx`** - Updated to include the auth HOC
- **`src/components/menu-bar/menu-bar.jsx`** - Updated to display CodeVenture users
- **`src/components/menu-bar/menu-bar.css`** - Styles for CodeVenture user indicator

### Example Files

- **`codeventure-auth-example.html`** - Demo page with example authentication URLs
- **`CODEVENTURE_AUTH.md`** - This documentation file

## URL Parameters

The authentication system expects the following URL parameters:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `token` | Yes | JWT token from CodeVenture |
| `username` | Yes | User's username |
| `user_id` | Yes | User's unique identifier |
| `source` | Yes | Must be "codeventure" |

### Example URL

```
https://your-scratch-editor.com/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&username=john_doe&user_id=12345&source=codeventure
```

## Authentication Process

### 1. URL Parameter Parsing

The `CodeVentureAuthHOC` component automatically:
- Parses URL parameters on component mount
- Extracts authentication data
- Validates the source parameter

### 2. Token Validation

Two validation modes are supported:

#### Basic Validation (Development)
- Validates JWT format
- Checks token expiration
- Validates required parameters

#### API Validation (Production)
- All basic validation steps
- Makes API call to CodeVenture to verify token
- Retrieves additional user profile data

### 3. User Authentication

On successful validation:
- User data is stored in component state
- User appears as authenticated in the menu bar
- URL parameters are cleaned from the browser address bar

## Configuration

Edit `src/lib/codeventure-auth.js` to configure authentication behavior:

```javascript
export const DEFAULT_CONFIG = {
    apiUrl: 'https://codeventure.app/api/auth/validate',
    tokenExpiration: 24 * 60 * 60 * 1000, // 24 hours
    requireAPIValidation: false, // Set to true in production
    cleanUrlAfterAuth: true
};
```

### Configuration Options

- **`apiUrl`** - CodeVenture API endpoint for token validation
- **`tokenExpiration`** - Maximum token age in milliseconds
- **`requireAPIValidation`** - Whether to validate tokens with CodeVenture API
- **`cleanUrlAfterAuth`** - Whether to remove auth parameters from URL

## CodeVenture Backend Requirements

### JWT Token Generation

CodeVenture must generate JWT tokens with the following payload structure:

```javascript
{
  "sub": "user_id",           // User's unique identifier
  "username": "user_name",    // User's username
  "iat": 1516239022,         // Issued at timestamp
  "exp": 1516325422,         // Expiration timestamp
  "iss": "codeventure.app"   // Issuer
}
```

### Token Validation API (Optional)

For production use, CodeVenture should provide a validation endpoint:

```
POST https://codeventure.app/api/auth/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "user123",
  "userId": "12345"
}
```

**Response:**
```json
{
  "valid": true,
  "username": "user123",
  "userId": "12345",
  "profile": {
    "displayName": "User Name",
    "avatar": "avatar_url",
    "subscription": "premium"
  }
}
```

## User Interface

### Menu Bar Display

When authenticated via CodeVenture, users see:
- Green "CV" badge indicating CodeVenture authentication
- Username displayed next to the badge
- Hover tooltip: "Logged in as [username] from CodeVenture"

### CSS Styling

The CodeVenture user indicator uses these CSS classes:
- `.codeventure-user` - Container for the user display
- `.codeventure-indicator` - Green "CV" badge
- `.username` - Username text styling

## Security Considerations

1. **HTTPS Only** - All authentication should occur over HTTPS
2. **Token Expiration** - JWT tokens should have reasonable expiration times
3. **URL Cleanup** - Sensitive parameters are removed from browser history
4. **API Validation** - Production deployments should enable API validation
5. **CORS Configuration** - Ensure proper CORS headers for API calls

## Testing

### Development Testing

1. Build the project: `npm run build`
2. Serve the built files locally
3. Open `codeventure-auth-example.html` for test links
4. Click test links to verify authentication flow

### Example Test URLs

```bash
# Valid authentication
/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lkb7zqJUFQOlvNa_5Rz7lEHEZf5YhM8C1qJ5nJ8t9pI&username=john_doe&user_id=12345&source=codeventure

# Invalid token test
/?token=invalid_token&username=jane_smith&user_id=67890&source=codeventure

# Missing token test
/?username=no_token_user&user_id=11111&source=codeventure
```

### Production Testing

1. Enable API validation in configuration
2. Set up CodeVenture API endpoint
3. Test with real JWT tokens from CodeVenture
4. Verify token validation with API
5. Test error handling for invalid tokens

## Troubleshooting

### Common Issues

1. **User not appearing as authenticated**
   - Check URL parameters are present and correct
   - Verify token format (should be valid JWT)
   - Check browser console for validation errors

2. **Token validation failing**
   - Ensure token is not expired
   - Verify CodeVenture API endpoint is accessible
   - Check CORS configuration

3. **URL parameters not being cleaned**
   - Verify `cleanUrlAfterAuth` is enabled in configuration
   - Check browser console for JavaScript errors

### Debug Mode

Enable debug logging by adding to browser console:

```javascript
localStorage.setItem('codeventure-auth-debug', 'true');
```

## Future Enhancements

Potential improvements for the authentication system:

1. **Token Refresh** - Implement automatic token renewal
2. **User Profile Integration** - Display CodeVenture profile information
3. **Project Sync** - Sync Scratch projects with CodeVenture account
4. **Session Management** - Persist authentication across browser sessions
5. **Multi-Provider Support** - Support authentication from multiple sources

## Support

For issues or questions about the CodeVenture authentication integration:

1. Check the browser console for error messages
2. Verify URL parameter format matches specification
3. Test with the provided example URLs
4. Review configuration settings in `codeventure-auth.js`

## License

This integration follows the same license as the main Scratch Editor project.
