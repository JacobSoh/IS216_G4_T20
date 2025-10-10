/* Importing Style or Fonts */
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

/* Importing Components */
import Providers from '@/app/providers'
import AppLayoutShell from '@/components/sub/layout/AppLayoutShell'
import { cookies } from 'next/headers'

// /* Import Supabase Server For Session */
// import { getServerUser } from '@/utils/auth'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true
})

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-linear-(--custom-body-bg) bg-no-repeat text-(--custom-text-primary) leading-[1.6]`}>
        <Providers>
          <AppLayoutShell>
            {children}
          </AppLayoutShell>
        </Providers>
      </body>
    </html>
  )
}
