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
import { createContext, useContext } from 'react';
import { ModalProvider } from '@/context/index';
import { Navbar, Footer, GlobalAlert } from '@/components';
import { usePathname } from 'next/navigation';

const InitialAuthContext = createContext(false);
export const useInitialAuthed = () => useContext(InitialAuthContext);

export default function Providers({ initialAuthed, children }) {
  const pathname = usePathname();
  const isAuctionDetail = /^\/auction\/[^/]+$/.test(pathname) && pathname !== '/auction/create';
  const isMinimalLayout = pathname === '/' || isAuctionDetail;

  return (
    <InitialAuthContext.Provider value={initialAuthed}>
      <ModalProvider>
        {
          isMinimalLayout
            ? (children)
            : (
              <>
                <Navbar />
                <div className={`container max-w-7xl px-2 md:px-6 lg:px-8 mx-auto min-h-screen pt-16`}>
                  <div className="my-4 space-y-4">
                    {children}
                  </div>
                </div>
                <Footer />
              </>
            )
        }

      </ModalProvider>
      <Toaster position="top-center" richColors offset="16px" closeButton />
    </InitialAuthContext.Provider>
  );
}
