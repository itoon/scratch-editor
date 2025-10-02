import classNames from 'classnames';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { defineMessages, FormattedMessage, injectIntl, intlShape } from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import bowser from 'bowser';
import React from 'react';

import VM from '@scratch/scratch-vm';

import backIcon from '../../lib/assets/icon--back.svg';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import CommunityButton from './community-button.jsx';
import ShareButton from './share-button.jsx';
import { ComingSoonTooltip } from '../coming-soon/coming-soon.jsx';
import Divider from '../divider/divider.jsx';
import SaveStatus from './save-status.jsx';
import ProjectWatcher from '../../containers/project-watcher.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import { MenuItem, MenuSection } from '../menu/menu.jsx';
import ProjectTitleInput from './project-title-input.jsx';
import AuthorInfo from './author-info.jsx';
import AccountNav from '../../components/menu-bar/account-nav.jsx';
import LoginDropdown from './login-dropdown.jsx';
import SB3Downloader from '../../containers/sb3-downloader.jsx';
import DeletionRestorer from '../../containers/deletion-restorer.jsx';
import TurboMode from '../../containers/turbo-mode.jsx';
import MenuBarHOC from '../../containers/menu-bar-hoc.jsx';
import SettingsMenu from './settings-menu.jsx';
import dataURItoBlob from '../../lib/data-uri-to-blob';


import closeIcon from '../debug-modal/icons/icon--close.svg';

import { openTipsLibrary, openDebugModal } from '../../reducers/modals';
import { setPlayer } from '../../reducers/mode';
import {
    isTimeTravel220022BC,
    isTimeTravel1920,
    isTimeTravel1990,
    isTimeTravel2020,
    isTimeTravelNow,
    setTimeTravel
} from '../../reducers/time-travel';
import {
    autoUpdateProject,
    getIsUpdating,
    getIsShowingProject,
    manualUpdateProject,
    requestNewProject,
    remixProject,
    saveProjectAsCopy
} from '../../reducers/project-state';
import { setProjectTitle } from '../../reducers/project-title';
import {
    openAboutMenu,
    closeAboutMenu,
    aboutMenuOpen,
    openAccountMenu,
    closeAccountMenu,
    accountMenuOpen,
    openFileMenu,
    closeFileMenu,
    fileMenuOpen,
    openEditMenu,
    closeEditMenu,
    editMenuOpen,
    openLoginMenu,
    closeLoginMenu,
    loginMenuOpen,
    openModeMenu,
    closeModeMenu,
    modeMenuOpen,
    settingsMenuOpen,
    openSettingsMenu,
    closeSettingsMenu
} from '../../reducers/menus';
import { showAlertWithTimeout } from '../../reducers/alerts';

import collectMetadata from '../../lib/collect-metadata';
import { PLATFORM } from '../../lib/platform';

import styles from './menu-bar.css';

import helpIcon from '../../lib/assets/icon--tutorials.svg';
import mystuffIcon from './icon--mystuff.png';
import profileIcon from './icon--profile.png';
import remixIcon from './icon--remix.svg';
import dropdownCaret from './dropdown-caret.svg';
import aboutIcon from './icon--about.svg';
import fileIcon from './icon--file.svg';
import editIcon from './icon--edit.svg';
import saveIcon from './ant-design--save-filled.svg';
import debugIcon from '../debug-modal/icons/icon--debug.svg';

import scratchLogo from './scratch-logo.svg';
import scratchLogoAndroid from './scratch-logo-android.svg';
import ninetiesLogo from './nineties_logo.svg';
import catLogo from './cat_logo.svg';
import prehistoricLogo from './prehistoric-logo.svg';
import oldtimeyLogo from './oldtimey-logo.svg';

import sharedMessages from '../../lib/shared-messages';
import queryString from 'query-string';

import { AccountMenuOptionsPropTypes } from '../../lib/account-menu-options';
import Sb3Save from '../../containers/sb3-save.jsx';


const exampleList = [];

const ariaMessages = defineMessages({
    tutorials: {
        id: 'gui.menuBar.tutorialsLibrary',
        defaultMessage: 'Tutorials',
        description: 'accessibility text for the tutorials button'
    },
    debug: {
        id: 'gui.menuBar.debug',
        defaultMessage: 'Debug',
        description: 'accessibility text for the debug button'
    }
});

const getScratchLogo = platform => (platform === PLATFORM.ANDROID ? scratchLogoAndroid : scratchLogo);

const MenuBarItemTooltip = ({
    children,
    className,
    enable,
    id,
    place = 'bottom'
}) => {
    if (enable) {
        return (
            <React.Fragment>
                {children}
            </React.Fragment>
        );
    }
    return (
        <ComingSoonTooltip
            className={classNames(styles.comingSoon, className)}
            place={place}
            tooltipClassName={styles.comingSoonTooltip}
            tooltipId={id}
        >
            {children}
        </ComingSoonTooltip>
    );
};


MenuBarItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    enable: PropTypes.bool,
    id: PropTypes.string,
    place: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

const MenuItemTooltip = ({ id, isRtl, children, className }) => (
    <ComingSoonTooltip
        className={classNames(styles.comingSoon, className)}
        isRtl={isRtl}
        place={isRtl ? 'left' : 'right'}
        tooltipClassName={styles.comingSoonTooltip}
        tooltipId={id}
    >
        {children}
    </ComingSoonTooltip>
);

MenuItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    id: PropTypes.string,
    isRtl: PropTypes.bool
};

const AboutButton = props => (
    <Button
        className={classNames(styles.menuBarItem, styles.hoverable)}
        iconClassName={styles.aboutIcon}
        iconSrc={aboutIcon}
        onClick={props.onClick}
    />
);

AboutButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

