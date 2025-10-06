/* Importing Style or Fonts */
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

/* Importing Components */
import Navbar from '@/components/NavbarComponent';
import Footer from '@/components/FooterComponent';
import Providers from '@/app/providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true
});

export default async function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body
        className={`${inter.variable} antialiased bg-linear-(--custom-body-bg) bg-no-repeat text-(--custom-text-primary) leading-[1.6]`}
      >
        <Navbar />
        <Providers>
          <div className='container min-h-dvh mx-auto pt-16'>
            {children}
          </div>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
