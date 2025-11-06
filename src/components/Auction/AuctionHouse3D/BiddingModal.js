'use client'

import { useState, useEffect } from 'react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { supabaseBrowser } from '@/utils/supabase/client'
import { useModal } from '@/context/ModalContext'
import WalletModal from '@/components/wallet/WalletModal'
import getProfile from '@/hooks/getProfile'

export default function BiddingModal({
  isOpen,
  onClose,
  lotBidValue,
  bidIncrementValue,
  bidAmount,
  setBidAmount,
  bidValidationError,
  setBidValidationError,
  nextBidMinimum,
  handleBidSubmit,
  isBidding,
  bidFeedback,
  hasBid,
  status,
  awaitingMessage
}) {
  const [walletBalance, setWalletBalance] = useState(null)
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [userId, setUserId] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const { setModalHeader, setModalState, setModalForm, setModalFooter } = useModal()

  // Fetch initial wallet balance and user ID
  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance()
    }
  }, [isOpen])

  // Set up real-time subscription for wallet balance
  useEffect(() => {
    if (!userId || !isOpen) return

    const sb = supabaseBrowser()

    // Subscribe to profile changes for real-time wallet updates
    const channel = sb
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('💰 Wallet balance updated via real-time:', payload)
          if (payload.new?.wallet_balance !== undefined) {
            setWalletBalance(Number(payload.new.wallet_balance))
          }
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [userId, isOpen])

  const fetchWalletBalance = async () => {
    try {
      setLoadingWallet(true)
      const profile = await getProfile()
      setWalletBalance(Number(profile?.wallet_balance ?? 0))
      setUserId(profile?.id)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
    } finally {
      setLoadingWallet(false)
    }
  }

  const hasInsufficientBalance = () => {
    if (walletBalance === null || !bidAmount) return false
    const amount = Number(bidAmount)
    return !isNaN(amount) && walletBalance < amount
  }

  const handleOpenWalletModal = () => {
    setModalHeader({ title: 'My Wallet' })
    setModalForm({ isForm: false })
    setModalFooter({ showCancel: false, showSubmit: false })
    setModalState({ open: true, content: <WalletModal profile={userProfile} /> })
  }

  if (!isOpen) return null

  // Show awaiting message if auction hasn't started yet
  if (status === 'awaiting_start') {
    return (
      <div className="absolute bottom-20 left-4 md:bottom-24 md:left-6 w-[calc(100vw-2rem)] max-w-sm md:w-96 text-white z-[200]">
        <div className="bg-black/90 p-4 md:p-6 rounded-xl border border-[var(--theme-secondary)]/50 backdrop-blur-sm shadow-[0_0_40px_rgba(176,38,255,0.5)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg md:text-xl font-bold text-[var(--theme-secondary)]">
              ⏳ Auction Starting Soon
            </h3>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
          <div className="bg-[var(--theme-primary)]/90 p-6 rounded-lg border-2 border-[var(--theme-accent)]/40 text-center">
            <p className="text-[var(--theme-cream)] text-base md:text-lg leading-relaxed">
              {awaitingMessage || 'Please stay seated - the auctioneer will open the first lot shortly.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute bottom-20 left-4 md:bottom-24 md:left-6 w-[calc(100vw-2rem)] max-w-sm md:w-96 text-white z-[200]">
      <div className="bg-black/90 p-4 md:p-6 rounded-xl border border-[var(--theme-secondary)]/50 backdrop-blur-sm shadow-[0_0_40px_rgba(176,38,255,0.5)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg md:text-xl font-bold text-[var(--theme-secondary)]">
            🔨 Place Your Bid
          </h3>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Wallet Balance Info */}
          <div className="bg-[var(--theme-primary)]/90 p-4 md:p-5 rounded-lg border-2 border-[var(--theme-accent)]/40">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[var(--theme-accent)] text-xs md:text-sm uppercase tracking-wider mb-2 font-semibold">💰 Wallet Balance</p>
                <p className="text-2xl md:text-3xl font-bold text-[var(--theme-gold)]">
                  {walletBalance !== null ? `$${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                </p>
              </div>
              <button
                onClick={handleOpenWalletModal}
                className="ml-3 px-3 py-2 bg-[var(--theme-gold)]/20 hover:bg-[var(--theme-gold)]/30 border border-[var(--theme-gold)]/50 text-[var(--theme-gold)] font-semibold rounded-lg transition-all duration-200 text-xs md:text-sm whitespace-nowrap"
                title="Top up your wallet"
              >
                + Top Up
              </button>
            </div>
          </div>

          {/* Current Bid Info */}
          <div className="bg-[var(--theme-primary)]/70 p-3 md:p-4 rounded-lg border border-[var(--theme-accent)]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--theme-accent)] text-xs md:text-sm uppercase tracking-wide">Current Bid</p>
                <p className="text-xl md:text-2xl font-bold text-[var(--theme-gold)]">
                  {hasBid ? `$${lotBidValue.toLocaleString()}` : 'No Bids'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[var(--theme-accent)] text-xs md:text-sm uppercase tracking-wide">Min Increment</p>
                <p className="text-lg font-semibold text-[var(--theme-cream)]">${bidIncrementValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Bid Input */}
          <Field>
            <FieldLabel className="text-xs md:text-sm text-[var(--theme-cream)] mb-2 font-medium">
              Your Bid Amount
            </FieldLabel>
            <Input
              type="number"
              inputMode="decimal"
              step={bidIncrementValue}
              value={bidAmount}
              onChange={(event) => {
                setBidAmount(event.target.value)
                // Clear validation error when user types
                if (bidValidationError) {
                  setBidValidationError(null)
                }
              }}
              placeholder={`Min: $${nextBidMinimum.toFixed(2)}`}
              className="bg-[var(--theme-primary)]/50 border-[var(--theme-accent)]/50 text-white placeholder:text-[var(--theme-accent)]/60 focus:border-[var(--theme-secondary)] focus:ring-[var(--theme-secondary)]"
            />
            {bidValidationError && (
              <p className="mt-2 text-[11px] md:text-xs text-red-400 font-medium">
                ⚠️ {bidValidationError}
              </p>
            )}
            {hasInsufficientBalance() && !bidValidationError && (
              <p className="mt-2 text-[11px] md:text-xs text-red-400 font-medium">
                ⚠️ Insufficient wallet balance. Please top up your wallet to place this bid.
              </p>
            )}
            {!bidValidationError && !hasInsufficientBalance() && (
              <p className="mt-2 text-[11px] md:text-xs text-[var(--theme-accent)]">
                💡 Enter in increments of ${bidIncrementValue.toFixed(2)}.
              </p>
            )}
          </Field>

          {/* Place Bid Button */}
          <button
            onClick={handleBidSubmit}
            disabled={isBidding || hasInsufficientBalance()}
            className="w-full py-3 md:py-4 bg-[var(--theme-secondary)] hover:bg-[var(--theme-gold)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 text-sm md:text-base shadow-[0_0_30px_rgba(176,38,255,0.5)] hover:shadow-[0_0_40px_rgba(226,189,107,0.6)] active:scale-95"
          >
            {isBidding ? '⏳ Submitting...' : hasInsufficientBalance() ? '🚫 Insufficient Balance' : '🔨 Place Bid'}
          </button>
          {bidFeedback && (
            <p className="text-xs md:text-sm text-[var(--theme-gold)] font-medium text-center bg-[var(--theme-primary)]/50 py-2 px-3 rounded-lg border border-[var(--theme-gold)]/30">
              ✅ {bidFeedback}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
