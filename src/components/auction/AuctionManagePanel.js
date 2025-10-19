'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

import { useAuctionLive } from '@/hooks/useAuctionLive'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

// New color palette constants
const COLORS = {
  deepPurple: '#4D067B',
  richPurple: '#7209B7',
  lightPurple: '#B984DB',
  warmCream: '#F8E2D4',
  goldenTan: '#E2BD6B'
}

export default function AuctionManagePanel({ aid, initialLiveData }) {
  const { snapshot, isFetching, refresh } = useAuctionLive(aid, initialLiveData)
  const [busyItem, setBusyItem] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Timer state
  const [activeTimer, setActiveTimer] = useState(null) // { iid, secondsLeft, isRunning }
  const [timerAdjust, setTimerAdjust] = useState({ minutes: '', seconds: '' })
  const timerIntervalRef = useRef(null)

  const items = useMemo(() => snapshot?.items ?? [], [snapshot?.items])
  const activeItemId = snapshot?.activeItem?.iid ?? null
  const activeItem = items.find(item => item.iid === activeItemId)
  const defaultTimeInterval = snapshot?.auction?.time_interval ?? 300 // Default 5 minutes

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

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

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

  // Close item sale function
  const closeItemSale = useCallback(async (iid, isAutoClose = false) => {
    if (!isAutoClose) {
      if (!window.confirm('Are you sure you want to close this lot and finalize the sale to the highest bidder?')) {
        return
      }
    }

    setBusyItem(iid)
    setError(null)
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

      setSuccess(`Item sold successfully for ${currencyFormatter.format(result.record.final_price)}!`)
      setTimeout(() => setSuccess(null), 5000)

      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyItem(null)
    }
  }, [aid, refresh])

  // Timer countdown logic
  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer.secondsLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setActiveTimer(prev => {
          if (!prev || prev.secondsLeft <= 0) {
            return prev
          }

          const newSecondsLeft = prev.secondsLeft - 1

          // Auto-close when timer hits 0 if item is still active
          if (newSecondsLeft <= 0) {
            // Check if item has bids before auto-closing
            const itemBids = bidHistory.filter(bid => bid.iid === prev.iid)
            if (itemBids.length > 0) {
              closeItemSale(prev.iid, true) // true = auto-close
            }
            return { ...prev, secondsLeft: 0, isRunning: false }
          }

          return { ...prev, secondsLeft: newSecondsLeft }
        })
      }, 1000)

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
      }
    }
  }, [activeTimer?.isRunning, activeTimer?.secondsLeft, bidHistory, closeItemSale])

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
  }

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
        <div className="flex items-center justify-between mb-2">
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
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: COLORS.richPurple }} />
            <span className="text-sm font-semibold" style={{ color: COLORS.goldenTan }}>
              LIVE
            </span>
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
                          backgroundColor: '#666',
                          color: '#fff'
                        }}
                      >
                        SOLD
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
                      disabled={busyItem === item.iid || isActive || isSold}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isSold ? '#666' : isActive ? `${COLORS.richPurple}80` : COLORS.goldenTan,
                        color: isSold ? '#ccc' : isActive ? COLORS.warmCream : COLORS.deepPurple
                      }}
                    >
                      {busyItem === item.iid ? 'Activating...' : isSold ? 'Sold' : isActive ? 'Active Now' : 'Make Active'}
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
              onClick={() => closeItemSale(activeItem.iid)}
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
    </div>
  )
}
