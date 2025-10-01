/**
 * CodeVenture Authentication Utilities
 * Handles token validation and user authentication for CodeVenture integration
 */

/**
 * Validates a JWT token format
 * @param {string} token - The JWT token to validate
 * @returns {boolean} - Whether the token has a valid JWT format
 */
export const isValidJWTFormat = token => {
    if (!token || typeof token !== 'string') {
        return false;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }
    
    // Check if each part is base64 encoded
    try {
        parts.forEach(part => {
            // Add padding if needed
            const padded = part + '='.repeat((4 - part.length % 4) % 4);
            atob(padded);
        });
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Decodes JWT payload without verification (for client-side inspection only)
 * @param {string} token - The JWT token
 * @returns {object|null} - The decoded payload or null if invalid
 */
export const decodeJWTPayload = token => {
    try {
        if (!isValidJWTFormat(token)) {
            return null;
        }
        
        const parts = token.split('.');
        const payload = parts[1];
        
        // Add padding if needed
        const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
        const decoded = atob(padded);
        
        return JSON.parse(decoded);
    } catch (e) {
        console.error('Error decoding JWT payload:', e);
        return null;
    }
};

/**
 * Checks if a JWT token is expired
 * @param {string} token - The JWT token
 * @returns {boolean} - Whether the token is expired
 */
export const isTokenExpired = token => {
    const payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) {
        return true; // Assume expired if no expiration time
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= payload.exp;
};

/**
 * Validates CodeVenture authentication parameters
 * @param {object} params - Authentication parameters
 * @param {string} params.token - JWT token
 * @param {string} params.username - Username
 * @param {string} params.userId - User ID
 * @param {string} params.source - Source (should be 'codeventure')
 * @returns {object} - Validation result with isValid and errors
 */
export const validateAuthParams = ({token, username, userId, source}) => {
    const errors = [];
    console.log('token', token);
    
    if (!token) {
        errors.push('Token is required');
    }
    
    if (!username || typeof username !== 'string') {
        errors.push('Valid username is required');
    }
    
    if (!userId) {
        errors.push('User ID is required');
    }
    
    if (source !== 'codeventure') {
        errors.push('Invalid source - must be "codeventure"');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates token with CodeVenture API (for production use)
 * @param {string} token - JWT token
 * @param {string} username - Username
 * @param {string} userId - User ID
 * @param {string} apiUrl - CodeVenture API URL (optional, defaults to production)
 * @returns {Promise<object>} - Validation result
 */
export const validateTokenWithAPI = async (token, username, userId, apiUrl) => {
    if (!apiUrl) {
        const apiBaseUrl = process.env.CODEVENTURE_API_URL || 'http://localhost:4000';
        apiUrl = `${apiBaseUrl}/api/1.0/sso/exchange`;
    }
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({token, username, userId})
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return {
            isValid: data.status === 200,
            userData: data.data?.user || data.user,
            accessToken: data.data?.accessToken,
            error: null
        };
    } catch (error) {
        console.error('Token validation API error:', error);
        return {
            isValid: false,
            userData: null,
            accessToken: null,
            error: error.message
        };
    }
};

/**
 * Validates access token and retrieves user data from /auth/me endpoint
 * @param {string} accessToken - Access token
 * @param {string} apiUrl - API base URL
 * @returns {Promise<object>} - User data or error
 */
export const getUserFromAccessToken = async (accessToken, apiUrl) => {
    if (!apiUrl) {
        const apiBaseUrl = process.env.CODEVENTURE_API_URL || 'http://localhost:4000';
        apiUrl = `${apiBaseUrl}/api/1.0/auth/me`;
    }
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return {
            isValid: data.status === 200 || response.status === 200,
            userData: data.data?.user || data.user || data.data,
            error: null
        };
    } catch (error) {
        console.error('Get user from access token error:', error);
        return {
            isValid: false,
            userData: null,
            error: error.message
        };
    }
};

/**
 * Creates a user data object from validated authentication parameters
 * @param {object} params - Authentication parameters
 * @param {object} additionalData - Additional user data from API (optional)
 * @returns {object} - User data object
 */
export const createUserData = (params, additionalData = {}) => ({
    isAuthenticated: true,
    token: params.token,
    accessToken: params.accessToken || params.token,
    username: params.username,
    userId: params.userId,
    source: 'codeventure',
    displayName: additionalData.displayName || params.username,
    avatarImage: additionalData.avatarImage || null,
    email: additionalData.email || null,
    profile: additionalData.profile || {},
    validatedAt: new Date().toISOString(),
    ...additionalData
});

/**
 * Cleans sensitive authentication parameters from URL
 * @param {Array<string>} additionalParams - Additional parameters to clean (optional)
 */
export const cleanAuthFromURL = (additionalParams = []) => {
    const url = new URL(window.location);
    const defaultParams = ['token', 'auth_token', 'username', 'user', 'user_id', 'userId', 'source'];
    const allParams = [...defaultParams, ...additionalParams];
    
    let hasChanges = false;
    allParams.forEach(param => {
        if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        window.history.replaceState({}, document.title, url.toString());
    }
};

/**
 * LocalStorage key for storing access token
 */
const STORAGE_KEY = 'codeventure_access_token';

/**
 * Save access token to localStorage
 * @param {string} accessToken - Access token to save
 */
export const saveAccessToken = accessToken => {
    try {
        if (accessToken) {
            localStorage.setItem(STORAGE_KEY, accessToken);
            console.log('CodeVenture Auth: Access token saved to localStorage');
        }
    } catch (error) {
        console.error('Error saving access token:', error);
    }
};

/**
 * Get access token from localStorage
 * @returns {string|null} - Stored access token or null
 */
export const getStoredAccessToken = () => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error reading access token:', error);
        return null;
    }
};

/**
 * Clear access token from localStorage
 */
export const clearAccessToken = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('CodeVenture Auth: Access token cleared from localStorage');
    } catch (error) {
        console.error('Error clearing access token:', error);
    }
};

/**
 * Logout user - clears session data
 */
export const logout = () => {
    clearAccessToken();
    console.log('CodeVenture Auth: User logged out');
};

/**
 * Default configuration for CodeVenture authentication
 */
export const DEFAULT_CONFIG = {
    apiUrl: 'https://codeventure.app/api/auth/validate',
    tokenExpiration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    requireAPIValidation: true, // Set to true in production
    cleanUrlAfterAuth: true
};
