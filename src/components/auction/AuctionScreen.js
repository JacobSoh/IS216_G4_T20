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
      className="w-[820px] h-[460px] bg-black/90 border-2 border-[#7209B7]/40 rounded-[18px] p-[18px] font-sans text-slate-100 flex flex-col gap-3 shadow-[0_25px_60px_rgba(176,38,255,0.3)] cursor-pointer pointer-events-auto select-none"
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs tracking-[0.18em] text-[#7209B7] uppercase animate-pulse">
            Live Auction
          </span>
          <h2 className="m-0 text-[22px] font-bold text-white">{auctionName}</h2>
          <span className="text-[11px] tracking-[0.12em] text-purple-300 uppercase">
            {lotLabel}
          </span>
        </div>
        <div className="bg-[#7209B7]/20 rounded-full px-3.5 py-1.5 text-[11px] text-[#7209B7] uppercase tracking-[0.12em] flex items-center gap-1.5 border border-[#7209B7]/30">
          <span className="inline-block w-2 h-2 rounded-full bg-[#7209B7] animate-pulse" />
          {timeRemaining} remaining
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        <div className="flex-[1.08] rounded-[14px] overflow-hidden relative bg-black/80 min-h-0 border border-[#7209B7]/20">
          <Image
            src={imageUrl}
            alt={title}
            width={420}
            height={260}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 px-3.5 py-2.5 bg-gradient-to-t from-black via-black/90 to-transparent">
            <span className="text-[11px] tracking-[0.18em] text-purple-300 uppercase block">
              {lotLabel}
            </span>
            <p className="mt-1 mb-0 text-lg font-semibold text-white">{title}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2.5 min-h-0">
          <div className="bg-[#4D067B]/95 rounded-[14px] p-3.5 flex flex-col gap-1.5 border border-[#7209B7]/30 shadow-[0_0_20px_rgba(176,38,255,0.2)]">
            <div className="flex justify-between items-center">
              <span className="text-xs text-purple-300 uppercase">{priceLabel}</span>
              <span className="text-[26px] font-bold text-[#E2BD6B]">${priceValue}</span>
            </div>
            <div className="flex justify-between text-xs text-purple-200">
              <span>{minBidLabel}</span>
              <span>${minBidValue}</span>
            </div>
            <div className="flex justify-between text-xs text-purple-200">
              <span>Next Required Bid</span>
              <span>${formatNumber(Number(nextBidMinimum) + Number(priceValue))}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 bg-black/80 rounded-[14px] p-3 border border-purple-500/20">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-purple-300 uppercase">Time Remaining</span>
              <span className="text-base font-semibold text-white">{timeRemaining}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-purple-300 uppercase">Bidders</span>
              <span className="text-base font-semibold text-white">{biddersLabel}</span>
            </div>
          </div>

          <div className="flex gap-2.5 items-center bg-[#4D067B]/95 rounded-xl p-2.5 border border-dashed border-[#7209B7]/30">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/60 flex-shrink-0 border border-[#7209B7]/20">
              <Image
                src={nextLotImage}
                alt="Upcoming lot preview"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[11px] text-purple-300 uppercase">Next Up</span>
              <span className="text-sm font-semibold text-white">{nextLotTitle}</span>
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
    <div className="relative w-full max-w-6xl mx-auto bg-black/95 border-2 border-[#7209B7]/50 rounded-2xl shadow-[0_0_80px_rgba(176,38,255,0.6)] overflow-hidden max-h-[90vh] flex flex-col">
      {/* Close Button Inside Card */}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose?.()
        }}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#7209B7]/30 backdrop-blur-sm text-white hover:bg-[#7209B7]/50 transition-all border border-[#7209B7]/60"
      >
        <span className="text-xl leading-none">✕</span>
      </button>

      <div className="p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header - Added padding-right to prevent overlap with close button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 md:mb-6 pr-12">
          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-[0.18em] text-[#7209B7] uppercase animate-pulse">Live Auction</span>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{auctionName}</h2>
            <span className="text-xs tracking-[0.12em] text-purple-300 uppercase">{lotLabel}</span>
          </div>
          <div className="bg-[#7209B7]/20 rounded-full px-3 py-2 text-xs text-[#7209B7] uppercase tracking-wider flex items-center gap-2 w-fit flex-shrink-0 border border-[#7209B7]/40">
            <span className="w-2 h-2 rounded-full bg-[#7209B7] animate-pulse" />
            <span className="whitespace-nowrap">{timeRemaining} remaining</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Left: Main Image */}
          <div className="flex-1 lg:flex-[1.2] rounded-xl md:rounded-2xl overflow-hidden relative bg-black/80 min-h-[250px] md:min-h-[320px] border border-[#7209B7]/30">
            <Image
              src={imageUrl}
              alt={title}
              width={600}
              height={400}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
              <span className="text-xs tracking-[0.18em] text-purple-300 uppercase block mb-1">{lotLabel}</span>
              <p className="text-base md:text-lg font-semibold text-white">{title}</p>
            </div>
          </div>

          {/* Right: Bid Info */}
          <div className="flex-1 flex flex-col gap-3 md:gap-4">
            {/* Current Bid */}
            <div className="bg-[#4D067B]/95 rounded-xl md:rounded-2xl p-4 md:p-5 border border-[#7209B7]/40 shadow-[0_0_30px_rgba(176,38,255,0.3)]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs md:text-sm text-purple-300 uppercase">{priceLabel}</span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#E2BD6B]">${priceValue}</span>
              </div>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between text-purple-200">
                  <span>{minBidLabel}</span>
                  <span>${minBidValue}</span>
                </div>
                <div className="flex justify-between text-purple-200">
                  <span>Next Required Bid</span>
                  <span>${formatNumber(Number(nextBidMinimum) + Number(priceValue))}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 bg-black/80 rounded-xl md:rounded-2xl p-4 md:p-5 border border-purple-500/30">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] md:text-xs text-purple-300 uppercase">Time Remaining</span>
                <span className="text-sm md:text-base lg:text-lg font-semibold text-white">{timeRemaining}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] md:text-xs text-purple-300 uppercase">Bidders</span>
                <span className="text-sm md:text-base lg:text-lg font-semibold text-white">{biddersLabel}</span>
              </div>
            </div>

            {/* Next Lot Preview */}
            <div className="flex gap-3 items-center bg-[#4D067B]/95 rounded-xl md:rounded-2xl p-3 md:p-4 border border-dashed border-[#7209B7]/40">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-black/70 flex-shrink-0 border border-[#7209B7]/30">
                <Image
                  src={nextLotImage}
                  alt="Upcoming lot preview"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] md:text-xs text-purple-300 uppercase">Next Up</span>
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
