'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import AuthFormComponent from '@/components/AuthFormComponent'
import { useAlert } from '@/context/AlertContext'
import { supabaseBrowser } from '@/utils/supabase/client'

function VerifiedGate() {
  const params = useSearchParams()
  const router = useRouter()
  const { showAlert } = useAlert()

  useEffect(() => {
    const verified = params.get('verified')
    const registered = params.get('registered')
    const nextRoute = params.get('next')
    if (verified === '1') {
      showAlert({ message: 'Email verified! You can log in now.', variant: 'success' })
      const href = nextRoute ? `/login?next=${encodeURIComponent(nextRoute)}` : '/login'
      router.replace(href)
      return
    }

    if (registered === '1') {
      showAlert({
        message: 'Account created. Please verify your email before logging in.',
        variant: 'info'
      })
      const href = nextRoute ? `/login?next=${encodeURIComponent(nextRoute)}` : '/login'
      router.replace(href)
    }
  }, [params, router, showAlert])

  return null
}

export default function LoginPage() {
  const [showLoading, setShowLoading] = useState(false)
  const { showAlert } = useAlert()
  const router = useRouter()
  const sb = supabaseBrowser()
  const params = useSearchParams()
  const nextRoute = useMemo(() => params.get('next') || '/', [params])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setShowLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email')
    const password = form.get('password')

    const { error } = await (await sb).auth.signInWithPassword({
      email,
      password
    })

    setShowLoading(false)

    if (error) {
      showAlert({ message: error.message, variant: 'danger' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    router.push(nextRoute || '/')
  }, [nextRoute, router, sb, showAlert])

  return (
    <>
      <Suspense fallback={null}>
        <VerifiedGate />
      </Suspense>
      <AuthFormComponent showLoading={showLoading} onSubmit={handleSubmit} nextUrl={nextRoute} />
    </>
  )
}
