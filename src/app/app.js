/* Importing Style or Fonts */
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

/* Importing Components */
import Navbar from '@/components/NavbarComponent';
import Footer from '@/components/FooterComponent';
import Providers from '@/app/providers';

/* Import Supabase Server For Session */
import { supabaseServer } from '@/utils/supabase/server';

/* Import Session Context */
import { SessionProvider } from '@/context/SessionContext';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true
});

export default async function RootLayout({ children }) {
  const sb = await supabaseServer();

  const { data: { session } } = await sb.auth.getSession();
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-linear-(--custom-body-bg) bg-no-repeat text-(--custom-text-primary) leading-[1.6]`}
        suppressHydrationWarning
      >
        <Providers>
          <Navbar isAuthed={!!session} />
          <SessionProvider session={session}>
            <div className='container min-h-dvh mx-auto pt-16'>
              {children}
            </div>
          </SessionProvider>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
