'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import AuthFormComponent from '@/components/AuthFormComponent'
import { axiosBrowserClient } from '@/utils/axios/client'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [showLoading, setShowLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const nextRoute = useMemo(() => params.get('next') || '/', [params])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setError('')
      setShowLoading(true)

      const form = new FormData(e.currentTarget)
      const email = form.get('email')
      const password = form.get('password')
      const username = form.get('username')
      const redirectTo = `${window.location.origin}/login?verified=1&next=${encodeURIComponent(nextRoute)}`

      try {
        const payload = await axiosBrowserClient.post('/api/auth/register', {
          email,
          password,
          username,
          redirectTo
        })

        if (payload?.status !== 200) {
          throw new Error(payload?.error ?? 'Unable to register')
        }

        router.push(`/login?registered=1&next=${encodeURIComponent(nextRoute)}`)
      } catch (err) {
        const message = typeof err === 'string' ? err : err?.message ?? 'Unable to register'
        setError(message)
        setShowLoading(false)
      }
    },
    [nextRoute, router]
  )

  return (
    <AuthFormComponent
      showLoading={showLoading}
      error={error}
      isLogin={false}
      onSubmit={handleSubmit}
      nextUrl={nextRoute}
    />
  )
}
