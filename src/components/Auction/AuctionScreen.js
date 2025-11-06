'use client'

import { useContext, useMemo, createContext } from 'react'
import Image from 'next/image'
import { Html } from '@react-three/drei'

export const ModalContext = createContext()
const PLACEHOLDER_IMAGE = '/images/auction-placeholder.jpg'

// New color palette constants
const COLORS = {
  deepPurple: '#4D067B',
  richPurple: '#7209B7',
  lightPurple: '#B984DB',
  warmCream: '#F8E2D4',
  goldenTan: '#E2BD6B'
}

const formatNumber = (value) => {
  if (value === undefined || value === null) return '--'
  return Number(value).toLocaleString()
}

const pad = (value) => String(Math.max(0, Math.floor(value))).padStart(2, '0')

export const buildScreenLot = (currentLot = {}, nextItem = null, itemTimerSeconds = null) => {
  const isAwaitingStart = currentLot?.status === 'awaiting_start'
  const isAuctionComplete = currentLot?.status === 'completed'
  const awaitingMessage =
    currentLot?.awaitingMessage ?? 'Please stay seated - the auctioneer will open the first lot shortly.'
  const previewItem = isAwaitingStart
    ? currentLot?.previewItem ?? nextItem
    : currentLot?.activeItem ?? null

  let lotLabel
  if (isAuctionComplete) {
    lotLabel = 'Auction Complete'
  } else if (isAwaitingStart) {
    lotLabel = 'Awaiting First Lot'
  } else if (currentLot?.id) {
    lotLabel = `Lot #${currentLot.id}`
  } else {
    lotLabel = 'Lot TBD'
  }

  const resolvedImage =
    currentLot?.imageUrl ??
    previewItem?.imageUrl ??
    currentLot?.activeItem?.imageUrl ??
    PLACEHOLDER_IMAGE

  const bidIncrementSource = isAwaitingStart
    ? previewItem?.bid_increment ?? currentLot?.bidIncrement
    : currentLot?.bidIncrement
  const bidIncrement = Number.isFinite(Number(bidIncrementSource))
    ? Number(bidIncrementSource)
    : 0.01

  const baseMinBid = isAwaitingStart
    ? previewItem?.min_bid ?? currentLot?.minBid ?? 0
    : currentLot?.minBid ?? currentLot?.min_bid ?? 0
  const currentBidValue = isAwaitingStart
    ? Number(baseMinBid)
    : Number(currentLot?.currentBid ?? currentLot?.displayPriceValue ?? 0)

  let priceLabel
  let priceValue
  let minBidLabel
  let minBidValue
  let biddersLabel

  if (isAuctionComplete) {
    priceLabel = 'Status'
    priceValue = 'Closed'
    minBidLabel = 'Finale'
    minBidValue = 'All lots concluded'
    biddersLabel = 'Auction has ended'
  } else {
    priceLabel = isAwaitingStart ? 'Starting Bid' : 'Current Bid'
    priceValue = formatNumber(currentBidValue)
    minBidLabel = isAwaitingStart ? 'Opening Bid' : 'Minimum Bid'
    minBidValue = formatNumber(baseMinBid)
    biddersLabel = isAwaitingStart
      ? 'Host preparing the auction'
      : `${formatNumber(currentLot?.bidders)} active bidders`
  }

  const itemTimerDisplay = !isAwaitingStart && !isAuctionComplete && itemTimerSeconds !== null
    ? `${pad(Math.floor(itemTimerSeconds / 60))}:${pad(itemTimerSeconds % 60)}`
    : null

  const timeRemaining = isAuctionComplete
    ? 'Auction closed'
    : isAwaitingStart
      ? 'Awaiting host'
      : currentLot?.timeRemaining ?? '--:--:--'

  const resolvedNextItem = isAwaitingStart ? currentLot?.nextItem ?? null : nextItem
  let nextLotTitle
  let hasFollowingLot = false

  if (isAuctionComplete) {
    nextLotTitle = null
    hasFollowingLot = false
  } else if (isAwaitingStart) {
    nextLotTitle = resolvedNextItem?.title ?? null
    hasFollowingLot = Boolean(resolvedNextItem)
  } else if (currentLot?.hasNextLot) {
    nextLotTitle = resolvedNextItem?.title ?? 'Preview coming soon'
    hasFollowingLot = true
  } else {
    nextLotTitle = 'End Of Auction'
    hasFollowingLot = true
  }

  const nextLotImage = resolvedNextItem?.imageUrl ?? null
  const nextBidMinimum = isAwaitingStart
    ? Number(baseMinBid) + bidIncrement
    : currentLot?.nextBidMinimum ?? currentBidValue + bidIncrement

  const previewOpeningBid = formatNumber(Number(baseMinBid))
  const previewBidIncrement = formatNumber(Number(bidIncrement))
  const previewTitle = previewItem?.title ?? null
  const previewImage = previewItem?.imageUrl ?? PLACEHOLDER_IMAGE

  return {
    lotLabel,
    auctionName: currentLot?.auctionName || 'Grand Evening Sale',
    imageUrl: resolvedImage,
    timeRemaining,
    itemTimer: itemTimerDisplay,
    priceLabel,
    priceValue,
    minBidLabel,
    minBidValue,
    biddersLabel,
    title: isAuctionComplete
      ? 'No items left'
      : isAwaitingStart
        ? awaitingMessage
        : currentLot?.name ?? 'Upcoming lot',
    nextLotTitle,
    nextLotImage,
    currentBidRaw: currentBidValue,
    timeRemainingRaw: timeRemaining,
    bidIncrement,
    nextBidMinimum,
    isAwaitingStart,
    isAuctionComplete,
    awaitingMessage,
    previewTitle,
    previewImage,
    previewOpeningBid,
    previewBidIncrement,
    hasFollowingLot,
    hasNextLot: currentLot?.hasNextLot ?? false
  }
}

