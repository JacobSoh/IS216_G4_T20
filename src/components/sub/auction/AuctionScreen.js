'use client'

import { useContext, useMemo, createContext } from 'react'
import Image from 'next/image'
import { Html } from '@react-three/drei'

export const ModalContext = createContext()
const PLACEHOLDER_IMAGE = '/images/auction-placeholder.jpg'

const formatNumber = (value) => {
  if (value === undefined || value === null) return '--'
  return Number(value).toLocaleString()
}

export const buildScreenLot = (currentLot = {}, nextItem = null) => {
  const lotLabel = currentLot?.id ? `Lot #${currentLot.id}` : 'Lot TBD'
  const imageUrl = currentLot?.imageUrl ?? currentLot?.activeItem?.imageUrl ?? PLACEHOLDER_IMAGE
  const hasBid = Boolean(currentLot?.hasBid)
  const bidIncrement = Number.isFinite(Number(currentLot?.bidIncrement))
    ? Number(currentLot.bidIncrement)
    : 0.01
  const currentBidValue = Number(currentLot?.currentBid ?? currentLot?.displayPriceValue ?? 0)
  const priceLabel = 'Current Bid'
  const priceValue = formatNumber(currentBidValue)
  const minBidLabel = 'Minimum Bid'
  const minBidValue = formatNumber(currentLot?.minBid ?? currentLot?.min_bid ?? 0)
  const biddersLabel = `${formatNumber(currentLot?.bidders)} active bidders`
  const nextLotTitle = nextItem?.title ?? 'Preview coming soon'
  const nextLotImage = nextItem?.imageUrl ?? PLACEHOLDER_IMAGE

  return {
    lotLabel,
    auctionName: currentLot?.auctionName || 'Grand Evening Sale',
    imageUrl,
    timeRemaining: currentLot?.timeRemaining ?? '--:--:--',
    priceLabel,
    priceValue,
    minBidLabel,
    minBidValue,
    biddersLabel,
    title: currentLot?.name ?? 'Upcoming lot',
    nextLotTitle,
    nextLotImage,
    currentBidRaw: currentBidValue,
    timeRemainingRaw: currentLot?.timeRemaining ?? '--:--:--',
    bidIncrement,
    nextBidMinimum: currentLot?.nextBidMinimum ?? currentBidValue + bidIncrement
  }
}

