import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import {defineMessages, FormattedMessage} from 'react-intl';

import styles from './example-modal.css';
import helpIcon from '../../lib/assets/icon--tutorials.svg';
import closeIcon from '../debug-modal/icons/icon--close.svg';

const messages = defineMessages({
    title: {
        id: 'gui.exampleModal.title',
        defaultMessage: 'CodeVenture Example Project',
        description: 'title for the example modal'
    },
    load: {
        id: 'gui.exampleModal.load',
        defaultMessage: 'Load Example',
        description: 'button text for loading an example project'
    }
});

const ExampleModal = ({examples, isOpen, onClose = () => {}, onLoadExample = () => {}}) => {
    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={handleClose}
            className={styles.exampleModalContainer}
            overlayClassName={styles.exampleModalOverlay}
        >
            <div className={styles.modalHeader}>
                <div className={styles.headerTitle}>
                    <img
                        className={styles.headerIcon}
                        src={helpIcon}
                    />
                    <FormattedMessage {...messages.title} />
                </div>
                <button
                    className={styles.closeButton}
                    onClick={handleClose}
                >
                    <img src={closeIcon} />
                </button>
            </div>
            <div className={styles.modalContent}>
                <div className={styles.exampleGrid}>
                    {examples.map(example => (
                        <div
                            key={example.id}
                            className={styles.exampleCard}
                        >
                            <img
                                className={styles.exampleImage}
                                src={example.image}
                                alt={example.name}
                            />
                            <div className={styles.exampleBody}>
                                <div className={styles.exampleName}>{example.name}</div>
                                <div className={styles.exampleDescription}>{example.description}</div>
                                <button
                                    className={styles.loadButton}
                                    onClick={() => onLoadExample(example.url)}
                                >
                                    <FormattedMessage {...messages.load} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ReactModal>
    );
};

ExampleModal.propTypes = {
    examples: PropTypes.arrayOf(PropTypes.shape({
        description: PropTypes.string,
        id: PropTypes.string,
        image: PropTypes.string,
        name: PropTypes.string,
        url: PropTypes.string
    })),
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onLoadExample: PropTypes.func
};

export default ExampleModal;
