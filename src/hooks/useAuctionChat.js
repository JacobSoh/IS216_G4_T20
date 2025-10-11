'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_INTERVAL = 5000

export function useAuctionChat(aid, initialMessages = [], options = {}) {
  const { pollInterval = DEFAULT_INTERVAL, enabled = true } = options
  const [messages, setMessages] = useState(initialMessages)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  const fetchChat = useCallback(async () => {
    if (!aid || !enabled) return
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    controllerRef.current = new AbortController()
    setIsFetching(true)
    setError(null)
    try {
      const res = await fetch(`/api/auctions/${aid}/chat`, {
        cache: 'no-store',
        signal: controllerRef.current.signal
      })
      if (!res.ok) {
        throw new Error(`Failed to fetch chat (${res.status})`)
      }
      const payload = await res.json()
      setMessages(payload.record ?? [])
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err)
      }
    } finally {
      setIsFetching(false)
    }
  }, [aid, enabled])

  useEffect(() => {
    if (enabled) {
      fetchChat()
    }
  }, [enabled, fetchChat])

  useEffect(() => {
    if (!enabled || !pollInterval) return undefined
    intervalRef.current = window.setInterval(fetchChat, pollInterval)
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [enabled, fetchChat, pollInterval])

  return {
    messages,
    isFetching,
    error,
    refresh: fetchChat,
    setMessages
  }
}