function StageAuctionCard({ lotData, onClick }) {
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
    biddersLabel,
    nextLotTitle,
    nextLotImage
  } = lotData

  return (
    <div
      onClick={onClick}
      style={{
        width: '820px',
        height: '460px',
        backgroundColor: '#050910',
        border: '2px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '18px',
        padding: '18px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
        cursor: onClick ? 'pointer' : 'default',
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '12px', letterSpacing: '0.18em', color: '#6dd6ff', textTransform: 'uppercase' }}>
            Live Auction
          </span>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{auctionName}</h2>
          <span style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase' }}>
            {lotLabel}
          </span>
        </div>
        <div
          style={{
            background: 'rgba(109, 214, 255, 0.18)',
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '11px',
            color: '#6dd6ff',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#6dd6ff'
            }}
          />
          {timeRemaining} remaining
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0 }}>
        <div
          style={{
            flex: 1.08,
            borderRadius: '14px',
            overflow: 'hidden',
            position: 'relative',
            background: '#0c121f',
            minHeight: 0
          }}
        >
          <Image
            src={imageUrl}
            alt={title}
            width={420}
            height={260}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '10px 14px',
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(5,9,16,0.9) 65%, rgba(5,9,16,1) 100%)'
            }}
          >
            <span style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#9ab6ff', textTransform: 'uppercase' }}>
              {lotLabel}
            </span>
            <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 600 }}>{title}</p>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
          <div
            style={{
              background: 'rgba(15, 24, 39, 0.92)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              border: '1px solid rgba(109, 214, 255, 0.12)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>{priceLabel}</span>
              <span style={{ fontSize: '26px', fontWeight: 700, color: '#fff9af' }}>${priceValue}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ab6ff' }}>
              <span>{minBidLabel}</span>
              <span>${minBidValue}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ab6ff' }}>
              <span>Next Required Bid</span>
              <span>${formatNumber(Number(nextBidMinimum) + Number(priceValue))}</span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '10px',
              background: 'rgba(12, 18, 31, 0.92)',
              borderRadius: '14px',
              padding: '12px',
              border: '1px solid rgba(148, 163, 184, 0.15)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Time Remaining</span>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{timeRemaining}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Bidders</span>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{biddersLabel}</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              background: 'rgba(8, 12, 21, 0.92)',
              borderRadius: '12px',
              padding: '10px',
              border: '1px dashed rgba(148, 163, 184, 0.25)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#111827',
                flexShrink: 0
              }}
            >
              <Image
                src={nextLotImage}
                alt="Upcoming lot preview"
                width={56}
                height={56}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Next Up</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{nextLotTitle}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalAuctionCard({ lotData, onClose }) {
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
    biddersLabel,
    nextLotTitle,
    nextLotImage
  } = lotData

  return (
    <div className="relative w-full max-w-6xl mx-auto bg-[#050910] border-2 border-white/[0.14] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      {/* Close Button Inside Card */}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose?.()
        }}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all border border-white/20"
      >
        <span className="text-xl leading-none">✕</span>
      </button>

      <div className="p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header - Added padding-right to prevent overlap with close button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 md:mb-6 pr-12">
          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-[0.18em] text-[#6dd6ff] uppercase">Live Auction</span>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{auctionName}</h2>
            <span className="text-xs tracking-[0.12em] text-[#94a3b8] uppercase">{lotLabel}</span>
          </div>
          <div className="bg-[#6dd6ff]/[0.18] rounded-full px-3 py-2 text-xs text-[#6dd6ff] uppercase tracking-wider flex items-center gap-2 w-fit flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#6dd6ff]" />
            <span className="whitespace-nowrap">{timeRemaining} remaining</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Left: Main Image */}
          <div className="flex-1 lg:flex-[1.2] rounded-xl md:rounded-2xl overflow-hidden relative bg-[#0c121f] min-h-[250px] md:min-h-[320px]">
            <Image
              src={imageUrl}
              alt={title}
              width={600}
              height={400}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-[#050910] via-[#050910]/90 to-transparent">
              <span className="text-xs tracking-[0.18em] text-[#9ab6ff] uppercase block mb-1">{lotLabel}</span>
              <p className="text-base md:text-lg font-semibold text-white">{title}</p>
            </div>
          </div>

          {/* Right: Bid Info */}
          <div className="flex-1 flex flex-col gap-3 md:gap-4">
            {/* Current Bid */}
            <div className="bg-[#0f1827]/92 rounded-xl md:rounded-2xl p-4 md:p-5 border border-[#6dd6ff]/12">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs md:text-sm text-[#94a3b8] uppercase">{priceLabel}</span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#fff9af]">${priceValue}</span>
              </div>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between text-[#9ab6ff]">
                  <span>{minBidLabel}</span>
                  <span>${minBidValue}</span>
                </div>
                <div className="flex justify-between text-[#9ab6ff]">
                  <span>Next Required Bid</span>
                  <span>${formatNumber(Number(nextBidMinimum) + Number(priceValue))}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 bg-[#0c121f]/92 rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/[0.15]">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] md:text-xs text-[#94a3b8] uppercase">Time Remaining</span>
                <span className="text-sm md:text-base lg:text-lg font-semibold text-white">{timeRemaining}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] md:text-xs text-[#94a3b8] uppercase">Bidders</span>
                <span className="text-sm md:text-base lg:text-lg font-semibold text-white">{biddersLabel}</span>
              </div>
            </div>

            {/* Next Lot Preview */}
            <div className="flex gap-3 items-center bg-[#080c15]/92 rounded-xl md:rounded-2xl p-3 md:p-4 border border-dashed border-white/[0.25]">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-[#111827] flex-shrink-0">
                <Image
                  src={nextLotImage}
                  alt="Upcoming lot preview"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] md:text-xs text-[#94a3b8] uppercase">Next Up</span>
                <span className="text-sm md:text-base font-semibold text-white truncate">{nextLotTitle}</span>
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

  const { setIsModalOpen = () => {}, currentLot = {}, nextItem = null } = modalContext ?? {}

  const lotData = useMemo(() => buildScreenLot(currentLot, nextItem), [currentLot, nextItem])

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
