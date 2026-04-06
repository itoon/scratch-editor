import React from 'react';
import queryString from 'query-string';

import {
    validateAuthParams,
    validateTokenWithAPI,
    createUserData,
    cleanAuthFromURL,
    getUserFromAccessToken,
    saveAccessToken,
    getStoredAccessToken,
    clearAccessToken,
    DEFAULT_CONFIG
} from './codeventure-auth';

const CodeVentureAuthHOC = function (WrappedComponent) {
    class CodeVentureAuthComponent extends React.Component {
        constructor (props) {
            super(props);

            this.state = {
                codeventureUser: null,
                isValidatingToken: false
            };
        }

        componentDidMount () {
            this.parseAuthFromUrl();
            this.restoreSessionFromStorage();
        }

        parseAuthFromUrl () {
            const queryParams = queryString.parse(window.location.search);
            const token = queryParams.token || queryParams.auth_token;
            const username = queryParams.username || queryParams.user;
            const userId = queryParams.user_id || queryParams.userId;
            const source = queryParams.source;

            if (token && username && source === 'codeventure') {
                this.setState({isValidatingToken: true});
                this.validateAndSetAuth(token, username, userId);
            }
        }

        async restoreSessionFromStorage () {
            const queryParams = queryString.parse(window.location.search);
            if (queryParams.token && queryParams.source === 'codeventure') {
                return;
            }

            const storedAccessToken = getStoredAccessToken();
            if (!storedAccessToken) {
                return;
            }

            this.setState({isValidatingToken: true});

            try {
                const result = await getUserFromAccessToken(storedAccessToken);

                if (result.isValid && result.userData) {
                    const userData = createUserData(
                        {
                            token: storedAccessToken,
                            username: result.userData.username,
                            userId: result.userData._id || result.userData.id
                        },
                        result.userData
                    );

                    this.setState({
                        codeventureUser: userData,
                        isValidatingToken: false
                    });
                } else {
                    clearAccessToken();
                    this.setState({isValidatingToken: false});
                }
            } catch (error) {
                console.error('CodeVenture Auth: Error restoring session:', error);
                clearAccessToken();
                this.setState({isValidatingToken: false});
            }
        }

        async validateAndSetAuth (token, username, userId) {
            try {
                const validation = validateAuthParams({token, username, userId, source: 'codeventure'});

                if (!validation.isValid) {
                    this.handleAuthFailure();
                    return;
                }

                if (DEFAULT_CONFIG.requireAPIValidation) {
                    const apiValidation = await validateTokenWithAPI(token, username, userId);

                    if (!apiValidation.isValid) {
                        this.handleAuthFailure();
                        return;
                    }

                    if (apiValidation.accessToken) {
                        saveAccessToken(apiValidation.accessToken);
                    }

                    const userData = createUserData({token, username, userId}, apiValidation.userData);
                    this.setState({
                        codeventureUser: userData,
                        isValidatingToken: false
                    });
                } else {
                    const userData = createUserData({token, username, userId});
                    this.setState({
                        codeventureUser: userData,
                        isValidatingToken: false
                    });
                }

                if (DEFAULT_CONFIG.cleanUrlAfterAuth) {
                    cleanAuthFromURL();
                }
            } catch (error) {
                console.error('Error validating CodeVenture token:', error);
                this.handleAuthFailure();
            }
        }

        handleAuthFailure () {
            clearAccessToken();
            this.setState({
                codeventureUser: null,
                isValidatingToken: false
            });
        }

        render () {
            return (
                <WrappedComponent
                    codeventureUser={this.state.codeventureUser}
                    isValidatingCodeVentureAuth={this.state.isValidatingToken}
                    {...this.props}
                />
            );
        }
    }

    CodeVentureAuthComponent.propTypes = {};

    return CodeVentureAuthComponent;
};

export {
    CodeVentureAuthHOC as default
};