class MenuBar extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleClickNew',
            'handleClickRemix',
            'handleClickSave',
            'handleClickExample',
            'handleClickLoadProject',
            'handleClickLoadProjectFromJson',
            'handleClickSaveAsCopy',
            'handleClickSeeCommunity',
            'handleClickShare',
            'handleSetMode',
            'handleKeyPress',
            'handleRestoreOption',
            'getSaveToComputerHandler',
            'restoreOptionMessage',
            'handleCloseExample',
            'fetchExamples'
        ]);
        this.state = {
            showExample: false,
            exampleList: []
        };
    }
    async componentDidMount() {
        document.addEventListener('keydown', this.handleKeyPress);

        // Fetch examples from API
        await this.fetchExamples();

        const exampleId = this.getExampleIdFromUrl();
        const projectId = this.getProjectIdFromUrl();
        if (exampleId) {
            await this.loadExampleById(exampleId);
        } else if (projectId) {
            await this.loadProjectById(projectId);
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    async fetchExamples() {
        try {
            const apiBaseUrl = process.env.CODEVENTURE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiBaseUrl}/api/1.0/examples`);

            if (response.ok) {
                const res = await response.json();
                this.setState({ exampleList: res.examples });
            } else {
                console.warn('Failed to fetch examples from API, using fallback');
                // Fallback to hardcoded examples if API fails
                this.setState({ exampleList: [] });
            }
        } catch (error) {
            console.error('Error fetching examples:', error);
            // Fallback to hardcoded examples if API fails
            this.setState({ exampleList: [] });
        }
    }

    getExampleIdFromUrl() {
        const queryParams = queryString.parse(location.search);
        return queryParams.exampleId || null;
    }

    getProjectIdFromUrl() {
        const queryParams = queryString.parse(location.search);
        return queryParams.projectId || null;
    }


    // Method to load example by ID
    async loadExampleById(exampleId) {
        const example = this.state.exampleList.find(ex => ex.id === exampleId);
        if (example) {
            await this.handleClickLoadProject(example.url);
        }
    }

    async loadProjectById(projectId) {
        try {
            const accessToken = localStorage.getItem('codeventure_access_token');
            const apiBaseUrl = process.env.CODEVENTURE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiBaseUrl}/api/1.0/projects/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (response.status === 403) {
                // Show permission denied alert
                this.props.onShowAlert('projectPermissionDenied');

                // Remove projectId from URL
                const newUrl = new URL(window.location);
                newUrl.searchParams.delete('projectId');
                window.history.replaceState({}, '', newUrl.toString());

                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const projectUrl = data.project.projectUrl;
            const projectTitle = data.project.title;
            // Load the project file first
            await this.handleClickLoadProject(projectUrl);
            this.props.onSetProjectTitle(projectTitle);

        } catch (error) {
            console.error('Error loading project from Firebase:', error);
        }
    }
    handleClickNew() {
        // if the project is dirty, and user owns the project, we will autosave.
        // but if they are not logged in and can't save, user should consider
        // downloading or logging in first.
        // Note that if user is logged in and editing someone else's project,
        // they'll lose their work.
        const readyToReplaceProject = this.props.confirmReadyToReplaceProject(
            this.props.intl.formatMessage(sharedMessages.replaceProjectWarning)
        );
        this.props.onRequestCloseFile();
        if (readyToReplaceProject) {
            this.props.onClickNew(this.props.canSave && this.props.canCreateNew);
        }
        this.props.onRequestCloseFile();
    }

    handleClickExample() {
        this.setState({ showExample: true });
    }
    handleCloseExample = () => {
        this.setState({ showExample: false });
    };
    handleClickRemix() {
        this.props.onClickRemix();
        this.props.onRequestCloseFile();
    }
    async handleClickSave() {
        // this save project function is not working, so we are using this to get the project data
        const tmpProjectJson = this.props.vm.toJSON();
        console.log(tmpProjectJson);

        // get thumbnail project data
        this.props.vm.postIOData('video', { forceTransparentPreview: true });
        this.props.vm.renderer.requestSnapshot(dataURI => {
            this.props.vm.postIOData('video', { forceTransparentPreview: false });
            const blob = dataURItoBlob(dataURI);
            console.log(blob);
            return blob;
        });

        //
        // try {
        //     await fetch('http://localhost:4000/api/1.0/projects/save', {
        //         method: 'POST'
        //     });
        // } catch (error) {
        //     console.error('Error saving project:', error);
        // }

        // this.props.onClickSave();
        this.props.onRequestCloseFile();

    }
    async handleClickLoadProjectFromJson() {
        // it must load from sb3 file upload than json because some load asset bug
        const tmpProjectJson = { targets: [{ isStage: true, name: 'Stage', variables: { '`jEk@4|i[#Fk?(8x)AV.-my variable': ['my variable', 0] }, lists: {}, broadcasts: {}, blocks: {}, comments: {}, currentCostume: 0, costumes: [{ name: 'backdrop1', dataFormat: 'svg', assetId: '87ec29ad216c0074c731d581c7f40c39', md5ext: '87ec29ad216c0074c731d581c7f40c39.svg', rotationCenterX: 240, rotationCenterY: 180 }], sounds: [{ name: 'pop', assetId: '83a9787d4cb6f3b7632b4ddfebf74367', dataFormat: 'wav', format: '', rate: 48000, sampleCount: 1123, md5ext: '83a9787d4cb6f3b7632b4ddfebf74367.wav' }], volume: 100, layerOrder: 0, tempo: 60, videoTransparency: 50, videoState: 'on', textToSpeechLanguage: null }, { isStage: false, name: 'Codi', variables: {}, lists: {}, broadcasts: {}, blocks: { 'F(tXtq$K6SN]B@(MrNKa': { opcode: 'posenet2scratch_getX', next: null, parent: '{-R)_](TsJNw)3o2Ha,q', inputs: { PART: [1, 'C8;N(Ecq,;F2:R1?.AZy'], PERSON_NUMBER: [1, '3%}2iT=T)[_y_00$uqK!'] }, fields: {}, shadow: false, topLevel: false }, 'C8;N(Ecq,;F2:R1?.AZy': { opcode: 'posenet2scratch_menu_parts', next: null, parent: 'F(tXtq$K6SN]B@(MrNKa', inputs: {}, fields: { parts: ['0', null] }, shadow: true, topLevel: false }, '3%}2iT=T)[_y_00$uqK!': { opcode: 'posenet2scratch_menu_personNumbers', next: null, parent: 'F(tXtq$K6SN]B@(MrNKa', inputs: {}, fields: { personNumbers: ['1', null] }, shadow: true, topLevel: false }, '`Y99qfSS-U/8k6W]HjAY': { opcode: 'control_forever', next: null, parent: '@*J|r#0|!8wr~NH%e}a1', inputs: { SUBSTACK: [2, '{-R)_](TsJNw)3o2Ha,q'] }, fields: {}, shadow: false, topLevel: false }, '{-R)_](TsJNw)3o2Ha,q': { opcode: 'motion_gotoxy', next: null, parent: '`Y99qfSS-U/8k6W]HjAY', inputs: { X: [3, 'F(tXtq$K6SN]B@(MrNKa', [4, '0']], Y: [3, 'g6{E[:mTQAg5rTNn*oDC', [4, '0']] }, fields: {}, shadow: false, topLevel: false }, 'g6{E[:mTQAg5rTNn*oDC': { opcode: 'posenet2scratch_getY', next: null, parent: '{-R)_](TsJNw)3o2Ha,q', inputs: { PART: [1, 'Yg*CG=7f?LQw8fH/#nHY'], PERSON_NUMBER: [1, '^]Hn9stc]LZ@}4([g|Yj'] }, fields: {}, shadow: false, topLevel: false }, 'Yg*CG=7f?LQw8fH/#nHY': { opcode: 'posenet2scratch_menu_parts', next: null, parent: 'g6{E[:mTQAg5rTNn*oDC', inputs: {}, fields: { parts: ['0', null] }, shadow: true, topLevel: false }, '^]Hn9stc]LZ@}4([g|Yj': { opcode: 'posenet2scratch_menu_personNumbers', next: null, parent: 'g6{E[:mTQAg5rTNn*oDC', inputs: {}, fields: { personNumbers: ['1', null] }, shadow: true, topLevel: false }, '@*J|r#0|!8wr~NH%e}a1': { opcode: 'event_whenflagclicked', next: '`Y99qfSS-U/8k6W]HjAY', parent: null, inputs: {}, fields: {}, shadow: false, topLevel: true, x: 58, y: 160 } }, comments: {}, currentCostume: 0, costumes: [{ name: 'Codi-1', bitmapResolution: 2, dataFormat: 'png', assetId: 'd872b4650815653e5fde87576aaf0183', md5ext: 'd872b4650815653e5fde87576aaf0183.png', rotationCenterX: 256, rotationCenterY: 257 }, { name: 'Codi-2', bitmapResolution: 2, dataFormat: 'png', assetId: '9c25a102a2d8c7dc0c0760f2744afff5', md5ext: '9c25a102a2d8c7dc0c0760f2744afff5.png', rotationCenterX: 256, rotationCenterY: 256 }, { name: 'Codi-3', bitmapResolution: 2, dataFormat: 'png', assetId: '3b3ee5e1383b669b62fe93532889a05d', md5ext: '3b3ee5e1383b669b62fe93532889a05d.png', rotationCenterX: 256, rotationCenterY: 257 }, { name: 'Codi-4', bitmapResolution: 2, dataFormat: 'png', assetId: '25b4694abbf0e2b9a8ab5728b3c0220d', md5ext: '25b4694abbf0e2b9a8ab5728b3c0220d.png', rotationCenterX: 256, rotationCenterY: 256 }], sounds: [{ name: 'pop', assetId: '83a9787d4cb6f3b7632b4ddfebf74367', dataFormat: 'wav', format: '', rate: 48000, sampleCount: 1123, md5ext: '83a9787d4cb6f3b7632b4ddfebf74367.wav' }], volume: 100, layerOrder: 1, visible: true, x: -95.50932427788524, y: -31.940211284949157, size: 40, direction: 90, draggable: false, rotationStyle: 'all around' }], monitors: [], extensions: ['posenet2scratch'], meta: { semver: '3.0.0', vm: '11.2.0-svg-sanitization.3', agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0' } };
        await this.props.vm.loadProject(tmpProjectJson);
    }
    handleClickSaveAsCopy() {
        this.props.onClickSaveAsCopy();
        this.props.onRequestCloseFile();
    }

    handleBackToCurriculum() {
        window.location.href = 'https://codeventure.app/dashboard';
    }
    async handleClickLoadProject(projectUrl) {
        // load project demo
        // this.props.onLoadingStarted();
        // const tmpProjectJson = squidGame;
        // '../../examples/Squid-Game.sb3';
        // const response = await fetch('/static/Squid-Game.sb3');
        try {
            const response = await fetch(projectUrl);
            const arrayBuffer = await response.arrayBuffer();
            await this.props.vm.loadProject(arrayBuffer);
            this.setState({ showExample: false });
        } catch (error) {
            console.error('Error loading project:', error);
        }
    }
    handleClickSeeCommunity(waitForUpdate) {
        if (this.props.shouldSaveBeforeTransition()) {
            this.props.autoUpdateProject(); // save before transitioning to project page
            waitForUpdate(true); // queue the transition to project page
        } else {
            waitForUpdate(false); // immediately transition to project page
        }
    }
    handleClickShare(waitForUpdate) {
        if (!this.props.isShared) {
            if (this.props.canShare) { // save before transitioning to project page
                this.props.onShare();
            }
            if (this.props.canSave) { // save before transitioning to project page
                this.props.autoUpdateProject();
                waitForUpdate(true); // queue the transition to project page
            } else {
                waitForUpdate(false); // immediately transition to project page
            }
        }
    }
    handleSetMode(mode) {
        return () => {
            // Turn on/off filters for modes.
            if (mode === '1920') {
                document.documentElement.style.filter = 'brightness(.9)contrast(.8)sepia(1.0)';
                document.documentElement.style.height = '100%';
            } else if (mode === '1990') {
                document.documentElement.style.filter = 'hue-rotate(40deg)';
                document.documentElement.style.height = '100%';
            } else {
                document.documentElement.style.filter = '';
                document.documentElement.style.height = '';
            }

            // Change logo for modes
            if (mode === '1990') {
                document.getElementById('logo_img').src = ninetiesLogo;
            } else if (mode === '2020') {
                document.getElementById('logo_img').src = catLogo;
            } else if (mode === '1920') {
                document.getElementById('logo_img').src = oldtimeyLogo;
            } else if (mode === '220022BC') {
                document.getElementById('logo_img').src = prehistoricLogo;
            } else {
                document.getElementById('logo_img').src = getScratchLogo(this.props.platform);
            }

            this.props.onSetTimeTravelMode(mode);
        };
    }
    handleRestoreOption(restoreFun) {
        return () => {
            restoreFun();
            this.props.onRequestCloseEdit();
        };
    }
    handleKeyPress(event) {
        const modifier = bowser.mac ? event.metaKey : event.ctrlKey;
        if (modifier && event.key === 's') {
            this.props.onClickSave();
            event.preventDefault();
        }
    }
    getSaveToComputerHandler(downloadProjectCallback) {
        return () => {
            this.props.onRequestCloseFile();
            downloadProjectCallback();
            if (this.props.onProjectTelemetryEvent) {
                const metadata = collectMetadata(this.props.vm, this.props.projectTitle, this.props.locale);
                this.props.onProjectTelemetryEvent('projectDidSave', metadata);
            }
        };
    }
    restoreOptionMessage(deletedItem) {
        switch (deletedItem) {
            case 'Sprite':
                return (<FormattedMessage
                    defaultMessage="Restore Sprite"
                    description="Menu bar item for restoring the last deleted sprite."
                    id="gui.menuBar.restoreSprite"
                />);
            case 'Sound':
                return (<FormattedMessage
                    defaultMessage="Restore Sound"
                    description="Menu bar item for restoring the last deleted sound."
                    id="gui.menuBar.restoreSound"
                />);
            case 'Costume':
                return (<FormattedMessage
                    defaultMessage="Restore Costume"
                    description="Menu bar item for restoring the last deleted costume."
                    id="gui.menuBar.restoreCostume"
                />);
            default: {
                return (<FormattedMessage
                    defaultMessage="Restore"
                    description="Menu bar item for restoring the last deleted item in its disabled state." /* eslint-disable-line max-len */
                    id="gui.menuBar.restore"
                />);
            }
        }
    }
    buildAboutMenu(onClickAbout) {
        if (!onClickAbout) {
            // hide the button
            return null;
        }
        if (typeof onClickAbout === 'function') {
            // make a button which calls a function
            return <AboutButton onClick={onClickAbout} />;
        }
        // assume it's an array of objects
        // each item must have a 'title' FormattedMessage and a 'handleClick' function
        // generate a menu with items for each object in the array
        return (
            <div
                className={classNames(styles.menuBarItem, styles.hoverable, {
                    [styles.active]: this.props.aboutMenuOpen
                })}
                onMouseUp={this.props.onRequestOpenAbout}
            >
                <img
                    className={styles.aboutIcon}
                    src={aboutIcon}
                />
                <MenuBarMenu
                    className={classNames(styles.menuBarMenu)}
                    open={this.props.aboutMenuOpen}
                    place={this.props.isRtl ? 'right' : 'left'}
                    onRequestClose={this.props.onRequestCloseAbout}
                >
                    {
                        onClickAbout.map(itemProps => (
                            <MenuItem
                                key={itemProps.title}
                                isRtl={this.props.isRtl}
                                onClick={this.wrapAboutMenuCallback(itemProps.onClick)}
                            >
                                {itemProps.title}
                            </MenuItem>
                        ))
                    }
                </MenuBarMenu>
            </div>
        );
    }
    wrapAboutMenuCallback(callback) {
        return () => {
            callback();
            this.props.onRequestCloseAbout();
        };
    }
    render() {
        const saveNowMessage = (
            <FormattedMessage
                defaultMessage="Save now"
                description="Menu bar item for saving now"
                id="gui.menuBar.saveNow"
            />
        );
        const createCopyMessage = (
            <FormattedMessage
                defaultMessage="Save as a copy"
                description="Menu bar item for saving as a copy"
                id="gui.menuBar.saveAsCopy"
            />
        );
        const remixMessage = (
            <FormattedMessage
                defaultMessage="Remix"
                description="Menu bar item for remixing"
                id="gui.menuBar.remix"
            />
        );
        const newProjectMessage = (
            <FormattedMessage
                defaultMessage="New"
                description="Menu bar item for creating a new project"
                id="gui.menuBar.new"
            />
        );
        const remixButton = (
            <Button
                className={classNames(
                    styles.menuBarButton,
                    styles.remixButton
                )}
                iconClassName={styles.remixButtonIcon}
                iconSrc={remixIcon}
                onClick={this.handleClickRemix}
            >
                {remixMessage}
            </Button>
        );
        // Show the About button only if we have a handler for it (like in the desktop app)
        const aboutButton = this.buildAboutMenu(this.props.onClickAbout);

        const menuOpts = this.props.accountMenuOptions;

        return (
            <Box
                className={classNames(
                    this.props.className,
                    styles.menuBar
                )}
            >
                <div className={styles.mainMenu}>
                    <div className={styles.fileGroup}>
                        {/* <div className={classNames(styles.menuBarItem)}>
                            <img
                                id="logo_img"
                                alt="Scratch"
                                className={classNames(styles.scratchLogo, {
                                    [styles.clickable]: typeof this.props.onClickLogo !== 'undefined'
                                })}
                                draggable={false}
                                src="https://codeventure.app/logo.svg"
                                style={{backgroundColor: 'white', padding: '4px 8px'}}
                            />
                        </div> */}
                        <div
                            className={classNames(styles.menuBarItem, styles.hoverable, {
                                [styles.active]: this.props.fileMenuOpen
                            })}
                        >

                            <Button
                                className={styles.backButton}
                                onClick={this.handleBackToCurriculum}
                            >
                                <FormattedMessage
                                    defaultMessage="⬅ Back to Curriculum"
                                    description="⬅ Back to Curriculum"
                                    id="gui.menuBar.codeventureDashboard"
                                />
                            </Button>

                        </div>
                        {(this.props.canManageFiles) && (
                            <div
                                className={classNames(styles.menuBarItem, styles.hoverable, {
                                    [styles.active]: this.props.fileMenuOpen
                                })}
                                onMouseUp={this.props.onClickFile}
                            >
                                <img src={fileIcon} />
                                <span className={styles.collapsibleLabel}>
                                    <FormattedMessage
                                        defaultMessage="File"
                                        description="Text for file dropdown menu"
                                        id="gui.menuBar.file"
                                    />
                                </span>
                                <img src={dropdownCaret} />
                                <MenuBarMenu
                                    className={classNames(styles.menuBarMenu)}
                                    open={this.props.fileMenuOpen}
                                    place={this.props.isRtl ? 'left' : 'right'}
                                    onRequestClose={this.props.onRequestCloseFile}
                                >
                                    <MenuSection>
                                        <MenuItem
                                            isRtl={this.props.isRtl}
                                            onClick={this.handleClickNew}
                                        >
                                            {newProjectMessage}
                                        </MenuItem>
                                    </MenuSection>
                                    <MenuSection>
                                        <Sb3Save vm={this.props.vm}>{(className, downloadProjectCallback) => (
                                            <MenuItem
                                                className={className}
                                                onClick={this.getSaveToComputerHandler(downloadProjectCallback)}
                                            >
                                                {saveNowMessage}
                                            </MenuItem>
                                        )}</Sb3Save>
                                    </MenuSection>
                                    {(this.props.canSave || this.props.canCreateCopy || this.props.canRemix) && (
                                        <MenuSection>
                                            {this.props.canSave && (
                                                <Sb3Save>{(className, downloadProjectCallback) => (
                                                    <MenuItem
                                                        className={className}
                                                        onClick={this.getSaveToComputerHandler(downloadProjectCallback)}
                                                    >
                                                        {saveNowMessage}
                                                    </MenuItem>
                                                )}</Sb3Save>
                                            )}
                                            {this.props.canCreateCopy && (
                                                <MenuItem onClick={this.handleClickSaveAsCopy}>
                                                    {createCopyMessage}
                                                </MenuItem>
                                            )}
                                            {this.props.canRemix && (
                                                <MenuItem onClick={this.handleClickRemix}>
                                                    {remixMessage}
                                                </MenuItem>
                                            )}
                                        </MenuSection>
                                    )}
                                    <MenuSection>
                                        <MenuItem
                                            onClick={this.props.onStartSelectingFileUpload}
                                        >
                                            {this.props.intl.formatMessage(sharedMessages.loadFromComputerTitle)}
                                        </MenuItem>
                                        <SB3Downloader>{(className, downloadProjectCallback) => (
                                            <MenuItem
                                                className={className}
                                                onClick={this.getSaveToComputerHandler(downloadProjectCallback)}
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Save to your computer"
                                                    description="Menu bar item for downloading a project to your computer" // eslint-disable-line max-len
                                                    id="gui.menuBar.downloadToComputer"
                                                />
                                            </MenuItem>
                                        )}</SB3Downloader>
                                    </MenuSection>
                                </MenuBarMenu>
                            </div>
                        )}
                        {this.props.isTotallyNormal && (
                            <div
                                className={classNames(styles.menuBarItem, styles.hoverable, {
                                    [styles.active]: this.props.modeMenuOpen
                                })}
                                onMouseUp={this.props.onClickMode}
                            >
                                <div className={classNames(styles.editMenu)}>
                                    <FormattedMessage
                                        defaultMessage="Mode"
                                        description="Mode menu item in the menu bar"
                                        id="gui.menuBar.modeMenu"
                                    />
                                </div>
                                <MenuBarMenu
                                    className={classNames(styles.menuBarMenu)}
                                    open={this.props.modeMenuOpen}
                                    place={this.props.isRtl ? 'left' : 'right'}
                                    onRequestClose={this.props.onRequestCloseMode}
                                >
                                    <MenuSection>
                                        <MenuItem onClick={this.handleSetMode('NOW')}>
                                            <span className={classNames({ [styles.inactive]: !this.props.modeNow })}>
                                                {'✓'}
                                            </span>
                                            {' '}
                                            <FormattedMessage
                                                defaultMessage="Normal mode"
                                                description="April fools: resets editor to not have any pranks"
                                                id="gui.menuBar.normalMode"
                                            />
                                        </MenuItem>
                                        <MenuItem onClick={this.handleSetMode('2020')}>
                                            <span className={classNames({ [styles.inactive]: !this.props.mode2020 })}>
                                                {'✓'}
                                            </span>
                                            {' '}
                                            <FormattedMessage
                                                defaultMessage="Caturday mode"
                                                description="April fools: Cat blocks mode"
                                                id="gui.menuBar.caturdayMode"
                                            />
                                        </MenuItem>
                                    </MenuSection>
                                </MenuBarMenu>
                            </div>
                        )}
                    </div>
                    {this.props.canEditTitle ? (
                        <div className={classNames(styles.menuBarItem, styles.growable)}>
                            <MenuBarItemTooltip
                                enable
                                id="title-field"
                            >
                                <ProjectTitleInput
                                    projectTitle={this.props.projectTitle}
                                    className={classNames(styles.titleFieldGrowable)}
                                />
                            </MenuBarItemTooltip>
                        </div>
                    ) : ((this.props.authorUsername && this.props.authorUsername !== this.props.username) ? (
                        <AuthorInfo
                            className={styles.authorInfo}
                            imageUrl={this.props.authorThumbnailUrl}
                            projectTitle={this.props.projectTitle}
                            userId={this.props.authorId}
                            username={this.props.authorUsername}
                        />
                    ) : null)}
                    <Divider className={classNames(styles.divider)} />
                    <div className={styles.fileGroup}>
                        <SB3Downloader>
                            {(className, downloadProjectCallback) => (
                                <div
                                    className={
                                        classNames(styles.menuBarItem, styles.noOffset, styles.hoverable, 'save-button')
                                    }
                                    onClick={this.getSaveToComputerHandler(downloadProjectCallback)}
                                >
                                    <img
                                        className={styles.helpIcon}
                                        src={saveIcon}
                                        style={{ width: 20, height: 20 }}
                                    />
                                    <span className={styles.tutorialsLabel}>{'Save'}</span>

                                </div>
                            )}
                        </SB3Downloader>
                        <div
                            aria-label="Example"
                            className={
                                classNames(styles.menuBarItem, styles.noOffset, styles.hoverable, 'tutorials-button')
                            }
                            onClick={this.handleClickExample}
                        >
                            <img
                                className={styles.helpIcon}
                                src={helpIcon}
                            />
                            <span className={styles.tutorialsLabel}>{'Example'}</span>
                        </div>
                        {/* <div
                            aria-label={this.props.intl.formatMessage(ariaMessages.tutorials)}
                            className={
                                classNames(styles.menuBarItem, styles.noOffset, styles.hoverable, 'tutorials-button')
                            }
                            onClick={this.props.onOpenTipLibrary}
                        >
                            <img
                                className={styles.helpIcon}
                                src={helpIcon}
                            />
                            <span className={styles.tutorialsLabel}>
                                <FormattedMessage {...ariaMessages.tutorials} />
                            </span>
                        </div> */}
                        {/* <div
                            aria-label={this.props.intl.formatMessage(ariaMessages.debug)}
                            className={classNames(styles.menuBarItem, styles.noOffset, styles.hoverable)}
                            onClick={this.props.onOpenDebugModal}
                        >
                            <img
                                className={styles.helpIcon}
                                src={debugIcon}
                            />
                            <span className={styles.debugLabel}>
                                <FormattedMessage {...ariaMessages.debug} />
                            </span>
                        </div> */}
                    </div>
                </div>

                {/* show the proper UI in the account menu, given whether the user is
                logged in, and whether a session is available to log in with */}
                <div className={styles.accountInfoGroup}>
                    <div className={styles.menuBarItem}>
                        {this.props.canSave && (
                            <SaveStatus />
                        )}
                    </div>


                    {menuOpts.canHaveSession ? (
                        this.props.username || this.props.codeventureUser ? (
                            // ************ user is logged in ************
                            <React.Fragment>
                                {menuOpts.myStuffUrl ? (
                                    <a href={menuOpts.myStuffUrl}>
                                        <div
                                            className={classNames(
                                                styles.menuBarItem,
                                                styles.hoverable,
                                                styles.mystuffButton
                                            )}
                                        >
                                            <img
                                                className={styles.mystuffIcon}
                                                src={mystuffIcon}
                                            />
                                        </div>
                                    </a>
                                ) : null}

                                {this.props.codeventureUser ? (
                                    <div
                                        className={classNames(
                                            styles.menuBarItem,
                                            styles.accountNavMenu
                                        )}
                                        title={`Logged in as ${this.props.codeventureUser.username} from CodeVenture`}
                                    >
                                        <img
                                            className={styles.profileIcon}
                                            src={this.props.codeventureUser?.avatarImage ?
                                                `${process.env.CODEVENTURE_APP_URL || 'https://codeventure.app'}${this.props.codeventureUser.avatarImage}` :
                                                `${process.env.CODEVENTURE_APP_URL || 'https://codeventure.app'}/student-avatar/art-toy/01-default.svg`}
                                        />
                                        <span>
                                            {this.props.codeventureUser?.displayName ||
                                                this.props.codeventureUser?.username ||
                                                'CodeVenture User'}
                                        </span>
                                    </div>
                                ) : null}
                            </React.Fragment>
                        ) : (
                            // ********* user not logged in, but a session exists
                            // ********* so they can choose to log in
                            <React.Fragment>
                                {menuOpts.canRegister ? (
                                    <div
                                        className={classNames(
                                            styles.menuBarItem,
                                            styles.hoverable
                                        )}
                                        key="join"
                                        onMouseUp={this.props.onOpenRegistration}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Join Scratch"
                                            description="Link for creating a Scratch account"
                                            id="gui.menuBar.joinScratch"
                                        />
                                    </div>
                                ) : null}

                                {menuOpts.canLogin ? (
                                    <div
                                        className={classNames(
                                            styles.menuBarItem,
                                            styles.hoverable
                                        )}
                                        key="login"
                                        onMouseUp={this.props.onClickLogin}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Sign in"
                                            description="Link for signing in to your Scratch account"
                                            id="gui.menuBar.signIn"
                                        />
                                        <LoginDropdown
                                            className={classNames(styles.menuBarMenu)}
                                            isOpen={this.props.loginMenuOpen}
                                            isRtl={this.props.isRtl}
                                            renderLogin={this.props.renderLogin}
                                            onClose={this.props.onRequestCloseLogin}
                                        />
                                    </div>
                                ) : null}
                            </React.Fragment>
                        )
                    ) : (
                        // ******** no login session is available, so don't show login stuff
                        <React.Fragment>
                            {this.props.showComingSoon ? (
                                <React.Fragment>
                                    <MenuBarItemTooltip id="mystuff">
                                        <div
                                            className={classNames(
                                                styles.menuBarItem,
                                                styles.hoverable,
                                                styles.mystuffButton
                                            )}
                                        >
                                            <img
                                                className={styles.mystuffIcon}
                                                src={mystuffIcon}
                                            />
                                        </div>
                                    </MenuBarItemTooltip>
                                    <MenuBarItemTooltip
                                        id="account-nav"
                                        place={this.props.isRtl ? 'right' : 'left'}
                                    >
                                        <div
                                            className={classNames(
                                                styles.menuBarItem,
                                                styles.hoverable,
                                                styles.accountNavMenu
                                            )}
                                        >
                                            <img
                                                className={styles.profileIcon}
                                                src={this.props.codeventureUser?.avatarImage ?
                                                    `https://codeventure.app${this.props.codeventureUser.avatarImage}` :
                                                    'https://codeventure.app/student-avatar/art-toy/01-default.svg'}
                                            />
                                            <span>
                                                {this.props.codeventureUser?.displayName ||
                                                    this.props.codeventureUser?.username ||
                                                    'CodeVenture User'}
                                            </span>
                                            <img
                                                className={styles.dropdownCaretIcon}
                                                src={dropdownCaret}
                                            />
                                        </div>
                                    </MenuBarItemTooltip>
                                </React.Fragment>
                            ) : []}
                        </React.Fragment>
                    )}
                </div>

                {aboutButton}
                {/* Example Popup Modal */}
                {this.state.showExample && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10000
                        }}
                    >

                        <div
                            style={{
                                background: 'white',
                                borderRadius: 8,
                                maxWidth: '80%',
                                width: '100%',
                                minHeight: 150,
                                maxHeight: '80%',
                                boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
                                position: 'relative',
                                flexDirection: 'column',
                                overflowY: 'auto'
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 24,
                                    right: 24,
                                    zIndex: 10001
                                }}
                                onClick={this.handleCloseExample}
                            >
                                <img
                                    src={closeIcon}
                                    alt="Close"
                                    style={{
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    backgroundColor: 'rgb(31 117 255)',
                                    padding: '8px 32px'
                                }}
                            >
                                <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#FFF' }}>
                                    {'CodeVenture Example Project'}
                                </h2>
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                                    gap: 16,
                                    padding: 32
                                }}
                            >
                                {this.state.exampleList.map(example => (
                                    <div
                                        key={example.id}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            marginBottom: 24,
                                            border: '1px solid #eee',
                                            borderRadius: 8,
                                            padding: 12,
                                            gridColumn: 'span 3'
                                        }}
                                    >
                                        <img
                                            src={example.image}
                                            alt={example.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: 8,
                                                marginRight: 16
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontWeight: 'bold',
                                                    fontSize: 18,
                                                    color: '#000',
                                                    marginTop: 8
                                                }}
                                            >
                                                {example.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 14,
                                                    color: '#666',
                                                    marginBottom: 8
                                                }}
                                            >
                                                {example.description}
                                            </div>
                                            <button
                                                style={{
                                                    borderRadius: 4,
                                                    padding: 10,
                                                    fontSize: 14,
                                                    color: '#FFF',
                                                    width: '100%',
                                                    backgroundColor: 'rgb(31 117 255)',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => this.handleClickLoadProject(example.url)}
                                            >
                                                {'Load Example'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Box>
        );
    }
}

