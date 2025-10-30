'use client'

export default function BidConfirmationModal({ bidConfirmModal }) {
  if (!bidConfirmModal) return null

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
      <div
        className="rounded-2xl border-2 p-6 md:p-8 max-w-md w-full"
        style={{
          borderColor: 'var(--theme-secondary)',
          backgroundColor: '#130a1f',
          boxShadow: '0 0 60px rgba(176, 38, 255, 0.6)'
        }}
      >
        <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: 'var(--theme-cream)' }}>
          🔨 Confirm Your Bid
        </h3>

        <p className="text-sm md:text-base mb-6" style={{ color: 'var(--theme-accent)' }}>
          You are about to place a bid. Please review the details below:
        </p>

        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(176, 38, 255, 0.4)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-semibold" style={{ color: 'var(--theme-accent)' }}>Item</span>
          </div>
          <p className="font-bold text-base md:text-lg mb-3" style={{ color: 'var(--theme-cream)' }}>{bidConfirmModal.itemName}</p>

          <div className="pt-3 border-t" style={{ borderColor: 'rgba(176, 38, 255, 0.3)' }}>
            <span className="text-xs uppercase font-semibold block mb-1" style={{ color: 'var(--theme-accent)' }}>Your Bid Amount</span>
            <p className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--theme-gold)' }}>
              ${bidConfirmModal.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <p className="text-xs md:text-sm mb-6" style={{ color: 'var(--theme-accent)' }}>
          Do you want to place this bid?
        </p>

        <div className="flex gap-3">
          <button
            onClick={bidConfirmModal.onCancel}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all hover:opacity-80"
            style={{
              backgroundColor: '#444',
              color: 'var(--theme-cream)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={bidConfirmModal.onConfirm}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90"
            style={{
              backgroundColor: 'var(--theme-gold)',
              color: 'var(--theme-primary)'
            }}
          >
            Confirm Bid
          </button>
        </div>
      </div>
    </div>
  )
}
