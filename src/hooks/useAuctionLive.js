'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_INTERVAL = 7000

export function useAuctionLive(aid, initialData, pollInterval = DEFAULT_INTERVAL) {
  const [snapshot, setSnapshot] = useState(initialData)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  const controllerRef = useRef(null)

  useEffect(() => {
    setSnapshot(initialData)
  }, [initialData])

  const fetchLive = useCallback(async () => {
    if (!aid) return
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    controllerRef.current = new AbortController()
    setIsFetching(true)
    setError(null)
    try {
      const res = await fetch(`/api/auctions/${aid}/live`, {
        cache: 'no-store',
        signal: controllerRef.current.signal
      })
      if (!res.ok) {
        throw new Error(`Failed to refresh auction live state (${res.status})`)
      }
      const payload = await res.json()
      setSnapshot(payload.record ?? payload)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err)
      }
    } finally {
      setIsFetching(false)
    }
  }, [aid])

  useEffect(() => {
    if (!pollInterval) return undefined
    intervalRef.current = window.setInterval(fetchLive, pollInterval)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [fetchLive, pollInterval])

  return {
    snapshot,
    isFetching,
    error,
    refresh: fetchLive
  }
}
