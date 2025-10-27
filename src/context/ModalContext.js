'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, useState } from 'react';
// import Modal from '@/components/ModalComponent';
import { Transition } from '@headlessui/react';
import * as ModalHelper from '@/hooks/useModalHelper';

import Modal from '@/components/Modal';

const headerIntiial = {
    title: 'Modal Header',
    description: ''
}

const footerInitial = {
    showCancel: true,
    cancelText: 'Cancel',
    cancelVariant: 'outline',
    showSubmit: true,
    submitText: 'Submit',
    submitVariant: 'brand',
};

const stateIntial = {
    open: false,
    content: null
};

const formInitial = {
    isForm: false,
    onSubmit: (e) => {console.log('form working')},
};

function reducer(s, a) {
    switch (a.type) {
        case ModalHelper.INSERT: return { ...s, ...a.value };
        case ModalHelper.REMOVE: return a.value;
        default: return s;
    };
};

const ModalCtx = createContext(null);
export const useModal = () => {
    const ctx = useContext(ModalCtx);
    if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
    return ctx;
};


export function ModalProvider({ children }) {
    const [header, setheader] = useReducer(reducer, headerIntiial);
    const setModalHeader = useCallback((payload) => setheader({ type: ModalHelper.INSERT, value: payload }), []);
    const resetModalHeader = useCallback(() => setheader({ type: ModalHelper.REMOVE, value: headerIntiial }), []);

    const [footer, setFooter] = useReducer(reducer, footerInitial);
    const setModalFooter = useCallback((payload) => setFooter({ type: ModalHelper.INSERT, value: payload }), []);
    const resetModalFooter = useCallback(() => setFooter({ type: ModalHelper.REMOVE, value: footerInitial }), []);

    const [state, setState] = useReducer(reducer, stateIntial);
    const setModalState = useCallback((payload) => setState({ type: ModalHelper.INSERT, value: payload }), []);

    const [form, setForm] = useReducer(reducer, formInitial);
    const setModalForm = useCallback((payload) => setForm({ type: ModalHelper.INSERT, value: payload }), []);
    const resetModalForm = useCallback(() => setForm({ type: ModalHelper.REMOVE, value: formInitial }), []);

    const value = useMemo(() => ({ setModalHeader, setModalFooter, setModalState, setModalForm }), [setModalHeader, setModalFooter, setModalState, setModalForm]);

    return (
        <ModalCtx.Provider value={value}>
            {children}

            <Modal
                header={header}
                footer={footer}
                state={state}
                form={form}
                close={() => setState({ type: ModalHelper.INSERT, value: {open: false} })}
            />
        </ModalCtx.Provider >
    );
}