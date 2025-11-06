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

"use client";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { createContext, useContext, useEffect } from "react";
import { ModalProvider } from "@/context/index";
import { Navbar, Footer, GlobalAlert } from "@/components";
import { usePathname, useSearchParams } from "next/navigation";
import { useModal } from "@/context/ModalContext";
import Login from "@/components/LR/Login";

const InitialAuthContext = createContext(false);
export const useInitialAuthed = () => useContext(InitialAuthContext);

export default function Providers({ initialAuthed, children }) {
  const pathname = usePathname();
  const isAuctionDetail =
    /^\/auction\/view\/[^/]+$/.test(pathname) && pathname !== "/auction/create";
  const isMinimalLayout = pathname === "/" || isAuctionDetail;

  const noPaddingPages = ["/featured_auctions"];
  // Check multiple paths
  if (
    pathname.startsWith("/categories") ||
    pathname === "/contact" ||
    pathname === "/about" ||
    pathname === "/how_it_works"
  ) {
    noPaddingPages.push(pathname);
  }

  const disablePadding = noPaddingPages.includes(pathname);

  // One-time email verification toast from middleware flash cookie
  useEffect(() => {
    try {
      const name = "email_verified_toast=";
      const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(name));
      if (match) {
        const value = match.substring(name.length);
        if (value === "1") {
          toast.success("Email verified!");
        }
        // Clear the flash cookie
        document.cookie = "email_verified_toast=; Max-Age=0; Path=/";
      }
    } catch {}
  }, []);

  return (
    <InitialAuthContext.Provider value={initialAuthed}>
      <ModalProvider>
        <AutoOpenLogin />
        {isMinimalLayout ? (
          children
        ) : (
          <>
            <Navbar />
            <div className="min-h-screen flex flex-col">
              <main
                className={`flex-1 ${
                  disablePadding
                    ? ""
                    : "container max-w-7xl px-4 md:px-6 lg:px-8 my-8 mx-auto"
                }`}
              >
                <div className='space-y-4'>
                  {children}
                </div>
              </main>
              <Footer />
            </div>
          </>
        )}
      </ModalProvider>
      <Toaster position="top-center" richColors offset="16px" closeButton />
    </InitialAuthContext.Provider>
  );
}

function AutoOpenLogin() {
  const searchParams = useSearchParams();
  const { setModalHeader, setModalState, setModalForm } = useModal();
  useEffect(() => {
    try {
      const loginFlag = searchParams?.get("login");
      const nextPath = searchParams?.get("next");
      if (loginFlag === "1") {
        setModalHeader({ title: "Login", description: "Welcome back!" });
        setModalForm({
          isForm: true,
          onSubmit: async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const email = form.get("email")?.toString().trim();
            const password = form.get("password")?.toString().trim();
            const { error } = await (await import("@/utils/supabase/client"))
              .supabaseBrowser()
              .auth.signInWithPassword({ email, password });
            const { toast } = await import("sonner");
            if (error) return toast.error(error.message);
            setModalState({ open: false });
            toast.success("Successfully logged in!");
            if (nextPath) window.location.href = nextPath;
          },
        });
        setModalState({ open: true, content: <Login /> });
        // Clean login param but keep next without reloading the page
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("login");
          if (nextPath) url.searchParams.set("next", nextPath);
          else url.searchParams.delete("next");
          const newUrl = url.pathname + (url.search ? url.search : "");
          try {
            window.history.replaceState({}, "", newUrl);
          } catch {
            // Avoid full reload to keep modal open
          }
        }
      }
    } catch {}
  }, [searchParams]);
  return null;
}
