'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/utils/supabase/client'

export function useAuctionChat(aid, initialMessages = [], options = {}) {
  const { enabled = true } = options
  const [messages, setMessages] = useState(initialMessages)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)
  const channelRef = useRef(null)

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

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchChat()
    }
  }, [enabled, fetchChat])

  // Real-time subscription
  useEffect(() => {
    if (!enabled || !aid) return undefined

    const setupSubscription = async () => {
      const supabase = supabaseBrowser()

      // Create a channel for this auction's chat
      const channel = supabase
        .channel(`auction-chat:${aid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'auction_chat',
            filter: `aid=eq.${aid}`
          },
          (payload) => {
            // When a new message is inserted, fetch the complete message with profile data
            const fetchNewMessage = async () => {
              try {
                const { data, error: fetchError } = await supabase
                  .from('auction_chat')
                  .select(`
                    chat_id,
                    aid,
                    uid,
                    message,
                    sent_at,
                    sender:profile!auction_chat_uid_fkey (
                      id,
                      username,
                      avatar_bucket,
                      object_path
                    )
                  `)
                  .eq('chat_id', payload.new.chat_id)
                  .single()

                if (!fetchError && data) {
                  setMessages(prev => [...prev, data])
                }
              } catch (err) {
                console.error('Error fetching new chat message:', err)
              }
            }
            fetchNewMessage()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'auction_chat',
            filter: `aid=eq.${aid}`
          },
          (payload) => {
            // Handle individual message deletion
            const chatId = payload.old.chat_id
            if (chatId) {
              setMessages(prev => {
                const filtered = prev.filter(msg => msg.chat_id !== chatId)
                // If this was the last message, verify by refetching
                // This handles bulk deletes that might send multiple DELETE events
                if (filtered.length === 0 && prev.length > 1) {
                  // Slight delay to let all DELETE events arrive
                  setTimeout(() => fetchChat(), 100)
                }
                return filtered
              })
            } else {
              // If chat_id is not available, refetch all messages to stay in sync
              fetchChat()
            }
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    setupSubscription()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [enabled, aid, fetchChat])

  return {
    messages,
    isFetching,
    error,
    refresh: fetchChat,
    setMessages
  }
}
