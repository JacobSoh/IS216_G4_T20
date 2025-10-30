// // app/providers.jsx
// 'use client';
// import { createContext, useContext } from 'react';
// import {
//   AlertProvider,
//   ModalProvider
// } from '@/context/index';

// import {
//   Navbar,
//   Footer,
//   GlobalAlert
// } from '@/components';

// import { usePathname } from 'next/navigation';

// const InitialAuthContext = createContext(false);
// export const useInitialAuthed = () => useContext(InitialAuthContext);

// export default function Providers({ initialAuthed, children }) {
//   const pathname = usePathname();
//   const fullScreen = pathname.startsWith('/auction');

//   return (
//     <InitialAuthContext.Provider value={initialAuthed}>
//       <AlertProvider>
//         <ModalProvider>
//           <GlobalAlert />
//           <Navbar fullScreen={fullScreen} />
//           <div className={`container mx-auto min-h-dvh ${fullScreen ? '' : 'pt-16'}`}>
//             {children}
//           </div>
//           <Footer fullScreen={fullScreen} />
//         </ModalProvider>
//       </AlertProvider>
//     </InitialAuthContext.Provider>
//   );
// }

'use client';
import { Toaster } from "@/components/ui/sonner"
import { toast } from 'sonner';
import { createContext, useContext, useEffect } from 'react';
import { ModalProvider } from '@/context/index';
import { Navbar, Footer, GlobalAlert } from '@/components';
import { usePathname } from 'next/navigation';

const InitialAuthContext = createContext(false);
export const useInitialAuthed = () => useContext(InitialAuthContext);

export default function Providers({ initialAuthed, children }) {
  const pathname = usePathname();
  const isAuctionDetail = /^\/auction\/[^/]+$/.test(pathname) && pathname !== '/auction/create';
  const isMinimalLayout = pathname === '/' || isAuctionDetail;

  // One-time email verification toast from middleware flash cookie
  useEffect(() => {
    try {
      const name = 'email_verified_toast=';
      const match = document.cookie.split('; ').find((row) => row.startsWith(name));
      if (match) {
        const value = match.substring(name.length);
        if (value === '1') {
          toast.success('Email verified!');
        }
        // Clear the flash cookie
        document.cookie = 'email_verified_toast=; Max-Age=0; Path=/';
      }
    } catch {}
  }, []);

  return (
    <InitialAuthContext.Provider value={initialAuthed}>
      <ModalProvider>
        <Navbar />
        {
          isMinimalLayout
            ? (children)
            : (
              <>
                
                <div className="min-h-screen flex flex-col">
                  <main className={`flex-1 container max-w-7xl px-2 md:px-6 lg:px-8 mx-auto pt-16`}>
                    <div className="my-4 space-y-4">
                      {children}
                    </div>
                  </main>
                  <Footer />
                </div>
              </>
            )
        }

      </ModalProvider>
      <Toaster position="top-center" richColors offset="16px" closeButton />
    </InitialAuthContext.Provider>
  );
}
