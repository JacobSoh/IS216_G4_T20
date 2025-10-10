'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import Modal from '@/components/ModalComponent'; // your base modal (Dialog + backdrop)

const ModalContext = createContext();

export function ModalProvider({ children }) {
    const [modal, setModal] = useState(null);

    const openModal = useCallback(({content,title='',titleClassName="text-2xl font-bold tracking-tight text-(--custom-cream-yellow)"}) => {
        setModal({content, title, titleClassName});
    }, []);

    const closeModal = useCallback(() => {
        setModal(null)
    }, []);

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}

            {modal?.content && (
                <Modal isOpen={true} onClose={closeModal} title={modal.title} titleClassName={modal.titleClassName}>
                    {typeof modal?.content === 'function' ? modal?.content() : modal?.content}
                </Modal>
            )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
    return ctx;
}
