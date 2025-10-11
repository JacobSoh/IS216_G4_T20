// app/providers.jsx
'use client';
import { createContext, useContext } from 'react';
import {
  AlertProvider,
  ModalProvider,
  SessionProvider
} from '@/context/index';
import { supabaseServer } from '@/utils/supabase/server';

import {
  Navbar,
  Footer,
  GlobalAlert
} from '@/components';

import { usePathname } from 'next/navigation';


const InitialAuthContext = createContext(false);
export const useInitialAuthed = () => useContext(InitialAuthContext);

export default function Providers({ initialAuthed, children }) {
  const sb = await supabaseServer();
	const { data: { session } } = await sb.auth.getSession();

  const pathname = usePathname();
  const fullScreen = pathname.startsWith('/auction');

  return (
    <InitialAuthContext.Provider value={initialAuthed}>
      <AlertProvider>
        <ModalProvider>
          <SessionProvider session={session} >
            <GlobalAlert />
            <Navbar fullScreen={fullScreen} />
            <div className={`container mx-auto min-h-dvh ${fullScreen ? '' : 'pt-16'}`}>
              {children}
            </div>
            <Footer fullScreen={fullScreen} />
          </SessionProvider>
        </ModalProvider>
      </AlertProvider>
    </InitialAuthContext.Provider>
  );
}
