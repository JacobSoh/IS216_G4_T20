// context/AlertContext.jsx
'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const AlertCtx = createContext(null);

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState(null); // { message, variant }

    const showAlert = useCallback(({ message, variant = 'info', timeoutMs = 4000 }) => {
        setAlert({ message, variant });
        if (timeoutMs) {
            const id = setTimeout(() => setAlert(null), timeoutMs);
            return () => clearTimeout(id);
        };
    }, []);

    const hideAlert = useCallback(() => setAlert(null), []);

    return (
        <AlertCtx.Provider value={{ alert, showAlert, hideAlert }}>
            {children}
        </AlertCtx.Provider>
    );
}

export function useAlert() {
    const ctx = useContext(AlertCtx);
    if (!ctx) throw new Error('useAlert must be used inside <AlertProvider>');
    return ctx;
}
