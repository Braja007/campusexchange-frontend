import React, { createContext, useContext, useState, useCallback } from 'react';
import '../styles/Modal.css';

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
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3 className="modal-title">{modal.title}</h3>
                        <p className="modal-message">{modal.message}</p>
                        
                        <div className="modal-actions">
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