MenuBar.propTypes = {
    aboutMenuOpen: PropTypes.bool,
    accountMenuOpen: PropTypes.bool,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    autoUpdateProject: PropTypes.func,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    className: PropTypes.string,
    confirmReadyToReplaceProject: PropTypes.func,
    currentLocale: PropTypes.string.isRequired,
    editMenuOpen: PropTypes.bool,
    enableCommunity: PropTypes.bool,
    fileMenuOpen: PropTypes.bool,
    intl: intlShape,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    isUpdating: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    loginMenuOpen: PropTypes.bool,
    logo: PropTypes.string,
    mode1920: PropTypes.bool,
    mode1990: PropTypes.bool,
    mode2020: PropTypes.bool,
    mode220022BC: PropTypes.bool,
    modeMenuOpen: PropTypes.bool,
    modeNow: PropTypes.bool,
    onClickAbout: PropTypes.oneOfType([
        PropTypes.func, // button mode: call this callback when the About button is clicked
        PropTypes.arrayOf( // menu mode: list of items in the About menu
            PropTypes.shape({
                title: PropTypes.string, // text for the menu item
                onClick: PropTypes.func // call this callback when the menu item is clicked
            })
        )
    ]),
    onClickAccount: PropTypes.func,
    onClickEdit: PropTypes.func,
    onClickFile: PropTypes.func,
    onClickLogin: PropTypes.func,
    onClickLogo: PropTypes.func,
    onClickMode: PropTypes.func,
    onClickNew: PropTypes.func,
    onClickRemix: PropTypes.func,
    onClickSave: PropTypes.func,
    onClickSaveAsCopy: PropTypes.func,
    onClickSettings: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onOpenTipLibrary: PropTypes.func,
    onOpenDebugModal: PropTypes.func,
    onProjectTelemetryEvent: PropTypes.func,
    onRequestCloseAbout: PropTypes.func,
    onRequestCloseAccount: PropTypes.func,
    onRequestCloseEdit: PropTypes.func,
    onRequestCloseFile: PropTypes.func,
    onRequestCloseLogin: PropTypes.func,
    onRequestCloseMode: PropTypes.func,
    onRequestCloseSettings: PropTypes.func,
    onRequestOpenAbout: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onSetTimeTravelMode: PropTypes.func,
    onSetProjectTitle: PropTypes.func,
    onShare: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    platform: PropTypes.oneOf(Object.keys(PLATFORM)),
    projectTitle: PropTypes.string,
    renderLogin: PropTypes.func,
    settingsMenuOpen: PropTypes.bool,
    shouldSaveBeforeTransition: PropTypes.func,
    showComingSoon: PropTypes.bool,
    username: PropTypes.string,
    userOwnsProject: PropTypes.bool,
    codeventureUser: PropTypes.shape({
        isAuthenticated: PropTypes.bool,
        token: PropTypes.string,
        username: PropTypes.string,
        userId: PropTypes.string,
        source: PropTypes.string,
        displayName: PropTypes.string,
        avatarImage: PropTypes.string,
        email: PropTypes.string
    }),
    isValidatingCodeVentureAuth: PropTypes.bool,

    accountMenuOptions: AccountMenuOptionsPropTypes,

    vm: PropTypes.instanceOf(VM).isRequired,

    showExample: PropTypes.bool
};

