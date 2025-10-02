# Session Management Documentation

## Overview

The CodeVenture authentication now includes persistent session management using localStorage. Users will remain logged in even after page refresh.

## How It Works

### 1. Initial Login Flow (SSO Exchange)

1. User clicks "Go to Scratch" on CodeVenture dashboard
2. Redirects to: `http://localhost:8601/?token=...&username=...&user_id=...&source=codeventure`
3. Scratch editor calls `/api/1.0/sso/exchange` with the token
4. API returns:
   ```json
   {
     "status": 200,
     "data": {
       "accessToken": "long-lived-access-token",
       "user": {
         "displayName": "Songklod",
         "avatarImage": "/student-avatar/art-toy/15-egg.svg",
         "email": "songklod@marvelous.studio",
         ...
       }
     }
   }
   ```
5. **Access token is saved to localStorage** as `codeventure_access_token`
6. User data is displayed in the menu bar
7. URL parameters are cleaned for security

### 2. Session Restoration (After Refresh)

1. On page load, `restoreSessionFromStorage()` checks for stored access token
2. If found, calls `GET /api/1.0/auth/me` with the access token
3. API validates token and returns current user data
4. Session is restored with user's profile
5. User remains logged in seamlessly

### 3. Session Expiration/Logout

- If `/auth/me` returns an error (401, 403, etc.), the stored token is cleared
- User can manually logout (implementation can be added to menu)
- On logout, localStorage is cleared

## API Endpoints Used

### SSO Exchange (Initial Login)
```
POST http://localhost:4000/api/1.0/sso/exchange
Headers:
  Authorization: Bearer {temporary-token}
  Content-Type: application/json
Body:
  {
    "token": "...",
    "username": "...",
    "userId": "..."
  }
Response:
  {
    "status": 200,
    "data": {
      "accessToken": "...",
      "user": { ... }
    }
  }
```

### Get Current User (Session Restore)
```
GET http://localhost:4000/api/1.0/auth/me
Headers:
  Authorization: Bearer {access-token}
Response:
  {
    "status": 200,
    "data": {
      "user": { ... }
    }
  }
```

## Key Functions

### `codeventure-auth.js`

- `validateTokenWithAPI()` - Exchanges temporary token for access token
- `getUserFromAccessToken()` - Gets user data from stored access token
- `saveAccessToken()` - Saves access token to localStorage
- `getStoredAccessToken()` - Retrieves stored access token
- `clearAccessToken()` - Clears stored access token
- `logout()` - Logs out user completely

### `codeventure-auth-hoc.jsx`

- `parseAuthFromUrl()` - Handles SSO login from URL params
- `restoreSessionFromStorage()` - Restores session on page load
- `validateAndSetAuth()` - Validates and saves new session
- `handleAuthFailure()` - Clears session on auth failure

## User Data Structure

```javascript
{
  isAuthenticated: true,
  token: "temporary-sso-token",
  accessToken: "long-lived-access-token",
  username: "outfuzzy31",
  userId: "66bd6f8e5e9b8732f07d4261",
  source: "codeventure",
  displayName: "Songklod",
  avatarImage: "/student-avatar/art-toy/15-egg.svg",
  email: "songklod@marvelous.studio",
  // ... other user fields from API
}
```

## Configuration

In `codeventure-auth.js`:

```javascript
export const DEFAULT_CONFIG = {
  apiUrl: 'https://codeventure.app/api/auth/validate',
  tokenExpiration: 24 * 60 * 60 * 1000, // 24 hours
  requireAPIValidation: true, // Must be true for production
  cleanUrlAfterAuth: true
};
```

## Development vs Production

### Development (localhost:4000)
- Uses `http://localhost:4000/api/1.0/sso/exchange`
- Uses `http://localhost:4000/api/1.0/auth/me`

### Production (codeventure.app)
- Update API URLs in the functions:
  - `validateTokenWithAPI()` default param
  - `getUserFromAccessToken()` default param
- Or configure via environment variables

## Testing Session Persistence

1. Login via SSO URL with token
2. Verify user appears in menu bar
3. Open browser DevTools > Application > LocalStorage
4. Confirm `codeventure_access_token` is stored
5. Refresh the page (F5)
6. Verify user is still logged in
7. Clear localStorage
8. Refresh again - user should be logged out

## Security Considerations

✅ **Implemented:**
- Access token stored in localStorage (not sessionStorage for persistence)
- URL parameters cleaned after auth
- Token validation on every page load
- Automatic token clearing on validation failure

⚠️ **Recommendations:**
- Use HTTPS in production
- Implement token expiration checking
- Consider refresh token rotation
- Add CSRF protection if needed
- Implement secure logout endpoint

## Adding Logout Button

To add logout functionality to the menu bar:

```jsx
import { logout } from '../lib/codeventure-auth';

// In menu component
handleLogout = () => {
  logout();
  this.setState({ codeventureUser: null });
  // Optionally redirect to CodeVenture
  window.location.href = 'https://codeventure.app/logout';
};
```

