'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/utils/supabase/client'

export function useAuctionLive(aid, initialData) {
  const [snapshot, setSnapshot] = useState(initialData)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    setSnapshot(initialData)
  }, [initialData])

  const fetchLive = useCallback(async () => {
    if (!aid) return
    setIsFetching(true)
    setError(null)
    try {
      console.log('🔄 Fetching live auction data for:', aid)
      const res = await fetch(`/api/auctions/${aid}/live`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      if (!res.ok) {
        throw new Error(`Failed to refresh auction live state (${res.status})`)
      }
      const payload = await res.json()
      const newSnapshot = payload.record ?? payload
      console.log('✅ Received new snapshot:', {
        activeItemId: newSnapshot?.activeItem?.iid,
        activeItemTitle: newSnapshot?.activeItem?.title,
        itemCount: newSnapshot?.items?.length
      })
      setSnapshot(newSnapshot)
    } catch (err) {
      console.error('❌ Error fetching live data:', err)
      setError(err)
    } finally {
      setIsFetching(false)
    }
  }, [aid])

  // Set up Supabase Realtime subscription
  useEffect(() => {
    if (!aid) return

    const supabase = supabaseBrowser()

    // Create a unique channel for this auction
    const channel = supabase.channel(`auction:${aid}`, {
      config: {
        broadcast: { self: true },
        presence: { key: '' }
      }
    })

    console.log('🔧 Setting up Realtime for auction:', aid)

    // Subscribe to changes in auction table (for timer updates)
    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auction',
          filter: `aid=eq.${aid}`
        },
        (payload) => {
          console.log('🔴 Realtime auction UPDATE detected:', payload)
          console.log('✅ Auction update detected, fetching live data')
          fetchLive()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'current_bid'
        },
        (payload) => {
          console.log('🔴 Realtime current_bid change detected:', payload)
          // Check if this change is for our auction
          if (payload.new?.aid === aid || payload.old?.aid === aid) {
            console.log('✅ Change matches our auction, fetching live data')
            fetchLive()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item'
        },
        (payload) => {
          console.log('🔴 Realtime item change detected:', payload)
          // Check if this change is for our auction
          if (payload.new?.aid === aid || payload.old?.aid === aid) {
            console.log('✅ Item change matches our auction, fetching live data')
            fetchLive()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only listen to new bids
          schema: 'public',
          table: 'bid_history'
        },
        (payload) => {
          console.log('🔴 Realtime bid_history INSERT detected:', payload)
          // Check if this bid is for our auction
          if (payload.new?.aid === aid) {
            console.log('✅ New bid for our auction, fetching live data')
            fetchLive()
          }
        }
      )
      .on('broadcast', { event: 'auction_update' }, (payload) => {
        console.log('📢 Broadcast auction_update received:', payload)
        if (payload.payload?.aid === aid) {
          console.log('✅ Broadcast matches our auction, fetching live data')
          fetchLive()
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Realtime SUBSCRIBED for auction ${aid}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Realtime CHANNEL_ERROR for auction ${aid}`)
        } else if (status === 'TIMED_OUT') {
          console.error(`❌ Realtime TIMED_OUT for auction ${aid}`)
        } else if (status === 'CLOSED') {
          console.log(`🔴 Realtime CLOSED for auction ${aid}`)
        } else {
          console.log(`📡 Realtime subscription status for auction ${aid}:`, status)
        }
      })

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log(`🔴 Unsubscribing from auction ${aid} realtime updates`)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [aid, fetchLive])

  return {
    snapshot,
    isFetching,
    error,
    refresh: fetchLive,
    setSnapshot
  }
}
