'use client'

import axios from 'axios'

// Dynamically determine base URL from browser location
// This allows it to work on any port (3000, 3001, etc.)
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Use the current browser origin + /api
    return `${window.location.origin}/api`
  }
  // Fallback to env variable for server-side
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  return rawBase ? rawBase.replace(/\/+$/, '') : ''
}

export const axiosBrowserClient = axios.create({
  baseURL: getBaseURL() || undefined,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false
})

axiosBrowserClient.interceptors.request.use((config) => {
  if (config.baseURL?.endsWith('/api') && config.url?.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api/, '')
  }
  return config
})

axiosBrowserClient.interceptors.response.use(
  (res) => res?.data ?? res,
  (err) =>
    Promise.reject(err?.response?.data?.error || err?.message || 'Request failed')
)
