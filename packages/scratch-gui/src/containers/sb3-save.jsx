import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { projectTitleInitialState, setProjectTitle } from '../reducers/project-title';
import { showAlertWithTimeout } from '../reducers/alerts';
import VM from '@scratch/scratch-vm';

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
            'downloadProject',
            'getProjectThumbnail'
        ]);
    }

    getProjectThumbnail(callback) {
        this.props.vm.postIOData('video', { forceTransparentPreview: true });
        this.props.vm.renderer.requestSnapshot(dataURI => {
            this.props.vm.postIOData('video', { forceTransparentPreview: false });
            callback(dataURI);
        });
        this.props.vm.renderer.draw();
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

                this.getProjectThumbnail(async dataURI => {
                    // Convert dataURI to Blob
                    const response = await fetch(dataURI);
                    const blob = await response.blob();
                    const thumbnailFile = new File([blob], 'thumbnail.png', {
                        type: 'image/png'
                    });

                    // Create FormData and append the file
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('thumbnail', thumbnailFile);
                    // Send the project title (not the filename)
                    formData.append('title', this.props.projectTitle);
                    setProjectTitle(this.props.projectTitle);

                    // Check if we already have a projectId in the URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const existingProjectId = urlParams.get('projectId');

                    // Build the API URL with projectId if it exists
                    const apiBaseUrl = process.env.CODEVENTURE_API_URL || 'http://localhost:4000';
                    let apiUrl = `${apiBaseUrl}/api/1.0/projects/save`;
                    if (existingProjectId) {
                        apiUrl += `?projectId=${existingProjectId}`;
                    }

                    try {
                        const uploadResponse = await fetch(apiUrl, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                Authorization: `Bearer ${accessToken}`
                            }
                        });

                        if (uploadResponse.ok) {
                            const result = await uploadResponse.json();
                            console.log('Project saved successfully:', result);

                            // Update URL with projectId if we got one back
                            if (result.projectId) {
                                const newUrl = new URL(window.location);
                                // Clear all existing query parameters and only keep projectId
                                newUrl.search = '';
                                newUrl.searchParams.set('projectId', result.projectId);
                                window.history.replaceState({}, '', newUrl.toString());
                                console.log('URL updated with projectId:', result.projectId);
                            }

                            // Update project title from response if available
                            if (result.scratch && result.scratch.title) {
                                this.props.onSetProjectTitle(result.scratch.title);
                                console.log('Project title updated:', result.scratch.title);
                            }

                            // Show success alert
                            this.props.onShowAlert('saveSuccess');
                        } else {
                            // Show error alert
                            this.props.onShowAlert('savingError');
                        }
                    } catch (uploadError) {
                        console.error('Error uploading project:', uploadError);
                        this.props.onShowAlert('savingError');
                    }
                });
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
    onSetProjectTitle: PropTypes.func,
    onShowAlert: PropTypes.func,
    projectFilename: PropTypes.string,
    projectTitle: PropTypes.string,
    saveProjectSb3: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};
SB3Save.defaultProps = {
    className: ''
};

const mapStateToProps = state => ({
    saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm),
    projectFilename: getProjectFilename(state.scratchGui.projectTitle, projectTitleInitialState),
    projectTitle: state.scratchGui.projectTitle || projectTitleInitialState
});

const mapDispatchToProps = dispatch => ({
    onShowAlert: alertId => showAlertWithTimeout(dispatch, alertId),
    onSetProjectTitle: title => dispatch(setProjectTitle(title))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SB3Save);
