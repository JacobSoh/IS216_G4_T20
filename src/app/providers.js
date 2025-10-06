// app/providers.jsx
'use client';
import { AlertProvider } from '@/context/AlertContext';
import GlobalAlert from '@/components/GlobalAlert';

export default function Providers({ children }) {
  return (
    <AlertProvider>
      <GlobalAlert />
      {children}
    </AlertProvider>
  );
}
