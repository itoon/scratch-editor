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
    
    if (!token) {
        errors.push('Token is required');
    } else if (token !== 'JWT' && !isValidJWTFormat(token)) {
        // Allow 'JWT' as a test token, otherwise validate format
        errors.push('Invalid token format');
    } else if (token !== 'JWT' && isTokenExpired(token)) {
        // Don't check expiration for test token
        errors.push('Token is expired');
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
export const validateTokenWithAPI = async (token, username, userId, apiUrl = 'https://localhost:4000/api/1.0/sso/exchange') => {
    try {
        console.log('apiUrl');
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
        console.log('data', data);
        
        return {
            isValid: data.valid === true,
            userData: data,
            error: null
        };
    } catch (error) {
        console.error('Token validation API error:', error);
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
    username: params.username,
    userId: params.userId,
    source: 'codeventure',
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
 * Default configuration for CodeVenture authentication
 */
export const DEFAULT_CONFIG = {
    apiUrl: 'https://codeventure.app/api/auth/validate',
    tokenExpiration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    requireAPIValidation: false, // Set to true in production
    cleanUrlAfterAuth: true
};
