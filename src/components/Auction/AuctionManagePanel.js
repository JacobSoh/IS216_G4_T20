'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { useAuctionLive } from '@/hooks/useAuctionLive'
import { useAuctionChat } from '@/hooks/useAuctionChat'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

// New color palette constants
const COLORS = {
  deepPurple: '#4D067B',
  richPurple: '#B026FF',
  lightPurple: '#B984D8',
  warmCream: '#F8E2D4',
  goldenTan: '#E2BD6B'
}

export default function AuctionManagePanel({ aid, initialLiveData, initialChatMessages = [] }) {
  const router = useRouter()
  const { snapshot, isFetching, refresh, setSnapshot: setLiveSnapshot } = useAuctionLive(aid, initialLiveData)
  const [busyItem, setBusyItem] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isClosingAuction, setIsClosingAuction] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const {
    messages: chatMessages,
    isFetching: isChatFetching,
    error: chatError,
    refresh: refreshChat,
    setMessages: setChatMessages
  } = useAuctionChat(aid, initialChatMessages, { enabled: true })
  const [chatInput, setChatInput] = useState('')
  const [chatFeedback, setChatFeedback] = useState(null)
  const [isSendingChat, setIsSendingChat] = useState(false)

  // Timer state
  const [activeTimer, setActiveTimer] = useState(null) // { iid, secondsLeft, isRunning }
  const [timerAdjust, setTimerAdjust] = useState({ minutes: '', seconds: '' })
  const timerIntervalRef = useRef(null)
  const chatMessagesEndRef = useRef(null)

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState(null) // { title, message, status, onConfirm, onCancel }

  const items = useMemo(() => snapshot?.items ?? [], [snapshot?.items])
  const activeItemId = snapshot?.activeItem?.iid ?? null
  const activeItem = items.find(item => item.iid === activeItemId)
  const defaultTimeInterval = snapshot?.auction?.time_interval ?? 300 // Default 5 minutes
  const ownerId = snapshot?.auction?.oid ?? null

  useEffect(() => {
    const endTimeIso = snapshot?.auction?.end_time ?? null
    if (!endTimeIso) {
      return
    }
    const endTime = new Date(endTimeIso)
    if (Number.isNaN(endTime.getTime())) {
      return
    }
    if (Date.now() >= endTime.getTime()) {
      router.replace(`/auction/${aid}/ended`)
    }
  }, [snapshot?.auction?.end_time, router, aid])

  useEffect(() => {
    if (!chatFeedback) return undefined
    const timeoutId = window.setTimeout(() => setChatFeedback(null), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [chatFeedback])

  // Get bid history from snapshot
  const bidHistory = useMemo(() => {
    const history = snapshot?.bidHistory ?? []
    return history.map(bid => ({
      id: bid.bid_id,
      iid: bid.iid,
      itemTitle: bid.item?.title || 'Unknown Item',
      username: bid.bidder?.username || 'Anonymous',
      amount: bid.bid_amount,
      timestamp: new Date(bid.bid_datetime)
    }))
  }, [snapshot?.bidHistory])

  // Determine next item to activate (first unsold, non-active item)
  const nextItemToActivate = useMemo(() => {
    if (!items.length) {
      return null
    }

    // No active item yet - pick the first unsold lot
    if (!activeItemId) {
      return items.find(item => item?.sold !== true) ?? null
    }

    const activeIndex = items.findIndex(item => item.iid === activeItemId)
    const startIndex = activeIndex >= 0 ? activeIndex + 1 : 0

    for (let idx = startIndex; idx < items.length; idx += 1) {
      const candidate = items[idx]
      if (candidate?.sold !== true) {
        return candidate
      }
    }

    return null
  }, [items, activeItemId])

  // Check if item has any bids
  const getItemBidCount = useCallback((iid) => {
    return bidHistory.filter(bid => bid.iid === iid).length
  }, [bidHistory])

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatChatTimestamp = useCallback((value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [])

  const handleChatSubmit = useCallback(async (event) => {
    event?.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed) {
      return
    }
    setIsSendingChat(true)
    setChatFeedback(null)
    try {
      const res = await fetch(`/api/auctions/${aid}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: trimmed })
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to send message')
      }

      setChatInput('')
      setChatFeedback('Message sent')
      await refreshChat()
    } catch (err) {
      setChatFeedback(err.message ?? 'Unable to send message')
    } finally {
      setIsSendingChat(false)
    }
  }, [aid, chatInput, refreshChat])

  // Initialize timer from database when auction data changes
  useEffect(() => {
    const auctionData = snapshot?.auction

    if (!auctionData || !activeItemId) {
      setActiveTimer(null)
      return
    }

    // If there's a timer running in the database
    if (auctionData.timer_started_at && auctionData.timer_duration_seconds) {
      const startedAt = new Date(auctionData.timer_started_at)
      const duration = auctionData.timer_duration_seconds
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      const remaining = Math.max(0, duration - elapsed)

      setActiveTimer({
        iid: activeItemId,
        secondsLeft: remaining,
        isRunning: remaining > 0
      })
    } else {
      // No timer in database, clear local timer
      setActiveTimer(null)
    }
  }, [snapshot?.auction, activeItemId])

  // Activate item internal function
  const activateItemInternal = useCallback(async (iid, price) => {
    setBusyItem(iid)
    setError(null)
    try {
      const res = await fetch(`/api/auctions/${aid}/active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          iid,
          currentPrice: price
        })
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to activate lot')
      }

      // Refresh to get updated timer from database
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyItem(null)
    }
  }, [aid, refresh])

  // Close item sale function
  const closeItemSale = useCallback(async ({ iid, shouldActivateNext = true } = {}) => {
    if (!iid) {
      return
    }

    setBusyItem(iid)
    setError(null)

    const itemsInSequence = items ?? []
    const closedItemIndex = itemsInSequence.findIndex(item => item.iid === iid)

    try {
      const res = await fetch(`/api/auctions/${aid}/close-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iid })
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to close item sale')
      }

      const result = await res.json()

      // Stop timer
      setActiveTimer(null)

      if (result.record.hasBids) {
        setSuccess(`Item sold successfully for ${currencyFormatter.format(result.record.finalPrice)}!`)
      } else {
        setSuccess('Item closed (no bids received)')
      }
      setTimeout(() => setSuccess(null), 5000)

      await refresh()

      // Auto-activate next item if requested
      if (shouldActivateNext) {
        // Wait a bit for refresh to complete
        setTimeout(async () => {
          const startIndex = closedItemIndex >= 0 ? closedItemIndex + 1 : 0
          const sequentialNext =
            itemsInSequence
              .slice(startIndex)
              .find(item => item?.sold !== true && item.iid !== iid) ??
            itemsInSequence.find(item => item?.sold !== true && item.iid !== iid)
          if (sequentialNext) {
            const currentPrice = sequentialNext.current_bid?.current_price ?? sequentialNext.min_bid ?? 0
            await activateItemInternal(sequentialNext.iid, currentPrice)
          }
        }, 500)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyItem(null)
    }
  }, [aid, refresh, items, activateItemInternal])

  // Timer countdown logic - recalculate from database every second
  useEffect(() => {
    const auctionData = snapshot?.auction
    if (!auctionData || !activeItemId || !auctionData.timer_started_at || !auctionData.timer_duration_seconds) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }

    const updateTimer = () => {
      const startedAt = new Date(auctionData.timer_started_at)
      const duration = auctionData.timer_duration_seconds
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      const remaining = Math.max(0, duration - elapsed)

      setActiveTimer(prev => ({
        ...prev,
        iid: activeItemId,
        secondsLeft: remaining,
        isRunning: remaining > 0
      }))

      // Auto-close when timer hits 0 (regardless of bids)
      if (remaining <= 0) {
        closeItemSale({ iid: activeItemId }) // auto-close via timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }
      }
    }

    updateTimer()
    timerIntervalRef.current = setInterval(updateTimer, 1000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [snapshot?.auction, activeItemId, bidHistory, closeItemSale])

  // Adjust timer while running
  const adjustTimer = async () => {
    const minutes = parseInt(timerAdjust.minutes) || 0
    const seconds = parseInt(timerAdjust.seconds) || 0
    const totalSeconds = (minutes * 60) + seconds

    if (totalSeconds > 0 && activeTimer) {
      try {
        // Call API to update timer in database
        const res = await fetch(`/api/auctions/${aid}/adjust-timer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durationSeconds: totalSeconds })
        })

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload.error ?? 'Unable to adjust timer')
        }

        // Update local timer state
        setActiveTimer(prev => ({
          ...prev,
          secondsLeft: totalSeconds
        }))
        setTimerAdjust({ minutes: '', seconds: '' })
        setSuccess('Timer adjusted successfully')
        setTimeout(() => setSuccess(null), 2000)
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const activateItem = async (iid, price) => {
    // If there's an active item, show confirmation modal
    if (activeItemId && activeItemId !== iid) {
      const activeItemTitle = activeItem?.title || 'current item'
      const itemHasBids = getItemBidCount(activeItemId) > 0
      const action = itemHasBids ? 'SOLD' : 'CLOSED'

      return new Promise((resolve) => {
        setConfirmModal({
          title: '⚠️ Confirm Item Activation',
          currentItem: activeItemTitle,
          status: itemHasBids ? 'Has bids - will be SOLD' : 'No bids - will be CLOSED',
          action,
          description: 'Activating the next lot will automatically finalize the current lot.',
          onConfirm: async () => {
            setConfirmModal(null)

            // Close the previous item first (don't auto-activate since we're manually activating)
            try {
              setBusyItem(activeItemId)
              await closeItemSale({ iid: activeItemId, shouldActivateNext: false }) // close current lot before switching
            } catch (err) {
              setError(`Failed to close previous item: ${err.message}`)
              setBusyItem(null)
              resolve()
              return
            }

            // Activate new item
            await activateItemInternal(iid, price)
            resolve()
          },
          onCancel: () => {
            setConfirmModal(null)
            resolve()
          }
        })
      })
    }

    // No active item, just activate directly
    await activateItemInternal(iid, price)
  }

  const handleCloseActiveItem = useCallback(() => {
    if (!activeItemId || !activeItem) {
      return
    }

    const itemHasBids = getItemBidCount(activeItemId) > 0
    const action = itemHasBids ? 'SOLD' : 'CLOSED'

    setConfirmModal({
      title: itemHasBids ? 'Finalize Current Lot' : 'Close Current Lot',
      currentItem: activeItem.title || 'Current lot',
      status: itemHasBids ? 'Has bids - will be SOLD' : 'No bids - will be CLOSED',
      action,
      description: itemHasBids
        ? 'Closing this lot will finalize the winning bid and immediately move to the next item.'
        : 'Closing this lot will mark it as closed and continue to the next available item.',
      confirmLabel: itemHasBids ? 'Finalize Sale' : 'Close Lot',
      onConfirm: async () => {
        setConfirmModal(null)
        await closeItemSale({ iid: activeItemId })
      },
      onCancel: () => {
        setConfirmModal(null)
      }
    })
  }, [activeItemId, activeItem, closeItemSale, getItemBidCount])

  const requestResetAuction = useCallback(() => {
    const auctionName = snapshot?.auction?.name ?? 'this auction'

    setConfirmModal({
      title: 'Reset Auction',
      currentItem: auctionName,
      status: 'This action cannot be undone.',
      action: 'RESET',
      description: 'Resetting will delete all bid history, clear current bids, remove sale records, and mark every lot as unsold.',
      confirmLabel: 'Reset Auction',
      cancelLabel: 'Keep Data',
      contextLabel: 'Auction',
      onConfirm: async () => {
        setConfirmModal(null)
        setIsResetting(true)
        setError(null)
        try {
          const res = await fetch(`/api/auctions/${aid}/reset`, {
            method: 'POST'
          })

          if (!res.ok) {
            const payload = await res.json().catch(() => ({}))
            throw new Error(payload.error ?? 'Unable to reset auction')
          }

          setActiveTimer(null)
          await refresh()
          setLiveSnapshot(prev => (prev ? { ...prev, bidHistory: [] } : prev))
          setChatMessages([]) // Clear chat messages after reset
          setSuccess('Auction reset successfully')
          setTimeout(() => setSuccess(null), 4000)
        } catch (err) {
          setError(err.message)
        } finally {
          setIsResetting(false)
        }
      },
      onCancel: () => {
        setConfirmModal(null)
      }
    })
  }, [aid, refresh, router, snapshot?.auction?.name])

  const requestCloseAuction = useCallback(() => {
    const auctionName = snapshot?.auction?.name ?? 'this auction'

    setConfirmModal({
      title: 'Close Auction',
      currentItem: auctionName,
      status: 'This will end bidding immediately.',
      action: 'END',
      description: 'Closing the auction will stop all bidding and mark the event as complete. Make sure all lots are finalized before proceeding.',
      confirmLabel: 'Close Auction',
      cancelLabel: 'Keep Open',
      contextLabel: 'Auction',
      onConfirm: async () => {
        setConfirmModal(null)
        setIsClosingAuction(true)
        setError(null)
        try {
          const res = await fetch(`/api/auctions/${aid}/close`, {
            method: 'POST'
          })

          if (!res.ok) {
            const payload = await res.json().catch(() => ({}))
            throw new Error(payload.error ?? 'Unable to close auction')
          }

          setActiveTimer(null)
          router.replace(`/auction/${aid}/ended`)
          refresh().catch(() => {})
        } catch (err) {
          setError(err.message)
        } finally {
          setIsClosingAuction(false)
        }
      },
      onCancel: () => {
        setConfirmModal(null)
      }
    })
  }, [aid, refresh, router, snapshot?.auction?.name])

  const updateTimerAdjustMinutes = (value) => {
    setTimerAdjust(prev => ({ ...prev, minutes: value }))
  }

  const updateTimerAdjustSeconds = (value) => {
    setTimerAdjust(prev => ({ ...prev, seconds: value }))
  }

  return (
    <div className="min-h-screen py-8 px-6" style={{ backgroundColor: '#0a0514' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: COLORS.warmCream }}
            >
              Seller Dashboard
            </h1>
            <p
              className="text-base"
              style={{ color: COLORS.lightPurple }}
            >
              {snapshot?.auction?.name ?? 'Untitled Auction'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: COLORS.richPurple }} />
              <span className="text-sm font-semibold" style={{ color: COLORS.goldenTan }}>
                LIVE
              </span>
            </div>
            <button
              onClick={requestCloseAuction}
              disabled={isClosingAuction || isFetching}
              className="px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: '#5f1a1a',
                border: '1px solid rgba(239,68,68,0.6)',
                color: '#fca5a5',
                boxShadow: '0 0 18px rgba(239, 68, 68, 0.25)'
              }}
            >
              {isClosingAuction ? 'Closing...' : 'Close Auction'}
            </button>
            <button
              onClick={requestResetAuction}
              disabled={isResetting || isFetching}
              className="px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: '#2d143f',
                border: `1px solid ${COLORS.richPurple}`,
                color: COLORS.warmCream,
                boxShadow: '0 0 15px rgba(114, 9, 183, 0.35)'
              }}
            >
              {isResetting ? 'Resetting...' : 'Reset Auction'}
            </button>
          </div>
        </div>

        {error && (
          <div
            className="rounded-lg border-l-4 px-6 py-4 text-sm"
            style={{
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5'
            }}
          >
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}

        {success && (
          <div
            className="rounded-lg border-l-4 px-6 py-4 text-sm"
            style={{
              borderColor: COLORS.goldenTan,
              backgroundColor: `${COLORS.goldenTan}20`,
              color: COLORS.goldenTan
            }}
          >
            <strong className="font-semibold">Success:</strong> {success}
          </div>
        )}

        {/* Section 1: All Lots */}
        <div
          className="rounded-2xl border p-8"
          style={{
            borderColor: `${COLORS.richPurple}40`,
            backgroundColor: '#130a1f'
          }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: COLORS.warmCream }}
          >
            All Auction Lots ({items.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const currentPrice = item.current_bid?.current_price ?? item.min_bid ?? 0
              const isActive = activeItemId === item.iid
              const isSold = item.sold === true
              const itemHasBids = getItemBidCount(item.iid) > 0
              const isNextInSequence = nextItemToActivate?.iid === item.iid
              const canActivate = !isActive && !isSold && isNextInSequence

              return (
                <div
                  key={item.iid}
                  className="rounded-xl border p-5 transition-all"
                  style={{
                    borderColor: isSold ? '#666' : isActive ? COLORS.richPurple : `${COLORS.richPurple}30`,
                    backgroundColor: isSold ? '#1a1a1a' : isActive ? `${COLORS.deepPurple}60` : 'rgba(0,0,0,0.4)',
                    boxShadow: isActive ? `0 0 20px ${COLORS.richPurple}40` : 'none',
                    opacity: isSold ? 0.6 : 1
                  }}
                >
                  {isSold && (
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-xs uppercase font-bold tracking-wider px-2 py-1 rounded"
                        style={{
                          backgroundColor: itemHasBids ? COLORS.goldenTan : '#666',
                          color: itemHasBids ? COLORS.deepPurple : '#fff'
                        }}
                      >
                        {itemHasBids ? 'SOLD' : 'CLOSED'}
                      </span>
                    </div>
                  )}

                  {isActive && !isSold && (
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: COLORS.richPurple }}
                      />
                      <span
                        className="text-xs uppercase font-bold tracking-wider"
                        style={{ color: COLORS.richPurple }}
                      >
                        Currently Active
                      </span>
                    </div>
                  )}

                  <h3
                    className="font-bold text-lg mb-2 line-clamp-1"
                    style={{ color: COLORS.warmCream }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm mb-4 line-clamp-2"
                    style={{ color: COLORS.lightPurple }}
                  >
                    {item.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs uppercase font-semibold"
                        style={{ color: COLORS.lightPurple }}
                      >
                        Current Price
                      </span>
                      <span
                        className="text-xl font-bold"
                        style={{ color: COLORS.goldenTan }}
                      >
                        {currencyFormatter.format(currentPrice)}
                      </span>
                    </div>

                    {/* Timer display and controls for active item */}
                    {isActive && activeTimer && activeTimer.iid === item.iid && (
                      <div
                        className="rounded-lg p-3 text-center"
                        style={{
                          backgroundColor: activeTimer.secondsLeft <= 10 ? 'rgba(239, 68, 68, 0.2)' : `${COLORS.deepPurple}60`,
                          border: `1px solid ${activeTimer.secondsLeft <= 10 ? '#ef4444' : COLORS.richPurple}`
                        }}
                      >
                        <div
                          className="text-xs uppercase mb-1 font-semibold"
                          style={{ color: COLORS.lightPurple }}
                        >
                          Time Left
                        </div>
                        <div
                          className={`text-3xl font-bold ${activeTimer.secondsLeft <= 10 ? 'animate-pulse' : ''}`}
                          style={{ color: activeTimer.secondsLeft <= 10 ? '#ef4444' : COLORS.goldenTan }}
                        >
                          {formatTime(activeTimer.secondsLeft)}
                        </div>

                        {/* Timer adjustment inputs */}
                        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.richPurple}40` }}>
                          <label
                            className="text-xs uppercase font-semibold block mb-2"
                            style={{ color: COLORS.lightPurple }}
                          >
                            Adjust Timer
                          </label>
                          <div className="flex gap-1 items-center justify-center mb-2">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              placeholder="MM"
                              value={timerAdjust.minutes}
                              onChange={(e) => updateTimerAdjustMinutes(e.target.value)}
                              className="w-14 px-2 py-1 rounded text-xs font-semibold text-center"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                borderColor: COLORS.richPurple,
                                color: COLORS.warmCream,
                                border: '1px solid'
                              }}
                            />
                            <span className="text-sm font-bold" style={{ color: COLORS.warmCream }}>:</span>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              placeholder="SS"
                              value={timerAdjust.seconds}
                              onChange={(e) => updateTimerAdjustSeconds(e.target.value)}
                              className="w-14 px-2 py-1 rounded text-xs font-semibold text-center"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                borderColor: COLORS.richPurple,
                                color: COLORS.warmCream,
                                border: '1px solid'
                              }}
                            />
                          </div>
                          <button
                            onClick={adjustTimer}
                            className="w-full px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wide"
                            style={{
                              backgroundColor: COLORS.richPurple,
                              color: COLORS.warmCream
                            }}
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => activateItem(item.iid, currentPrice)}
                      disabled={busyItem === item.iid || isActive || isSold || !canActivate}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isSold ? '#666' : isActive ? `${COLORS.richPurple}80` : canActivate ? COLORS.goldenTan : '#444',
                        color: isSold ? '#ccc' : isActive ? COLORS.warmCream : canActivate ? COLORS.deepPurple : '#999'
                      }}
                      title={!canActivate && !isActive && !isSold ? 'Complete previous items first' : ''}
                    >
                      {busyItem === item.iid ? 'Activating...' : isSold ? (itemHasBids ? 'Sold' : 'Closed') : isActive ? 'Active Now' : canActivate ? 'Make Active' : 'Locked'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 2: Current Active Lot Details with Timer */}
        {activeItem && !activeItem.sold && (
          <div
            className="rounded-2xl border-2 p-8"
            style={{
              borderColor: COLORS.richPurple,
              backgroundColor: '#130a1f',
              boxShadow: `0 0 40px ${COLORS.richPurple}30`
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span
                className="inline-block w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: COLORS.richPurple }}
              />
              <h2
                className="text-3xl font-bold"
                style={{ color: COLORS.warmCream }}
              >
                Currently Active: {activeItem.title}
              </h2>
            </div>

            <p
              className="text-base mb-8"
              style={{ color: COLORS.lightPurple }}
            >
              {activeItem.description}
            </p>

            {/* Countdown Timer Display */}
            {activeTimer && activeTimer.iid === activeItem.iid && (
              <div
                className="rounded-xl p-6 mb-8 text-center"
                style={{
                  backgroundColor: activeTimer.secondsLeft <= 10 ? 'rgba(239, 68, 68, 0.2)' : `${COLORS.deepPurple}80`,
                  border: `2px solid ${activeTimer.secondsLeft <= 10 ? '#ef4444' : COLORS.richPurple}`
                }}
              >
                <div
                  className="text-xs uppercase mb-2 font-semibold"
                  style={{ color: COLORS.lightPurple }}
                >
                  Time Remaining
                </div>
                <div
                  className={`text-6xl font-bold ${activeTimer.secondsLeft <= 10 ? 'animate-pulse' : ''}`}
                  style={{ color: activeTimer.secondsLeft <= 10 ? '#ef4444' : COLORS.goldenTan }}
                >
                  {formatTime(activeTimer.secondsLeft)}
                </div>
                {activeTimer.secondsLeft <= 10 && (
                  <div className="mt-2 text-sm" style={{ color: '#ef4444' }}>
                    ⚠️ Timer about to expire!
                  </div>
                )}

                {/* Timer Adjustment Controls */}
                <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${COLORS.richPurple}40` }}>
                  <label
                    className="text-xs uppercase font-semibold block mb-3"
                    style={{ color: COLORS.lightPurple }}
                  >
                    Adjust Timer
                  </label>
                  <div className="flex gap-2 items-center justify-center">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="MM"
                      value={timerAdjust.minutes}
                      onChange={(e) => updateTimerAdjustMinutes(e.target.value)}
                      className="w-20 px-3 py-2 rounded-md text-sm font-semibold text-center"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderColor: COLORS.richPurple,
                        color: COLORS.warmCream,
                        border: '1px solid'
                      }}
                    />
                    <span className="text-lg font-bold" style={{ color: COLORS.warmCream }}>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="SS"
                      value={timerAdjust.seconds}
                      onChange={(e) => updateTimerAdjustSeconds(e.target.value)}
                      className="w-20 px-3 py-2 rounded-md text-sm font-semibold text-center"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderColor: COLORS.richPurple,
                        color: COLORS.warmCream,
                        border: '1px solid'
                      }}
                    />
                    <button
                      onClick={adjustTimer}
                      className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: COLORS.richPurple,
                        color: COLORS.warmCream
                      }}
                    >
                      Update Timer
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <div
                  className="text-xs uppercase mb-2 font-semibold"
                  style={{ color: COLORS.lightPurple }}
                >
                  Current Bid
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: COLORS.goldenTan }}
                >
                  {currencyFormatter.format(activeItem.current_bid?.current_price ?? activeItem.min_bid ?? 0)}
                </div>
              </div>
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <div
                  className="text-xs uppercase mb-2 font-semibold"
                  style={{ color: COLORS.lightPurple }}
                >
                  Minimum Bid
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ color: COLORS.warmCream }}
                >
                  {currencyFormatter.format(activeItem.min_bid ?? 0)}
                </div>
              </div>
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <div
                  className="text-xs uppercase mb-2 font-semibold"
                  style={{ color: COLORS.lightPurple }}
                >
                  Bid Increment
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ color: COLORS.warmCream }}
                >
                  {currencyFormatter.format(activeItem.bid_increment ?? 0)}
                </div>
              </div>
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <div
                  className="text-xs uppercase mb-2 font-semibold"
                  style={{ color: COLORS.lightPurple }}
                >
                  Total Bids
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ color: COLORS.warmCream }}
                >
                  {bidHistory.filter(log => log.iid === activeItem.iid).length}
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseActiveItem}
              disabled={busyItem === activeItem.iid}
              className="w-full px-6 py-4 rounded-xl text-base font-bold uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: COLORS.goldenTan,
                color: COLORS.deepPurple
              }}
            >
              {busyItem === activeItem.iid ? 'Closing...' : 'Accept Current Bid & Close Lot'}
            </button>
          </div>
        )}

        {/* Section: Live Chat */}
        <div
          className="rounded-2xl border p-8"
          style={{
            borderColor: `${COLORS.richPurple}40`,
            backgroundColor: '#130a1f'
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: COLORS.warmCream }}>
                Live Auction Chat
              </h2>
              <p className="text-sm" style={{ color: COLORS.lightPurple }}>
                Monitor conversations and engage directly with bidders.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: COLORS.lightPurple }}>
                {isChatFetching ? 'Syncing messages...' : `${chatMessages.length} message${chatMessages.length === 1 ? '' : 's'}`}
              </span>
              <button
                type="button"
                onClick={() => refreshChat()}
                disabled={isChatFetching}
                className="px-3 py-1.5 rounded-md border text-xs font-semibold uppercase tracking-wide transition-all"
                style={{
                  borderColor: `${COLORS.richPurple}60`,
                  color: COLORS.lightPurple,
                  backgroundColor: 'rgba(0,0,0,0.4)'
                }}
              >
                Refresh
              </button>
            </div>
          </div>

          {chatError && (
            <div
              className="mb-4 rounded-lg border-l-4 px-5 py-3 text-xs"
              style={{
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#fca5a5'
              }}
            >
              <strong className="font-semibold">Chat Error:</strong> {chatError.message}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div
                className="rounded-xl border p-4 h-80 overflow-y-auto space-y-3"
                style={{
                  borderColor: `${COLORS.richPurple}30`,
                  backgroundColor: 'rgba(0,0,0,0.35)'
                }}
              >
                {chatMessages.length === 0 && (
                  <div
                    className="h-full flex items-center justify-center text-sm italic"
                    style={{ color: COLORS.lightPurple }}
                  >
                    No chat activity yet.
                  </div>
                )}
                {chatMessages.map((chat) => {
                  const username = chat.sender?.username ?? 'Guest'
                  const initials = username.slice(0, 1).toUpperCase()
                  const isOwnerMessage = ownerId ? chat.uid === ownerId : false
                  return (
                    <div key={chat.chat_id ?? `${chat.sent_at}-${chat.uid}`} className="flex gap-3 items-start">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          border: `1px solid ${COLORS.richPurple}40`,
                          color: COLORS.goldenTan
                        }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: COLORS.warmCream }}>
                            {username}
                          </span>
                          {isOwnerMessage && (
                            <span
                              className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${COLORS.goldenTan}20`,
                                border: `1px solid ${COLORS.goldenTan}60`,
                                color: COLORS.goldenTan
                              }}
                            >
                              Owner
                            </span>
                          )}
                          <span className="text-[10px]" style={{ color: `${COLORS.lightPurple}B3` }}>
                            {formatChatTimestamp(chat.sent_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: COLORS.lightPurple }}>
                          {chat.message}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatMessagesEndRef} />
              </div>
            </div>

            <div
              className="rounded-xl border p-4 flex flex-col gap-4"
              style={{
                borderColor: `${COLORS.richPurple}30`,
                backgroundColor: 'rgba(0,0,0,0.35)'
              }}
            >
              <form className="flex flex-col gap-3" onSubmit={handleChatSubmit}>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase font-semibold" style={{ color: COLORS.lightPurple }}>
                    Send Message
                  </label>
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    rows={4}
                    placeholder="Share updates or engage with bidders..."
                    className="w-full resize-none rounded-lg px-3 py-2 text-sm"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.45)',
                      border: `1px solid ${COLORS.richPurple}40`,
                      color: COLORS.warmCream
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingChat || !chatInput.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: COLORS.richPurple,
                    color: COLORS.warmCream
                  }}
                >
                  {isSendingChat ? 'Sending...' : 'Send Message'}
                </button>
              </form>
              {chatFeedback && (
                <p className="text-xs" style={{ color: COLORS.lightPurple }}>
                  {chatFeedback}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Bid Activity Logs */}
        <div
          className="rounded-2xl border p-8"
          style={{
            borderColor: `${COLORS.richPurple}40`,
            backgroundColor: '#130a1f'
          }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: COLORS.warmCream }}
          >
            Live Bid Activity
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {bidHistory.length > 0 ? (
              bidHistory.map((log, idx) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    backgroundColor: idx === 0 ? `${COLORS.richPurple}20` : 'rgba(0,0,0,0.3)',
                    borderLeft: idx === 0 ? `4px solid ${COLORS.goldenTan}` : '4px solid transparent'
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                      style={{
                        backgroundColor: COLORS.lightPurple,
                        color: COLORS.deepPurple
                      }}
                    >
                      {log.username[0]?.toUpperCase() ?? 'B'}
                    </div>
                    <div className="flex-1">
                      <div
                        className="font-bold text-base mb-1"
                        style={{ color: COLORS.warmCream }}
                      >
                        <span className="font-semibold">{log.username}</span> has bid{' '}
                        <span style={{ color: COLORS.goldenTan }}>{currencyFormatter.format(log.amount)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs"
                          style={{ color: COLORS.lightPurple }}
                        >
                          {log.itemTitle}
                        </span>
                        <span className="text-xs" style={{ color: `${COLORS.lightPurple}80` }}>•</span>
                        <span
                          className="text-xs"
                          style={{ color: COLORS.lightPurple }}
                        >
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="text-center py-12 rounded-xl"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <p
                  className="text-lg"
                  style={{ color: COLORS.lightPurple }}
                >
                  No bids yet. Waiting for bidders...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div
            className="rounded-2xl border-2 p-8 max-w-md w-full"
            style={{
              borderColor: COLORS.richPurple,
              backgroundColor: '#130a1f',
              boxShadow: `0 0 60px ${COLORS.richPurple}60`
            }}
          >
            <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.warmCream }}>
              {confirmModal.title}
            </h3>

            <p className="text-base mb-6" style={{ color: COLORS.lightPurple }}>
              {confirmModal.description ? (
                confirmModal.description
              ) : (
                <>
                  Activating the next item will automatically{' '}
                  <span className="font-bold" style={{ color: COLORS.goldenTan }}>{confirmModal.action}</span>{' '}
                  the previous item.
                </>
              )}
            </p>

            {confirmModal.currentItem && (
              <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: `1px solid ${COLORS.richPurple}40` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-semibold" style={{ color: COLORS.lightPurple }}>
                    {confirmModal.contextLabel ?? 'Current Item'}
                  </span>
                </div>
                <p className="font-bold text-lg mb-2" style={{ color: COLORS.warmCream }}>&ldquo;{confirmModal.currentItem}&rdquo;</p>
                {confirmModal.status && (
                  <p className="text-sm" style={{ color: confirmModal.action === 'SOLD' ? COLORS.goldenTan : '#999' }}>
                    {confirmModal.status}
                  </p>
                )}
              </div>
            )}

            <p className="text-sm mb-6" style={{ color: COLORS.lightPurple }}>
              Do you want to continue?
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmModal.onCancel}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all hover:opacity-80"
                style={{
                  backgroundColor: '#444',
                  color: COLORS.warmCream
                }}
              >
                {confirmModal.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90"
                style={{
                  backgroundColor: COLORS.goldenTan,
                  color: COLORS.deepPurple
                }}
              >
                {confirmModal.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