function StageAuctionCard({ lotData, onClick }) {
  if (lotData.isAuctionComplete) {
    const { auctionName, lotLabel } = lotData
    return (
      <div
        onClick={onClick}
        className="w-[820px] h-[460px] bg-black/90 border-2 rounded-[18px] p-[24px] font-sans text-slate-100 flex flex-col gap-6 cursor-pointer pointer-events-auto select-none items-center justify-center text-center"
        style={{
          borderColor: `${COLORS.richPurple}40`,
          boxShadow: `0 25px 60px ${COLORS.richPurple}30`
        }}
      >
        <div>
          <span className="text-xs tracking-[0.18em] uppercase block mb-3" style={{ color: COLORS.richPurple }}>
            {lotLabel}
          </span>
          <h2 className="text-[26px] font-bold mb-2" style={{ color: COLORS.warmCream }}>
            {auctionName}
          </h2>
          <p className="text-lg mb-0" style={{ color: COLORS.lightPurple }}>
            No items left to auction. Thank you for joining us!
          </p>
        </div>
      </div>
    )
  }

  if (lotData.isAwaitingStart) {
    const {
      auctionName,
      awaitingMessage,
      previewTitle,
      previewImage,
      previewOpeningBid,
      previewBidIncrement,
      nextLotTitle,
      nextLotImage,
      lotLabel
    } = lotData

    return (
      <div
        onClick={onClick}
        className="w-[820px] h-[460px] bg-black/90 border-2 rounded-[18px] p-[18px] font-sans text-slate-100 flex flex-col gap-4 cursor-pointer pointer-events-auto select-none"
        style={{
          borderColor: `${COLORS.richPurple}40`,
          boxShadow: `0 25px 60px ${COLORS.richPurple}30`
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs tracking-[0.18em] uppercase animate-pulse" style={{ color: COLORS.richPurple }}>
              {lotLabel}
            </span>
            <h2 className="m-0 text-[22px] font-bold" style={{ color: COLORS.warmCream }}>{auctionName}</h2>
            <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: COLORS.lightPurple }}>
              Preparing to go live
            </span>
          </div>
          <div className="rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.12em] flex items-center gap-1.5 border" style={{
            backgroundColor: `${COLORS.richPurple}20`,
            color: COLORS.richPurple,
            borderColor: `${COLORS.richPurple}30`
          }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: COLORS.richPurple }} />
            Awaiting host
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0 items-stretch">
          <div className="flex-[1.05] flex flex-col justify-center gap-5">
            <p className="text-lg leading-relaxed" style={{ color: COLORS.warmCream }}>
              {awaitingMessage}
            </p>
            {previewTitle && (
              <div
                className="rounded-[14px] p-4 border"
                style={{
                  backgroundColor: `${COLORS.deepPurple}80`,
                  borderColor: `${COLORS.richPurple}40`
                }}
              >
                <span className="text-[11px] uppercase" style={{ color: COLORS.lightPurple }}>Opening Lot Preview</span>
                <p className="mt-1 mb-2 text-lg font-semibold" style={{ color: COLORS.warmCream }}>{previewTitle}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs" style={{ color: COLORS.lightPurple }}>
                  <span>Opening bid: ${previewOpeningBid}</span>
                  <span>Bid increment: ${previewBidIncrement}</span>
                </div>
              </div>
            )}
          </div>
          <div
            className="flex-[1.1] rounded-[14px] overflow-hidden border flex items-center justify-center bg-black/80"
            style={{ borderColor: `${COLORS.richPurple}25` }}
          >
            <Image
              src={previewImage}
              alt={previewTitle ?? 'Opening lot preview'}
              width={420}
              height={260}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {lotData.hasFollowingLot && nextLotTitle && (
          <div className="flex items-center gap-3 rounded-xl p-3 border border-dashed" style={{
            backgroundColor: `${COLORS.deepPurple}95`,
            borderColor: `${COLORS.richPurple}30`
          }}>
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/60 flex-shrink-0 border" style={{ borderColor: `${COLORS.richPurple}20` }}>
              <Image
                src={nextLotImage}
                alt="Following lot preview"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[11px] uppercase" style={{ color: COLORS.lightPurple }}>Following Lot</span>
              <span className="text-sm font-semibold" style={{ color: COLORS.warmCream }}>{nextLotTitle}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const {
    auctionName,
    lotLabel,
    imageUrl,
    title,
    priceLabel,
    priceValue,
    minBidLabel,
    minBidValue,
    nextBidMinimum,
    timeRemaining,
    itemTimer,
    biddersLabel,
    nextLotTitle,
    nextLotImage
  } = lotData

  return (
    <div
      onClick={onClick}
      className="w-[820px] h-[460px] bg-black/90 border-2 rounded-[18px] p-[18px] font-sans text-slate-100 flex flex-col gap-3 cursor-pointer pointer-events-auto select-none"
      style={{
        borderColor: `${COLORS.richPurple}40`,
        boxShadow: `0 25px 60px ${COLORS.richPurple}30`
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs tracking-[0.18em] uppercase animate-pulse" style={{ color: COLORS.richPurple }}>
            Live Auction
          </span>
          <h2 className="m-0 text-[22px] font-bold" style={{ color: COLORS.warmCream }}>{auctionName}</h2>
          <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: COLORS.lightPurple }}>
            {lotLabel}
          </span>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        <div className="flex-[1.08] rounded-[14px] overflow-hidden relative bg-black/80 min-h-0 border" style={{ borderColor: `${COLORS.richPurple}20` }}>
          <Image
            src={imageUrl}
            alt={title}
            width={420}
            height={260}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 px-3.5 py-2.5 bg-gradient-to-t from-black via-black/90 to-transparent">
            <span className="text-[11px] tracking-[0.18em] uppercase block" style={{ color: COLORS.lightPurple }}>
              {lotLabel}
            </span>
            <p className="mt-1 mb-0 text-lg font-semibold" style={{ color: COLORS.warmCream }}>{title}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2.5 min-h-0">
          <div className="rounded-[14px] p-3.5 flex flex-col gap-1.5 border" style={{
            backgroundColor: `${COLORS.deepPurple}95`,
            borderColor: `${COLORS.richPurple}30`,
            boxShadow: `0 0 20px ${COLORS.richPurple}20`
          }}>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase" style={{ color: COLORS.lightPurple }}>{priceLabel}</span>
              <span className="text-[26px] font-bold" style={{ color: COLORS.goldenTan }}>${priceValue}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: COLORS.lightPurple }}>
              <span>{minBidLabel}</span>
              <span>${minBidValue}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: COLORS.lightPurple }}>
              <span>Next Required Bid</span>
              <span>${formatNumber(nextBidMinimum)}</span>
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-2.5 bg-black/80 rounded-[14px] p-3 border`} style={{ borderColor: `${COLORS.richPurple}20` }}>
            {itemTimer && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase" style={{ color: COLORS.lightPurple }}>Item Timer</span>
                <span className="text-base font-semibold" style={{ color: COLORS.goldenTan }}>{itemTimer}</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase" style={{ color: COLORS.lightPurple }}>Bidders</span>
              <span className="text-base font-semibold" style={{ color: COLORS.warmCream }}>{biddersLabel}</span>
            </div>
          </div>

          <div
            className={`rounded-xl p-2.5 border border-dashed flex ${nextLotImage ? 'gap-2.5 items-center' : 'items-center'}`}
            style={{
            backgroundColor: `${COLORS.deepPurple}95`,
            borderColor: `${COLORS.richPurple}30`
          }}
          >
            {nextLotImage ? (
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/60 flex-shrink-0 border" style={{ borderColor: `${COLORS.richPurple}20` }}>
                <Image
                  src={nextLotImage}
                  alt={nextLotTitle ?? 'Upcoming lot preview'}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              null
            )}
            <div className={`flex flex-col justify-center ${nextLotImage ? '' : 'pl-1'}`}>
              <span className="text-[11px] uppercase" style={{ color: COLORS.lightPurple }}>Next Up</span>
              <span className="text-sm font-semibold" style={{ color: COLORS.warmCream }}>{nextLotTitle}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalAuctionCard({ lotData, onClose }) {
  if (lotData.isAuctionComplete) {
    const { auctionName, lotLabel } = lotData
    return (
      <div className="relative w-full max-w-4xl mx-auto bg-black/95 border-2 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col items-center justify-center text-center gap-6 p-10" style={{
        borderColor: `${COLORS.richPurple}50`,
        boxShadow: `0 0 80px ${COLORS.richPurple}60`
      }}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onClose?.()
          }}
          className="absolute top-4 right-4 z-10"
          aria-label="Close preview"
        >
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border text-[15px] font-semibold"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderColor: `${COLORS.richPurple}50`,
              color: COLORS.lightPurple
            }}
          >
            ×
          </span>
        </button>
        <span className="text-xs tracking-[0.2em] uppercase" style={{ color: COLORS.richPurple }}>
          {lotLabel}
        </span>
        <h3 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.warmCream }}>
          {auctionName}
        </h3>
        <p className="text-lg md:text-xl max-w-2xl" style={{ color: COLORS.lightPurple }}>
          No items left to auction. Thank you for joining us!
        </p>
      </div>
    )
  }

  if (lotData.isAwaitingStart) {
    const {
      auctionName,
      awaitingMessage,
      previewTitle,
      previewImage,
      previewOpeningBid,
      previewBidIncrement,
      nextLotTitle,
      nextLotImage,
      lotLabel
    } = lotData

    return (
      <div className="relative w-full max-w-6xl mx-auto bg-black/95 border-2 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{
        borderColor: `${COLORS.richPurple}50`,
        boxShadow: `0 0 80px ${COLORS.richPurple}60`
      }}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onClose?.()
          }}
          className="absolute top-4 right-4 z-10"
          aria-label="Close preview"
        >
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border text-[15px] font-semibold"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderColor: `${COLORS.richPurple}50`,
              color: COLORS.lightPurple
            }}
          >
            ×
          </span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col gap-4 justify-center">
            <div>
              <span className="text-xs uppercase tracking-[0.2em]" style={{ color: COLORS.richPurple }}>
                {lotLabel}
              </span>
              <h3 className="text-2xl md:text-3xl font-bold mt-2 mb-3" style={{ color: COLORS.warmCream }}>
                {auctionName}
              </h3>
              <p className="text-base md:text-lg leading-relaxed" style={{ color: COLORS.lightPurple }}>
                {awaitingMessage}
              </p>
            </div>

            {previewTitle && (
              <div
                className="rounded-2xl p-5 border"
                style={{
                  backgroundColor: `${COLORS.deepPurple}85`,
                  borderColor: `${COLORS.richPurple}40`
                }}
              >
                <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: COLORS.lightPurple }}>
                  Opening Lot Preview
                </span>
                <p className="text-xl font-semibold mt-2 mb-3" style={{ color: COLORS.warmCream }}>
                  {previewTitle}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm" style={{ color: COLORS.lightPurple }}>
                  <span>Opening bid: ${previewOpeningBid}</span>
                  <span>Bid increment: ${previewBidIncrement}</span>
                </div>
              </div>
            )}

        {lotData.hasFollowingLot && nextLotTitle && (
              <div
                className="flex items-center gap-3 rounded-xl p-3 border border-dashed"
                style={{
                  backgroundColor: `${COLORS.deepPurple}70`,
                  borderColor: `${COLORS.richPurple}30`
                }}
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/60 flex-shrink-0 border" style={{ borderColor: `${COLORS.richPurple}20` }}>
                  <Image
                    src={nextLotImage}
                    alt="Following lot preview"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[11px] uppercase" style={{ color: COLORS.lightPurple }}>Following Lot</span>
                  <p className="text-sm font-semibold mt-1 mb-0" style={{ color: COLORS.warmCream }}>
                    {nextLotTitle}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="relative min-h-[320px] md:min-h-full">
            <Image
              src={previewImage}
              alt={previewTitle ?? 'Opening lot artwork'}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    )
  }

  const {
    auctionName,
    lotLabel,
    imageUrl,
    title,
    priceLabel,
    priceValue,
    minBidLabel,
    minBidValue,
    nextBidMinimum,
    timeRemaining,
    itemTimer,
    biddersLabel,
    nextLotTitle,
    nextLotImage
  } = lotData

  return (
    <div className="relative w-full max-w-6xl mx-auto bg-black/95 border-2 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{
      borderColor: `${COLORS.richPurple}50`,
      boxShadow: `0 0 80px ${COLORS.richPurple}60`
    }}>
      {/* Close Button Inside Card */}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose?.()
        }}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-all border"
        style={{
          backgroundColor: `${COLORS.richPurple}30`,
          color: COLORS.warmCream,
          borderColor: `${COLORS.richPurple}60`
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = `${COLORS.richPurple}50`}
        onMouseLeave={(e) => e.target.style.backgroundColor = `${COLORS.richPurple}30`}
      >
        <span className="text-xl leading-none">✕</span>
      </button>

      <div className="p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header - Added padding-right to prevent overlap with close button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 md:mb-6 pr-12">
          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-[0.18em] uppercase animate-pulse" style={{ color: COLORS.richPurple }}>Live Auction</span>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: COLORS.warmCream }}>{auctionName}</h2>
            <span className="text-xs tracking-[0.12em] uppercase" style={{ color: COLORS.lightPurple }}>{lotLabel}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Left: Main Image */}
          <div className="flex-1 lg:flex-[1.2] rounded-xl md:rounded-2xl overflow-hidden relative bg-black/80 min-h-[250px] md:min-h-[320px] border" style={{ borderColor: `${COLORS.richPurple}30` }}>
            <Image
              src={imageUrl}
              alt={title}
              width={600}
              height={400}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
              <span className="text-xs tracking-[0.18em] uppercase block mb-1" style={{ color: COLORS.lightPurple }}>{lotLabel}</span>
              <p className="text-base md:text-lg font-semibold" style={{ color: COLORS.warmCream }}>{title}</p>
            </div>
          </div>

          {/* Right: Bid Info */}
          <div className="flex-1 flex flex-col gap-3 md:gap-4">
            {/* Current Bid */}
            <div className="rounded-xl md:rounded-2xl p-4 md:p-5 border" style={{
              backgroundColor: `${COLORS.deepPurple}95`,
              borderColor: `${COLORS.richPurple}40`,
              boxShadow: `0 0 30px ${COLORS.richPurple}30`
            }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs md:text-sm uppercase" style={{ color: COLORS.lightPurple }}>{priceLabel}</span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: COLORS.goldenTan }}>${priceValue}</span>
              </div>
              <div className="space-y-2 text-xs md:text-sm" style={{ color: COLORS.lightPurple }}>
                <div className="flex justify-between">
                  <span>{minBidLabel}</span>
                  <span>${minBidValue}</span>
                </div>
                <div className="flex justify-between">
                  <span>Next Required Bid</span>
                  <span>${formatNumber(nextBidMinimum)}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className={`grid grid-cols-2 gap-3 md:gap-4 bg-black/80 rounded-xl md:rounded-2xl p-4 md:p-5 border`} style={{ borderColor: `${COLORS.richPurple}30` }}>
              {itemTimer && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] md:text-xs uppercase" style={{ color: COLORS.lightPurple }}>Item Timer</span>
                  <span className="text-sm md:text-base lg:text-lg font-semibold" style={{ color: COLORS.goldenTan }}>{itemTimer}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] md:text-xs uppercase" style={{ color: COLORS.lightPurple }}>Bidders</span>
                <span className="text-sm md:text-base lg:text-lg font-semibold" style={{ color: COLORS.warmCream }}>{biddersLabel}</span>
              </div>
            </div>

            {/* Next Lot Preview */}
            <div
              className={`rounded-xl md:rounded-2xl p-3 md:p-4 border border-dashed flex ${nextLotImage ? 'gap-3 items-center' : 'items-center'}`}
              style={{
              backgroundColor: `${COLORS.deepPurple}95`,
              borderColor: `${COLORS.richPurple}40`
            }}
            >
              {nextLotImage ? (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-black/70 flex-shrink-0 border" style={{ borderColor: `${COLORS.richPurple}30` }}>
                  <Image
                    src={nextLotImage}
                    alt={nextLotTitle ?? 'Upcoming lot preview'}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                null
              )}
              <div className={`flex flex-col justify-center min-w-0 ${nextLotImage ? '' : 'pl-1'}`}>
                <span className="text-[10px] md:text-xs uppercase" style={{ color: COLORS.lightPurple }}>Next Up</span>
                <span className="text-sm md:text-base font-semibold truncate" style={{ color: COLORS.warmCream }}>{nextLotTitle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuctionScreenCard({ lotData, onClick, onClose, variant = 'stage' }) {
  if (variant === 'modal') {
    return <ModalAuctionCard lotData={lotData} onClick={onClick} onClose={onClose} />
  }
  return <StageAuctionCard lotData={lotData} onClick={onClick} />
}

export default function AuctionScreen({ position = [0, 0, 0], scale = [1, 1, 1] }) {
  const modalContext = useContext(ModalContext)
  if (!modalContext) {
    console.error('AuctionScreen must be used within ModalContext.Provider')
  }

  const { setIsModalOpen = () => {}, currentLot = {}, nextItem = null, itemTimerSeconds = null } = modalContext ?? {}

  const lotData = useMemo(() => buildScreenLot(currentLot, nextItem, itemTimerSeconds), [currentLot, nextItem, itemTimerSeconds])

  const handleModalToggle = () => {
    setIsModalOpen((prev) => !prev)
  }

  return (
    <group position={position} scale={scale}>
      <Html transform position={[0, 0, 0.1]}>
        <AuctionScreenCard lotData={lotData} onClick={handleModalToggle} variant="stage" />
      </Html>
    </group>
  )
}