MenuBar.defaultProps = {
    logo: scratchLogo,
    onShare: () => { }
};

const mapStateToProps = (state, ownProps) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    const user = state.session && state.session.session && state.session.session.user;
    const permissions = state.session && state.session.permissions;
    const sessionExists = state.session && typeof state.session.session !== 'undefined';
    // CodeVenture users can have a session even without Redux session state
    const hasSession = sessionExists || ownProps.codeventureUser;

    return {
        aboutMenuOpen: aboutMenuOpen(state),
        accountMenuOpen: accountMenuOpen(state),
        currentLocale: state.locales.locale,
        fileMenuOpen: fileMenuOpen(state),
        editMenuOpen: editMenuOpen(state),
        isRtl: state.locales.isRtl,
        isUpdating: getIsUpdating(loadingState),
        isShowingProject: getIsShowingProject(loadingState),
        locale: state.locales.locale,
        loginMenuOpen: loginMenuOpen(state),
        modeMenuOpen: modeMenuOpen(state),
        projectTitle: state.scratchGui.projectTitle,
        settingsMenuOpen: settingsMenuOpen(state),
        username: ownProps.username ?? (user ? user.username : null),
        userIsEducator: permissions && permissions.educator,
        vm: state.scratchGui.vm,
        mode220022BC: isTimeTravel220022BC(state),
        mode1920: isTimeTravel1920(state),
        mode1990: isTimeTravel1990(state),
        mode2020: isTimeTravel2020(state),
        modeNow: isTimeTravelNow(state),

        platform: state.scratchGui.platform.platform,

        userOwnsProject: ownProps.userOwnsProject ?? (
            ownProps.authorUsername && user && (ownProps.authorUsername === user.username)
        ),

        accountMenuOptions: ownProps.accountMenuOptions ?? {
            canHaveSession: hasSession ?? false,

            canRegister: true,
            canLogin: true,
            canLogout: true,

            avatarUrl: user?.thumbnailUrl,
            myStuffUrl: '/mystuff/',
            profileUrl: user && `/users/${user.username}`,
            myClassesUrl: permissions?.educator ? '/educators/classes/' : null,
            myClassUrl: user && permissions?.student ? `/classes/${user.classroomId}/` : null,
            accountSettingsUrl: '/accounts/settings/'
        }
    };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
    autoUpdateProject: () => dispatch(autoUpdateProject()),
    onOpenTipLibrary: () => dispatch(openTipsLibrary()),
    onOpenDebugModal: () => dispatch(openDebugModal()),
    onClickAccount: () => dispatch(openAccountMenu()),
    onRequestCloseAccount: () => dispatch(closeAccountMenu()),
    onClickFile: () => dispatch(openFileMenu()),
    onRequestCloseFile: () => dispatch(closeFileMenu()),
    onClickEdit: () => dispatch(openEditMenu()),
    onRequestCloseEdit: () => dispatch(closeEditMenu()),
    onClickLogin: ownProps.onClickLogin ?? (() => dispatch(openLoginMenu())),
    onRequestCloseLogin: () => dispatch(closeLoginMenu()),
    onClickMode: () => dispatch(openModeMenu()),
    onRequestCloseMode: () => dispatch(closeModeMenu()),
    onRequestOpenAbout: () => dispatch(openAboutMenu()),
    onRequestCloseAbout: () => dispatch(closeAboutMenu()),
    onClickSettings: () => dispatch(openSettingsMenu()),
    onRequestCloseSettings: () => dispatch(closeSettingsMenu()),
    onClickNew: needSave => dispatch(requestNewProject(needSave)),
    onClickRemix: () => dispatch(remixProject()),
    onClickSave: () => dispatch(manualUpdateProject()),
    onClickSaveAsCopy: () => dispatch(saveProjectAsCopy()),
    onSeeCommunity: ownProps.onSeeCommunity ?? (() => dispatch(setPlayer(true))),
    onSetTimeTravelMode: mode => dispatch(setTimeTravel(mode)),
    onSetProjectTitle: title => dispatch(setProjectTitle(title)),
    onShowAlert: alertId => showAlertWithTimeout(dispatch, alertId)

});

export default compose(
    injectIntl,
    MenuBarHOC,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(MenuBar);
