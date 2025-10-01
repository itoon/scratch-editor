import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { projectTitleInitialState } from '../reducers/project-title';
import { showAlertWithTimeout } from '../reducers/alerts';
/**
 * Project saver component passes a downloadProject function to its child.
 * It expects this child to be a function with the signature
 *     function (downloadProject, props) {}
 * The component can then be used to attach project saving functionality
 * to any other component:
 *
 * <SB3Save>{(downloadProject, props) => (
 *     <MyCoolComponent
 *         onClick={downloadProject}
 *         {...props}
 *     />
 * )}</SB3Save>
 */
class SB3Save extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'downloadProject'
        ]);
    }
    async downloadProject() {
        // Show saving alert with spinner
        this.props.onShowAlert('saving');

        await this.props.saveProjectSb3().then(async content => {
            if (this.props.onSaveFinished) {
                this.props.onSaveFinished();
            }

            // content is a blob
            try {
                const accessToken = localStorage.getItem('codeventure_access_token');

                // Convert blob to file
                const file = new File([content], this.props.projectFilename, {
                    type: 'application/octet-stream'
                });

                // Create FormData and append the file
                const formData = new FormData();
                formData.append('file', file);
                formData.append('title', this.props.projectFilename);

                // Check if we already have a projectId in the URL
                const urlParams = new URLSearchParams(window.location.search);
                const existingProjectId = urlParams.get('projectId');

                // Build the API URL with projectId if it exists
                const apiBaseUrl = process.env.CODEVENTURE_API_URL || 'http://localhost:4000';
                let apiUrl = `${apiBaseUrl}/api/v1/projects/save`;
                if (existingProjectId) {
                    apiUrl += `?projectId=${existingProjectId}`;
                }

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Project saved successfully:', result);

                    // Update URL with projectId if we got one back
                    if (result.projectId) {
                        const newUrl = new URL(window.location);
                        newUrl.searchParams.set('projectId', result.projectId);
                        window.history.replaceState({}, '', newUrl.toString());
                        console.log('URL updated with projectId:', result.projectId);
                    }

                    // Show success alert
                    this.props.onShowAlert('saveSuccess');
                } else {
                    // Show error alert
                    this.props.onShowAlert('savingError');
                }
            } catch (error) {
                console.error('Error saving project:', error);
                // Show error alert
                this.props.onShowAlert('savingError');
            }

            // downloadBlob(this.props.projectFilename, content);
        });
    }
    render() {
        const {
            children
        } = this.props;
        return children(
            this.props.className,
            this.downloadProject
        );
    }
}

const getProjectFilename = (curTitle, defaultTitle) => {
    let filenameTitle = curTitle;
    if (!filenameTitle || filenameTitle.length === 0) {
        filenameTitle = defaultTitle;
    }
    return `${filenameTitle.substring(0, 100)}.sb3`;
};

SB3Save.propTypes = {
    children: PropTypes.func,
    className: PropTypes.string,
    onSaveFinished: PropTypes.func,
    onShowAlert: PropTypes.func,
    projectFilename: PropTypes.string,
    saveProjectSb3: PropTypes.func
};
SB3Save.defaultProps = {
    className: ''
};

const mapStateToProps = state => ({
    saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm),
    projectFilename: getProjectFilename(state.scratchGui.projectTitle, projectTitleInitialState)
});

const mapDispatchToProps = dispatch => ({
    onShowAlert: alertId => showAlertWithTimeout(dispatch, alertId)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SB3Save);
