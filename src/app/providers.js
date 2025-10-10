// app/providers.jsx
'use client';
import { AlertProvider } from '@/context/AlertContext';
import { ModalProvider } from '@/context/ModalContext';
import GlobalAlert from '@/components/GlobalAlert';

export default function Providers({ children }) {
  return (
    <AlertProvider>
      <ModalProvider>
        <GlobalAlert />
        {children}
      </ModalProvider>
    </AlertProvider>
  );
}
