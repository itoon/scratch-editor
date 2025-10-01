import React from 'react';
import queryString from 'query-string';

import {
    validateAuthParams,
    validateTokenWithAPI,
    createUserData,
    cleanAuthFromURL,
    DEFAULT_CONFIG
} from './codeventure-auth';

/* Higher Order Component to handle CodeVenture authentication from URL parameters
 * @param {React.Component} WrappedComponent: component to render
 * @returns {React.Component} component with CodeVenture authentication parsing behavior
 */
const CodeVentureAuthHOC = function (WrappedComponent) {
    class CodeVentureAuthComponent extends React.Component {
        constructor(props) {
            super(props);

            console.log('CodeVenture Auth: HOC initialized');

            this.state = {
                codeventureUser: null,
                isValidatingToken: false
            };
        }

        componentDidMount() {
            this.parseAuthFromUrl();
        }

        parseAuthFromUrl() {
            const queryParams = queryString.parse(window.location.search);
            console.log('CodeVenture Auth: Parsing URL parameters:', queryParams);

            // Extract authentication parameters from URL
            const token = queryParams.token || queryParams.auth_token;
            const username = queryParams.username || queryParams.user;
            const userId = queryParams.user_id || queryParams.userId;
            const source = queryParams.source;

            console.log('CodeVenture Auth: Extracted parameters:', {
                token: token ? `${token.substring(0, 20)}...` : 'missing',
                username,
                userId,
                source
            });

            if (token && username && source === 'codeventure') {
                console.log('CodeVenture Auth: Starting validation...');
                this.setState({ isValidatingToken: true });
                this.validateAndSetAuth(token, username, userId);
            } else {
                console.log('CodeVenture Auth: Missing required parameters or wrong source');
                if (!token) console.log('- Missing token');
                if (!username) console.log('- Missing username');
                if (source !== 'codeventure') console.log('- Wrong source:', source);
            }
        }

        async validateAndSetAuth(token, username, userId) {
            try {
                console.log('CodeVenture Auth: Validating parameters...');
                // Validate authentication parameters
                const validation = validateAuthParams({ token, username, userId, source: 'codeventure' });

                if (!validation.isValid) {
                    console.log('error', validation.errors);
                    console.warn('CodeVenture auth validation failed:', validation.errors);
                    this.handleAuthFailure();
                    return;
                }

                console.log('CodeVenture Auth: Basic validation passed');

                // If API validation is enabled, validate with CodeVenture
                if (DEFAULT_CONFIG.requireAPIValidation) {
                    console.log('CodeVenture Auth: API validation enabled, calling API...');
                    const apiValidation = await validateTokenWithAPI(token, username, userId);

                    if (!apiValidation.isValid) {
                        console.warn('CodeVenture API validation failed:', apiValidation.error);
                        this.handleAuthFailure();
                        return;
                    }

                    // Create user data with API response
                    const userData = createUserData({ token, username, userId }, apiValidation.userData);
                    console.log('CodeVenture Auth: User authenticated via API:', userData);
                    this.setState({
                        codeventureUser: userData,
                        isValidatingToken: false
                    });
                } else {
                    // Basic validation only (for development/testing)
                    const userData = createUserData({ token, username, userId });
                    console.log('CodeVenture Auth: User authenticated locally:', userData);
                    this.setState({
                        codeventureUser: userData,
                        isValidatingToken: false
                    });
                }

                // Clean URL to remove sensitive parameters
                if (DEFAULT_CONFIG.cleanUrlAfterAuth) {
                    console.log('CodeVenture Auth: Cleaning URL parameters...');
                    cleanAuthFromURL();
                }

            } catch (error) {
                console.error('Error validating CodeVenture token:', error);
                this.handleAuthFailure();
            }
        }

        handleAuthFailure() {
            this.setState({
                codeventureUser: null,
                isValidatingToken: false
            });
            console.warn('CodeVenture authentication failed');
        }


        render() {
            const {
                ...componentProps
            } = this.props;

            return (
                <WrappedComponent
                    codeventureUser={this.state.codeventureUser}
                    isValidatingCodeVentureAuth={this.state.isValidatingToken}
                    {...componentProps}
                />
            );
        }
    }

    CodeVentureAuthComponent.propTypes = {
        // Props will be passed through to wrapped component
    };

    return CodeVentureAuthComponent;
};

export {
    CodeVentureAuthHOC as default
};
