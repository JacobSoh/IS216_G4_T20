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

  // For navbar (example: hide navbar on auction pages)
  // const hideNavbarOn = ['/'];
  // const hideNavbar = hideNavbarOn.some(page => pathname.startsWith(page));

  // For footer (hide footer on specific pages)
  // const hideFooterOn = ['/'];
  // const hideFooter = hideFooterOn.some(page => pathname.startsWith(page));

  return (
    <InitialAuthContext.Provider value={initialAuthed}>
      <ModalProvider>
        <Navbar fullScreen={false} />
        <div className={`container mx-auto min-h-dvh ${false ? '' : 'pt-16'}`}>
          {children}
        </div>
        <Footer fullScreen={false} />
      </ModalProvider>
      <Toaster position="top-center" richColors offset="16px" closeButton />
    </InitialAuthContext.Provider>
  );
}