'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/NavbarComponent'
import Footer from '@/components/FooterComponent'

const FULLSCREEN_PATH_MATCHERS = [
  /^\/auction\/.+/
]

const isFullScreenRoute = (pathname) => {
  if (!pathname) return false
  return FULLSCREEN_PATH_MATCHERS.some((matcher) => matcher.test(pathname))
}

export default function AppLayoutShell({ session, children }) {
  const pathname = usePathname()

  const showFullScreen = useMemo(() => isFullScreenRoute(pathname), [pathname])

  if (showFullScreen) {
    return (
      <div className="min-h-screen w-full bg-[var(--custom-bg-primary)] text-[var(--custom-text-primary)]">
        {children}
      </div>
    )
  }

  return (
    <>
      <Navbar isAuthed={!!session} />
      <div className="container mx-auto min-h-dvh pt-16">
        {children}
      </div>
      <Footer />
    </>
  )
}
