/* Importing Style or Fonts */
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

/* Importing Components */
import NavbarComponent from '@/components/NavbarComponent';
import FooterComponent from '@/components/FooterComponent';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true
});

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body
        className={`${inter.variable} antialiased bg-linear-(--custom-body-bg) bg-no-repeat text-(--custom-text-primary) leading-[1.6]`}
      >
        <NavbarComponent/>
        <div className='container min-h-dvh mx-auto pt-16 lg:pb-77'>
          {children}
        </div>
        <FooterComponent/>
      </body>
    </html>
  );
}
