import {buildInitialState} from './reducers/gui';
import {legacyConfig} from './legacy-config';

export {default} from './containers/gui.jsx';
export {default as GUIComponent} from './components/gui/gui.jsx';
export {default as AppStateHOC} from './lib/app-state-hoc.jsx';
export {default as CodeVentureAuthHOC} from './lib/codeventure-auth-hoc.jsx';
export {setAppElement} from 'react-modal';

export {legacyConfig};
export const guiInitialState = buildInitialState(legacyConfig);

export * from './lib/codeventure-auth.js';
export * from './exported-reducers';
