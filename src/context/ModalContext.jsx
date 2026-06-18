import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export function useModal() {
    return useContext(ModalContext);
}

export function ModalProvider({ children }) {
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'alert', // 'alert' or 'confirm'
        title: '',
        message: '',
        resolve: null,
    });

    const confirmDialog = useCallback((message, title = 'Confirm') => {
        return new Promise((resolve) => {
            setModal({
                isOpen: true,
                type: 'confirm',
                title,
                message,
                resolve,
            });
        });
    }, []);

    const alertDialog = useCallback((message, title = 'Alert') => {
        return new Promise((resolve) => {
            setModal({
                isOpen: true,
                type: 'alert',
                title,
                message,
                resolve,
            });
        });
    }, []);

    const handleConfirm = () => {
        if (modal.resolve) modal.resolve(true);
        closeModal();
    };

    const handleCancel = () => {
        if (modal.resolve) modal.resolve(false);
        closeModal();
    };

    const handleAlertOk = () => {
        if (modal.resolve) modal.resolve(true);
        closeModal();
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <ModalContext.Provider value={{ confirmDialog, alertDialog }}>
            {children}
            
            {modal.isOpen && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.title}>{modal.title}</h3>
                        <p style={styles.message}>{modal.message}</p>
                        
                        <div style={styles.actions}>
                            {modal.type === 'confirm' ? (
                                <>
                                    <button onClick={handleCancel} className="btn btn-ghost">Cancel</button>
                                    <button onClick={handleConfirm} className="btn btn-primary">Confirm</button>
                                </>
                            ) : (
                                <button onClick={handleAlertOk} className="btn btn-primary">OK</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modal: {
        backgroundColor: 'var(--bg-card)',
        padding: '1.5rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        border: '1px solid var(--border)',
        animation: 'slideUp 0.3s ease',
    },
    title: {
        marginTop: 0,
        marginBottom: '1rem',
        fontSize: '1.25rem',
        color: 'var(--text-main)',
    },
    message: {
        color: 'var(--text-muted)',
        marginBottom: '1.5rem',
        lineHeight: '1.5',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem',
    }
};
