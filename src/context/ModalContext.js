'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import Modal from '@/components/ModalComponent';
import { Transition } from '@headlessui/react';
import * as ModalHelper from '@/hooks/useModalHelper';

const initial = {
    open: false,
    title: '',
    titleClassName: 'text-2xl font-bold tracking-tight text-(--custom-cream-yellow)',
    node: null,
    key: '',
};

function reducer(s, a) {
    switch (a.type) {
        case ModalHelper.INSERT: {
            const { content, title, titleClassName } = a.payload;
            return {
                open: true,
                title: title ?? s.title ?? initial.title,
                titleClassName: titleClassName ?? s.titleClassName ?? initial.titleClassName,
                node: ModalHelper.toNode(content),
                key: ModalHelper.newKey()
            };
        }
        case ModalHelper.REMOVE: return { ...s, open: false };
        default: return s;
    }
}

const ModalCtx = createContext(null);
export const useModal = () => {
    const ctx = useContext(ModalCtx);
    if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
    return ctx;
};


export function ModalProvider({ children }) {
    // modal = { open: bool, title, titleClassName, Content: Component|null, element: ReactNode|null, key: string }
    const [state, dispatch] = useReducer(reducer, initial);
    const openModal = useCallback((p) => dispatch({ type: ModalHelper.INSERT, payload: p }), []);
    const closeModal = useCallback(() => dispatch({ type: ModalHelper.REMOVE }), []);
    const value = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

    return (
        <ModalCtx.Provider value={value}>
            {children}

            {state.open && (
                <Modal isOpen={true} onClose={closeModal} title={state.title} titleClassName={state.titleClassName}>
                    <Transition
                        key={state.key}
                        appear
                        show
                        enter="transition duration-150 ease-out"
                        enterFrom="opacity-0 translate-y-2"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition duration-120 ease-in"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 -translate-y-2"
                    >
                        <div>{state.node}</div>
                    </Transition>
                </Modal>
            )}
        </ModalCtx.Provider>
    );
}