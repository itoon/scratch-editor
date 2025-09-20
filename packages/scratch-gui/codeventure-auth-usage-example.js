/**
 * CodeVenture Authentication Usage Example
 * 
 * This file demonstrates how to use the CodeVenture authentication system
 * that is now exported from the main index.ts file.
 */

// Import the authentication utilities from the main package
import { 
    CodeVentureAuthHOC,
    validateAuthParams,
    validateTokenWithAPI,
    createUserData,
    cleanAuthFromURL,
    DEFAULT_CONFIG
} from './src/index.ts';

// Example 1: Using the HOC to wrap a component
import React from 'react';

// Your existing component
const MyScratchEditor = ({ codeventureUser, isValidatingCodeVentureAuth }) => {
    return (
        <div>
            <h1>Scratch Editor</h1>
            {isValidatingCodeVentureAuth && (
                <div>Validating CodeVenture authentication...</div>
            )}
            {codeventureUser && (
                <div>
                    <p>Welcome, {codeventureUser.username}!</p>
                    <p>Authenticated via: {codeventureUser.source}</p>
                </div>
            )}
        </div>
    );
};

// Wrap your component with the authentication HOC
const AuthenticatedScratchEditor = CodeVentureAuthHOC(MyScratchEditor);

// Example 2: Manual authentication validation
const exampleAuthValidation = async () => {
    // Example authentication parameters from URL
    const authParams = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        username: 'john_doe',
        userId: '12345',
        source: 'codeventure'
    };

    // Validate parameters
    const validation = validateAuthParams(authParams);
    
    if (validation.isValid) {
        console.log('Authentication parameters are valid');
        
        // Optionally validate with API (if enabled)
        if (DEFAULT_CONFIG.requireAPIValidation) {
            const apiValidation = await validateTokenWithAPI(
                authParams.token,
                authParams.username,
                authParams.userId
            );
            
            if (apiValidation.isValid) {
                const userData = createUserData(authParams, apiValidation.userData);
                console.log('User authenticated:', userData);
            }
        } else {
            const userData = createUserData(authParams);
            console.log('User authenticated locally:', userData);
        }
        
        // Clean URL parameters
        if (DEFAULT_CONFIG.cleanUrlAfterAuth) {
            cleanAuthFromURL();
        }
    } else {
        console.error('Authentication validation failed:', validation.errors);
    }
};

// Example 3: Configuration
const configureAuthentication = () => {
    // Update configuration for production
    const productionConfig = {
        ...DEFAULT_CONFIG,
        requireAPIValidation: true,
        apiUrl: 'https://codeventure.app/api/auth/validate'
    };
    
    console.log('Production configuration:', productionConfig);
};

export {
    AuthenticatedScratchEditor,
    exampleAuthValidation,
    configureAuthentication
};
