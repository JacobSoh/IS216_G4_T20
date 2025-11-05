'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { useAuctionLive } from '@/hooks/useAuctionLive'
import { useAuctionChat } from '@/hooks/useAuctionChat'

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from '@/components/ui/field'
import { CustomInput, CustomTextarea } from '@/components/Form'
import { Badge } from '@/components/ui/badge'
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { useModal } from '@/context/ModalContext'

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
  const { setModalHeader, setModalState, setModalForm, setModalFooter } = useModal();
  const { snapshot, isFetching, refresh, setSnapshot: setLiveSnapshot } = useAuctionLive(aid, initialLiveData)
  const [busyItem, setBusyItem] = useState(null)
  const [isClosingItem, setIsClosingItem] = useState(false)
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

  // Helper: open standardized confirmation modal via ModalContext
  const openConfirmModal = useCallback((opts) => {
    const {
      title = 'Confirm',
      description,
      currentItem,
      status,
      action,
      contextLabel,
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      onConfirm,
    } = opts || {};

    const Body = (
      <div>
        {description ? (
          <p className="text-sm text-[var(--theme-secondary)]">{description}</p>
        ) : (
          <p className="text-sm text-[var(--theme-secondary)]">
            Activating the next item will automatically <span className="font-bold text-[var(--theme-gold)]">{action}</span> the previous item.
          </p>
        )}
        {currentItem && (
          <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--theme-secondary)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold text-[var(--theme-secondary)]">{contextLabel ?? 'Current Item'}</span>
            </div>
            <p className="font-bold text-lg mb-2">“{currentItem}”</p>
            {status && (
              <p className="text-sm" style={{ color: action === 'SOLD' ? '#E2BD6B' : '#999' }}>{status}</p>
            )}
          </div>
        )}
        <p className="text-sm mt-4 text-[var(--theme-secondary)]">Do you want to continue?</p>
      </div>
    );

    setModalHeader({ title });
    setModalFooter({ showCancel: true, cancelText: cancelLabel, showSubmit: true, submitText: confirmLabel, submitVariant: 'brand' });
    setModalForm({ isForm: true, onSubmit: async (e) => {
      e?.preventDefault?.();
      try { await onConfirm?.(); } finally { setModalState({ open: false }); }
    }});
    setModalState({ open: true, content: Body });
  }, [setModalHeader, setModalFooter, setModalForm, setModalState]);

  const items = useMemo(() => snapshot?.items ?? [], [snapshot?.items])
  const activeItemId = snapshot?.activeItem?.iid ?? null
  const activeItem = items.find(item => item.iid === activeItemId)
  const defaultTimeInterval = snapshot?.auction?.time_interval ?? 300 // Default 5 minutes
  const ownerId = snapshot?.auction?.oid ?? null

  useEffect(() => {
    const auctionEnded = snapshot?.auction?.auction_end ?? false
    if (auctionEnded) {
      router.replace(`/auction/view/${aid}/ended`)
    }
  }, [snapshot?.auction?.auction_end, router, aid])

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
    setIsClosingItem(true)
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
      setIsClosingItem(false)
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
      openConfirmModal({
        title: '⚠️ Confirm Item Activation',
        currentItem: activeItemTitle,
        status: itemHasBids ? 'Has bids - will be SOLD' : 'No bids - will be CLOSED',
        action,
        description: 'Activating the next lot will automatically finalize the current lot.',
        confirmLabel: 'Confirm',
        onConfirm: async () => {
          // Close the previous item first (don't auto-activate since we're manually activating)
          try {
            setBusyItem(activeItemId)
            await closeItemSale({ iid: activeItemId, shouldActivateNext: false })
          } catch (err) {
            setError(`Failed to close previous item: ${err.message}`)
            setBusyItem(null)
            return
          }
          // Activate new item
          await activateItemInternal(iid, price)
        }
      })
      return
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

    openConfirmModal({
      title: itemHasBids ? 'Finalize Current Lot' : 'Close Current Lot',
      currentItem: activeItem.title || 'Current lot',
      status: itemHasBids ? 'Has bids - will be SOLD' : 'No bids - will be CLOSED',
      action,
      description: itemHasBids
        ? 'Closing this lot will finalize the winning bid and immediately move to the next item.'
        : 'Closing this lot will mark it as closed and continue to the next available item.',
      confirmLabel: itemHasBids ? 'Finalize Sale' : 'Close Lot',
      onConfirm: async () => { await closeItemSale({ iid: activeItemId }) },
    })
  }, [activeItemId, activeItem, closeItemSale, getItemBidCount])

  const requestResetAuction = useCallback(() => {
    const auctionName = snapshot?.auction?.name ?? 'this auction'
    openConfirmModal({
      title: 'Reset Auction',
      currentItem: auctionName,
      status: 'This action cannot be undone.',
      action: 'RESET',
      description: 'Resetting will delete all bid history, clear current bids, remove sale records, and mark every lot as unsold.',
      confirmLabel: 'Reset Auction',
      cancelLabel: 'Keep Data',
      contextLabel: 'Auction',
      onConfirm: async () => {
        setIsResetting(true)
        setError(null)
        try {
          const res = await fetch(`/api/auctions/${aid}/reset`, { method: 'POST' })
          if (!res.ok) {
            const payload = await res.json().catch(() => ({}))
            throw new Error(payload.error ?? 'Unable to reset auction')
          }
          setActiveTimer(null)
          await refresh()
          setLiveSnapshot(prev => (prev ? { ...prev, bidHistory: [] } : prev))
          setChatMessages([])
          setSuccess('Auction reset successfully')
          setTimeout(() => setSuccess(null), 4000)
        } catch (err) {
          setError(err.message)
        } finally {
          setIsResetting(false)
        }
      },
    })
  }, [aid, refresh, router, snapshot?.auction?.name])

  const requestCloseAuction = useCallback(() => {
    const auctionName = snapshot?.auction?.name ?? 'this auction'
    openConfirmModal({
      title: 'Close Auction',
      currentItem: auctionName,
      status: 'This will end bidding immediately.',
      action: 'END',
      description: 'Closing the auction will stop all bidding and mark the event as complete. Make sure all lots are finalized before proceeding.',
      confirmLabel: 'Close Auction',
      cancelLabel: 'Keep Open',
      contextLabel: 'Auction',
      onConfirm: async () => {
        setIsClosingAuction(true)
        setError(null)
        try {
          const res = await fetch(`/api/auctions/${aid}/close`, { method: 'POST' })
          if (!res.ok) {
            const payload = await res.json().catch(() => ({}))
            throw new Error(payload.error ?? 'Unable to close auction')
          }
          setActiveTimer(null)
          router.replace(`/auction/view/${aid}/ended`)
          refresh().catch(() => { })
        } catch (err) {
          setError(err.message)
        } finally {
          setIsClosingAuction(false)
        }
      },
    })
  }, [aid, refresh, router, snapshot?.auction?.name])

  const updateTimerAdjustMinutes = (value) => {
    if (0 <= Number(value) <= 99) setTimerAdjust(prev => ({ ...prev, minutes: value }));
  }

  const updateTimerAdjustSeconds = (value) => {
    if (0 <= Number(value) <= 99) setTimerAdjust(prev => ({ ...prev, seconds: value }));
  }

  return (
    <div className='space-y-12'>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-4xl font-bold mb-2 text-[var(--theme-gold)]"
          >
            Seller Dashboard
          </h1>
          <p
            className="text-base text-[var(--theme-secondary)]"
          >
            {snapshot?.auction?.name ?? 'Untitled Auction'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full animate-pulse bg-[var(--theme-secondary)]" />
            <span className="text-sm font-semibold text-white">
              LIVE
            </span>
          </div>
          <Button
            onClick={requestCloseAuction}
            variant="destructive"
            disabled={isClosingAuction || isFetching}
          >
            {isClosingAuction ? 'Closing...' : 'Close Auction'}
          </Button>
          <Button
            onClick={requestResetAuction}
            variant="brand"
            disabled={isResetting || isFetching}
          >
            {isClosingAuction ? 'Resetting...' : 'Reset Auction'}
          </Button>
          {/* <button
              onClick={requestCloseAuction}
              disabled={isClosingAuction || isFetching}
              className="px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: '#5f1a1a',
                border: '1px solid #ef444499',
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
            </button> */}
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
      <Card variant="default">
        <CardHeader>
          <CardTitle className="font-bold">
            All Auction Lots ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const currentPrice = item.current_bid?.current_price ?? item.min_bid ?? 0
              const isActive = activeItemId === item.iid
              const isSold = item.sold === true
              const itemHasBids = getItemBidCount(item.iid) > 0
              const isNextInSequence = nextItemToActivate?.iid === item.iid
              const canActivate = !isActive && !isSold && isNextInSequence

              return (
                <Card key={item.title + item.description}>
                  <CardHeader>
                    {isSold && (
                      <Badge
                        variant={itemHasBids ? "secondary" : "brand"}
                      >
                        {itemHasBids ? 'SOLD' : 'CLOSED'}
                      </Badge>
                    )}
                    {isActive && !isSold && (
                      <Badge
                        variant="brand_darker"
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full animate-pulse bg-[var(--theme-secondary)]"
                        />
                        Currently Active
                      </Badge>
                    )}
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="text-[var(--theme-secondary)]">
                      <p className='line-clamp-3'>
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs uppercase font-semibold">
                          Current Price
                        </span>
                        <span className='text-xl text-[var(--theme-gold)] font-bold'>
                          {currencyFormatter.format(currentPrice)}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  {isActive && activeTimer && activeTimer.iid === item.iid ? (
                    <>
                      <CardContent className="text-center">
                        <div className="text-xs uppercase mb-1 font-semibold text-white">
                          Time Left
                        </div>
                        <div className={`text-3xl font-bold ${activeTimer.secondsLeft <= 10 ? 'animate-pulse text-destructive' : 'text-[var(--theme-gold)]'}`}>
                          {formatTime(activeTimer.secondsLeft)}
                        </div>
                        <label className="text-xs uppercase font-semibold block mb-2">
                          Adjust Timer
                        </label>
                        <FieldGroup>
                          <div className='flex justify-center items-center gap-3'>
                            <CustomInput
                              type="minutes"
                              min="0"
                              max="99"
                              value={timerAdjust.minutes}
                              onChange={(e) => updateTimerAdjustMinutes(e.target.value)}
                            />
                            <span className="text-sm font-bold" >:</span>
                            <CustomInput
                              type="seconds"
                              min="0"
                              max="59"
                              value={timerAdjust.seconds}
                              onChange={(e) => updateTimerAdjustSeconds(e.target.value)}
                            />
                          </div>
                        </FieldGroup>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={adjustTimer}
                          variant="brand"
                          className="w-full"
                        >
                          Update
                        </Button>
                      </CardFooter>
                    </>
                  ) : (
                    <CardFooter>
                      <Button
                        onClick={() => {
                          if (busyItem !== item.iid) {
                            activateItem(item.iid, currentPrice)
                          }
                        }}
                        variant={(isActive && busyItem !== item.iid) ? "secondary" : "brand"}
                        disabled={isActive || isSold || !canActivate}
                        className="w-full"
                      >
                        {
                          busyItem === item.iid
                            ? (isClosingItem ? 'Closing...' : 'Activating...')
                            : isSold ? (itemHasBids ? 'Sold' : 'Closed')
                              : isActive ? 'Active Now'
                                : canActivate ? 'Make Active' : 'Locked'
                        }
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              );

              return (
                <div
                  key={item.iid}
                  className="rounded-xl p-5 transition-all bg-background ring-1 ring-[var(--theme-primary)]"

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
                      >
                        Currently Active
                      </span>
                    </div>
                  )}

                  <h3 className="font-bold text-lg mb-2 line-clamp-1">
                    {item.title}
                  </h3>
                  <p
                    className="text-sm mb-4 line-clamp-2 text-[var(--theme-secondary)]"
                  >
                    {item.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs uppercase font-semibold text-[var(--theme-secondary)]"
                      >
                        Current Price
                      </span>
                      <span
                        className="text-xl font-bold text-white"
                      >
                        {currencyFormatter.format(currentPrice)}
                      </span>
                    </div>

                    {/* Timer display and controls for active item */}
                    {isActive && activeTimer && activeTimer.iid === item.iid && (
                      <div
                        className="rounded-lg p-3 text-center bg-background ring-2 ring-[var(--theme-primary)]"
                      >
                        <div
                          className="text-xs uppercase mb-1 font-semibold text-white"
                        >
                          Time Left
                        </div>
                        <div
                          className={`text-3xl font-bold ${activeTimer.secondsLeft <= 10 ? 'animate-pulse text-destructive' : 'text-[var(--theme-gold)]'}`}
                        >
                          {formatTime(activeTimer.secondsLeft)}
                        </div>

                        {/* Timer adjustment inputs */}
                        <div className="mt-3 pt-3">
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
                            <span className="text-sm font-bold" >:</span>
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
                          <Button
                            onClick={adjustTimer}
                            variant="brand"
                            className="w-full"
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        if (busyItem !== item.iid) {
                          activateItem(item.iid, currentPrice)
                        }
                      }}
                      variant={(isActive && busyItem !== item.iid) ? "secondary" : "brand"}
                      disabled={isActive || isSold || !canActivate}
                      className="w-full"
                    >
                      {busyItem === item.iid ? (isClosingItem ? 'Closing...' : 'Activating...') : isSold ? (itemHasBids ? 'Sold' : 'Closed') : isActive ? 'Active Now' : canActivate ? 'Make Active' : 'Locked'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Current Active Lot Details with Timer */}
      {activeItem && !activeItem.sold && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>
              <div className='flex items-center gap-3'>
                <span
                  className="inline-block w-4 h-4 rounded-full animate-pulse bg-[var(--theme-secondary)]"
                />
                Currently Active: {activeItem.title}
              </div>
            </CardTitle>
            <CardDescription className="text-[var(--theme-secondary)]">
              {activeItem.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-12">
            {activeTimer && activeTimer.iid === activeItem.iid && (
              <div>
                <div className="text-sm uppercase mb-1 font-semibold text-white">
                  Time Left
                </div>
                <div className={`text-6xl font-bold ${activeTimer.secondsLeft <= 10 ? 'animate-pulse text-destructive' : 'text-[var(--theme-gold)]'}`}>
                  {formatTime(activeTimer.secondsLeft)}
                </div>
                <label className="text-sm uppercase font-semibold block mb-2">
                  Adjust Timer
                </label>
                {activeTimer.secondsLeft <= 10 && (
                  <div>
                    <ExclamationTriangleIcon className='inline-block w-4 h-4 text-orange-400 mr-2' />
                    <span className="text-sm text-destructive">
                      Timer about to expire!
                    </span>
                  </div>
                )}
                <FieldGroup>
                  <div className='flex justify-center items-center gap-3 max-w-md mx-auto'>
                    <CustomInput
                      type="minutes"
                      min="0"
                      max="99"
                      value={timerAdjust.minutes}
                      onChange={(e) => updateTimerAdjustMinutes(e.target.value)}
                    />
                    <span className="text-sm font-bold" >:</span>
                    <CustomInput
                      type="seconds"
                      min="0"
                      max="59"
                      value={timerAdjust.seconds}
                      onChange={(e) => updateTimerAdjustSeconds(e.target.value)}
                    />
                    <Button
                      onClick={adjustTimer}
                      variant="brand"
                    >
                      Update
                    </Button>
                  </div>
                </FieldGroup>
              </div>
            )}
            <div className="grid grid-cols-4 items-center justify-center gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[var(--theme-secondary)] text-lg">
                    Current Bid
                  </CardTitle>
                  <CardDescription className='text-[var(--theme-gold)] text-lg'>
                    {currencyFormatter.format(activeItem.current_bid?.current_price ?? activeItem.min_bid ?? 0)}
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-[var(--theme-secondary)] text-lg">
                    Minimum Bid
                  </CardTitle>
                  <CardDescription className='text-white text-lg'>
                    {currencyFormatter.format(activeItem.min_bid ?? 0)}
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-[var(--theme-secondary)] text-lg">
                    Bid Increment
                  </CardTitle>
                  <CardDescription className='text-white text-lg'>
                    {currencyFormatter.format(activeItem.bid_increment ?? 0)}
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-[var(--theme-secondary)] text-lg">
                    Total Bids
                  </CardTitle>
                  <CardDescription className='text-white text-lg'>
                    {bidHistory.filter(log => log.iid === activeItem.iid).length}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleCloseActiveItem}
              disabled={busyItem === activeItem.iid}
              variant="gold"
              className="w-full"
            >
              {busyItem === activeItem.iid ? 'Closing...' : 'Accept Current Bid & Close Lot'}
            </Button>
          </CardFooter>
        </Card>
      )}
      {/* {activeItem && !activeItem.sold && (
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
                    <span className="text-lg font-bold" >:</span>
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
        )} */}

      {/* Section 3: Live Chat */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Live Auction Chat</CardTitle>
          <CardDescription>
            Monitor conversations and engage directly with bidders.
          </CardDescription>
          <CardAction className="space-x-2">
            <span className="text-[var(--theme-secondary)] text-xs">
              {isChatFetching ? 'Syncing messages...' : `${chatMessages.length} message${chatMessages.length === 1 ? '' : 's'}`}
            </span>
            <Button
              variant='brand'
              onClick={() => refreshChat()}
              disabled={isChatFetching}
            >
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
            <Card className='min-h-80'>
              <CardContent>
                {chatMessages.length === 0 && (
                  <span className="h-full flex items-center justify-center text-sm italic text-[var(--theme-secondary)]" >
                    No chat activity yet.
                  </span>
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
                          <span className="text-sm font-semibold" >
                            {username}
                          </span>
                          {isOwnerMessage && (
                            <Badge
                              variant='brand'
                            >
                              Owner
                            </Badge>
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
              </CardContent>
            </Card>
            <form className="flex flex-col gap-3" onSubmit={handleChatSubmit}>
              <CustomTextarea
                type="manageChatbox"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                required={true}
              />
              <Button
                variant='brand'
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
              >
                {isSendingChat ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      {/* <div
        className="rounded-2xl border p-8"
        style={{
          borderColor: `${COLORS.richPurple}40`,
          backgroundColor: '#130a1f'
        }}
      >
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
      </div> */}

      {/* Section 3: Bid Activity Logs */}
      <Card variant='default'>
        <CardHeader>
          <CardTitle>Live Bid Activity</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 max-h-[500px] overflow-y-auto pr-2'>
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
        </CardContent>
      </Card>
      {/* <div
        className="rounded-2xl border p-8"
        style={{
          borderColor: `${COLORS.richPurple}40`,
          backgroundColor: '#130a1f'
        }}
      >
        <h2
          className="text-2xl font-bold mb-6"

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
      </div> */}

      {/* Confirmation Modal moved to ModalContext standard modal */}
    </div>
  )
}
