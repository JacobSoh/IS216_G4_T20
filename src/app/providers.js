// app/providers.jsx
'use client';
import { createContext, useContext } from 'react';
import {
  AlertProvider,
  ModalProvider
} from '@/context/index';

import {
  Navbar,
  Footer,
  GlobalAlert
} from '@/components';

import { usePathname } from 'next/navigation';

const InitialAuthContext = createContext(false);
export const useInitialAuthed = () => useContext(InitialAuthContext);

export default function Providers({ initialAuthed, children }) {
  const pathname = usePathname();
  const fullScreen = pathname.startsWith('/auction');

  return (
    <InitialAuthContext.Provider value={initialAuthed}>
      <AlertProvider>
        <ModalProvider>
          <GlobalAlert />
          <Navbar fullScreen={fullScreen} />
          <div className={`container mx-auto min-h-dvh ${fullScreen ? '' : 'pt-16'}`}>
            {children}
          </div>
          <Footer fullScreen={fullScreen} />
        </ModalProvider>
      </AlertProvider>
    </InitialAuthContext.Provider>
  );
}
