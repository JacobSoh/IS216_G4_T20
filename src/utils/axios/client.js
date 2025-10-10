'use client'

import axios from 'axios'

const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
const normalizedBase = rawBase ? rawBase.replace(/\/+$/, '') : ''

export const axiosBrowserClient = axios.create({
  baseURL: normalizedBase || undefined,
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
