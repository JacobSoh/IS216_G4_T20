import { useEffect } from 'react'

import { supabaseBrowser } from '@/utils/supabase/client'
import Spinner from '@/components/SpinnerComponent'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      try {
        const sb = supabaseBrowser()
        await (await sb).auth.signOut()
      } finally {
        if (isMounted) {
          router.replace('/login')
        }
      }
    }
    run()
    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[var(--custom-bg-primary)] text-[var(--custom-text-primary)]">
      <Spinner />
      <p>Signing you out...</p>
    </div>
  )
}
