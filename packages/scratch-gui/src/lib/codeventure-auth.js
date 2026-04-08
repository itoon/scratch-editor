/**
 * CodeVenture Authentication Utilities
 * Handles token validation and user authentication for CodeVenture integration
 */

export const getCodeVentureApiBaseUrl = () =>
    process.env.CODEVENTURE_API_URL || "http://localhost:4000";

export const getCodeVentureAppBaseUrl = () =>
    process.env.CODEVENTURE_APP_URL || "http://localhost:3000";

export const isValidJWTFormat = (token) => {
    if (!token || typeof token !== "string") {
        return false;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
        return false;
    }

    try {
        parts.forEach((part) => {
            const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
            atob(padded);
        });
        return true;
    } catch (e) {
        return false;
    }
};

export const decodeJWTPayload = (token) => {
    try {
        if (!isValidJWTFormat(token)) {
            return null;
        }

        const parts = token.split(".");
        const payload = parts[1];
        const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
        const decoded = atob(padded);

        return JSON.parse(decoded);
    } catch (e) {
        console.error("Error decoding JWT payload:", e);
        return null;
    }
};

export const isTokenExpired = (token) => {
    const payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) {
        return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= payload.exp;
};

export const validateAuthParams = ({ token, username, userId, source }) => {
    const errors = [];

    if (!token) {
        errors.push("Token is required");
    }

    if (!username || typeof username !== "string") {
        errors.push("Valid username is required");
    }

    if (!userId) {
        errors.push("User ID is required");
    }

    if (source !== "codeventure") {
        errors.push('Invalid source - must be "codeventure"');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

export const validateTokenWithAPI = async (token, username, userId, apiUrl) => {
    if (!apiUrl) {
        apiUrl = `${getCodeVentureApiBaseUrl()}/api/1.0/sso/exchange`;
    }
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ token, username, userId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            isValid: data.status === 200,
            userData: data.data?.user || data.user,
            accessToken: data.data?.accessToken,
            error: null,
        };
    } catch (error) {
        console.error("Token validation API error:", error);
        return {
            isValid: false,
            userData: null,
            accessToken: null,
            error: error.message,
        };
    }
};

export const getUserFromAccessToken = async (accessToken, apiUrl) => {
    if (!apiUrl) {
        apiUrl = `${getCodeVentureApiBaseUrl()}/api/1.0/auth/me`;
    }
    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            isValid: data.status === 200 || response.status === 200,
            userData: data.data?.user || data.user || data.data,
            error: null,
        };
    } catch (error) {
        console.error("Get user from access token error:", error);
        return {
            isValid: false,
            userData: null,
            error: error.message,
        };
    }
};

export const createUserData = (params, additionalData = {}) => ({
    isAuthenticated: true,
    token: params.token,
    accessToken: params.accessToken || params.token,
    username: params.username,
    userId: params.userId,
    source: "codeventure",
    displayName: additionalData.displayName || params.username,
    avatarImage: additionalData.avatarImage || null,
    email: additionalData.email || null,
    profile: additionalData.profile || {},
    validatedAt: new Date().toISOString(),
    ...additionalData,
});

export const cleanAuthFromURL = (additionalParams = []) => {
    const url = new URL(window.location);
    const defaultParams = [
        "token",
        "auth_token",
        "username",
        "user",
        "user_id",
        "userId",
        "source",
    ];
    const allParams = [...defaultParams, ...additionalParams];

    let hasChanges = false;
    allParams.forEach((param) => {
        if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
            hasChanges = true;
        }
    });

    if (hasChanges) {
        window.history.replaceState({}, document.title, url.toString());
    }
};

const STORAGE_KEY = "codeventure_access_token";

export const saveAccessToken = (accessToken) => {
    try {
        if (accessToken) {
            localStorage.setItem(STORAGE_KEY, accessToken);
        }
    } catch (error) {
        console.error("Error saving access token:", error);
    }
};

export const getStoredAccessToken = () => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.error("Error reading access token:", error);
        return null;
    }
};

export const clearAccessToken = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Error clearing access token:", error);
    }
};

export const logout = () => {
    clearAccessToken();
};

export const DEFAULT_CONFIG = {
    apiUrl: "https://codeventure.app/api/auth/validate",
    tokenExpiration: 24 * 60 * 60 * 1000,
    requireAPIValidation: true,
    cleanUrlAfterAuth: true,
};
