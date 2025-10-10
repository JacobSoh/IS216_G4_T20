// app/providers.jsx
import { AlertProvider } from '@/context/AlertContext';
import { ModalProvider } from '@/context/ModalContext';
import GlobalAlert from '@/components/Alert/GlobalAlert';

import { cookies } from 'next/headers';

export default async function Providers({ children }) {
  const c = await cookies();
  const openModal = c.get('open_modal')?.value ?? null;      // "login" | "auction" | null
  const nextPath = c.get('next_path')?.value ?? null;

  console.log(openModal);

  return (
    <AlertProvider>
      <ModalProvider>
        <GlobalAlert />
        {children}
      </ModalProvider>
    </AlertProvider>
  );
}
