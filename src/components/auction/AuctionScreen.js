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

function StageAuctionCard({ lotData, onClick, isModal = false }) {
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

  const cardWidth = isModal ? 'min(960px, 95vw)' : '820px'
  const cardHeight = isModal ? 'min(560px, 85vh)' : '460px'

  return (
    <div
      onClick={onClick}
      style={{
        width: cardWidth,
        height: cardHeight,
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

function ModalAuctionCard({ lotData, onClick, onClose }) {
  return (
    <div className="relative" onClick={onClick}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose?.()
        }}
        className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--custom-bg-secondary)] text-[var(--custom-text-primary)] shadow-lg transition hover:bg-[var(--custom-bg-tertiary)]"
      >
        <span className="sr-only">Close modal</span>
        ✕
      </button>
      <StageAuctionCard lotData={lotData} onClick={onClick} isModal />
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
