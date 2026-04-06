import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from '@scratch/scratch-vm';

import {projectTitleInitialState, setProjectTitle} from '../reducers/project-title';
import {showAlertWithTimeout} from '../reducers/alerts';
import {getCodeVentureApiBaseUrl} from '../lib/codeventure-auth';

class SB3Save extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'downloadProject',
            'getProjectThumbnail'
        ]);
    }

    getProjectThumbnail (callback) {
        this.props.vm.postIOData('video', {forceTransparentPreview: true});
        this.props.vm.renderer.requestSnapshot(dataURI => {
            this.props.vm.postIOData('video', {forceTransparentPreview: false});
            callback(dataURI);
        });
        this.props.vm.renderer.draw();
    }

    async downloadProject () {
        this.props.onShowAlert('saving');

        await this.props.saveProjectSb3().then(async content => {
            if (this.props.onSaveFinished) {
                this.props.onSaveFinished();
            }

            try {
                const accessToken = localStorage.getItem('codeventure_access_token');
                const file = new File([content], this.props.projectFilename, {
                    type: 'application/octet-stream'
                });

                this.getProjectThumbnail(async dataURI => {
                    const response = await fetch(dataURI);
                    const blob = await response.blob();
                    const thumbnailFile = new File([blob], 'thumbnail.png', {
                        type: 'image/png'
                    });

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('thumbnail', thumbnailFile);
                    formData.append('title', this.props.projectTitle);

                    const urlParams = new URLSearchParams(window.location.search);
                    const existingProjectId = urlParams.get('projectId');

                    let apiUrl = `${getCodeVentureApiBaseUrl()}/api/1.0/projects/save`;
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

                            if (result.projectId) {
                                const newUrl = new URL(window.location);
                                newUrl.search = '';
                                newUrl.searchParams.set('projectId', result.projectId);
                                window.history.replaceState({}, '', newUrl.toString());
                            }

                            if (result.scratch && result.scratch.title) {
                                this.props.onSetProjectTitle(result.scratch.title);
                            }

                            this.props.onShowAlert('saveSuccess');
                        } else {
                            this.props.onShowAlert('savingError');
                        }
                    } catch (uploadError) {
                        console.error('Error uploading project:', uploadError);
                        this.props.onShowAlert('savingError');
                    }
                });
            } catch (error) {
                console.error('Error saving project:', error);
                this.props.onShowAlert('savingError');
            }
        });
    }

    render () {
        return this.props.children(
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
