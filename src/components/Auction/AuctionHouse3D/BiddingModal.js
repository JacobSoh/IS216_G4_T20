'use client'

import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

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
  bidFeedback
}) {
  if (!isOpen) return null

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
          {/* Current Bid Info */}
          <div className="bg-[var(--theme-primary)]/80 p-3 md:p-4 rounded-lg space-y-2 border border-[var(--theme-secondary)]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-xs md:text-sm uppercase tracking-wide">Current Bid</p>
                <p className="text-xl md:text-2xl font-bold text-[var(--theme-gold)]">${lotBidValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-purple-300 text-xs md:text-sm uppercase tracking-wide">Min Increment</p>
                <p className="text-lg font-semibold text-purple-200">${bidIncrementValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Bid Input */}
          <Field>
            <FieldLabel className="text-xs md:text-sm text-purple-200 mb-2">
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
            />
            {bidValidationError && (
              <p className="mt-2 text-[11px] md:text-xs text-red-400">
                {bidValidationError}
              </p>
            )}
            {!bidValidationError && (
              <p className="mt-2 text-[11px] md:text-xs text-purple-300">
                Enter in increments of ${bidIncrementValue.toFixed(2)}.
              </p>
            )}
          </Field>

          {/* Place Bid Button */}
          <button
            onClick={handleBidSubmit}
            disabled={isBidding}
            className="w-full py-3 md:py-4 bg-[var(--theme-secondary)] hover:bg-[var(--theme-primary)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-sm md:text-base shadow-[0_0_20px_rgba(176,38,255,0.4)]"
          >
            {isBidding ? 'Submitting...' : 'Place Bid'}
          </button>
          {bidFeedback && (
            <p className="text-xs md:text-sm text-[var(--theme-secondary)]">{bidFeedback}</p>
          )}
        </div>
      </div>
    </div>
  )
}
