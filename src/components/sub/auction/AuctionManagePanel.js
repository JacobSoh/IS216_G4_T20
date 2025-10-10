'use client'

import { useState } from 'react'

import { useAuctionLive } from '@/hooks/useAuctionLive'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

export default function AuctionManagePanel({ aid, initialLiveData }) {
  const { snapshot, isFetching, refresh } = useAuctionLive(aid, initialLiveData, 5000)
  const [pendingItem, setPendingItem] = useState(null)
  const [bidAmount, setBidAmount] = useState('')
  const [busyItem, setBusyItem] = useState(null)
  const [error, setError] = useState(null)

  const items = snapshot?.items ?? []
  const activeItemId = snapshot?.activeItem?.iid ?? null

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
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyItem(null)
    }
  }

  const submitBid = async (iid) => {
    if (!bidAmount) return
    setBusyItem(iid)
    setError(null)
    try {
      const amountValue = Number(bidAmount)
      const res = await fetch(`/api/auctions/${aid}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iid,
          amount: amountValue
        })
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to place bid')
      }
      setBidAmount('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyItem(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--custom-text-primary)]">
            Manage Auction · {snapshot?.auction?.name ?? 'Untitled'}
          </h1>
          <p className="text-sm text-[var(--custom-text-secondary)]">
            {isFetching ? 'Syncing live data…' : 'Live data is up to date'}
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-2 text-sm rounded-md border border-[var(--custom-border-color)] hover:bg-[var(--custom-bg-secondary)]"
          type="button"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[var(--custom-border-color)] bg-[var(--custom-bg-secondary)] p-4">
        <h2 className="text-lg font-semibold text-[var(--custom-text-primary)] mb-4">
          Lots ({items.length})
        </h2>
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
          {items.map((item) => {
            const currentPrice = item.current_bid?.current_price ?? item.min_bid ?? 0
            const isActive = activeItemId === item.iid
            return (
              <div
                key={item.iid}
                className={`rounded-lg border px-4 py-3 ${isActive ? 'border-[var(--custom-bright-blue)] bg-[var(--custom-bg-primary)]/60' : 'border-[var(--custom-border-color)] bg-[var(--custom-bg-primary)]/40'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--custom-text-primary)]">{item.title}</p>
                    <p className="text-xs text-[var(--custom-text-secondary)]">{item.description}</p>
                  </div>
                  <span className="text-sm font-medium text-[var(--custom-cream-yellow)]">
                    {currencyFormatter.format(currentPrice)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => activateItem(item.iid, currentPrice)}
                    disabled={busyItem === item.iid}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-[var(--custom-bright-blue)] text-white' : 'bg-[var(--custom-accent-red)] text-white'} ${busyItem === item.iid ? 'opacity-50' : ''}`}
                  >
                    {isActive ? 'Active Lot' : 'Set Active'}
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-24 rounded-md border border-[var(--custom-border-color)] bg-transparent px-2 py-1 text-sm"
                      placeholder="+ Bid"
                      value={pendingItem === item.iid ? bidAmount : ''}
                      onFocus={() => {
                        setPendingItem(item.iid)
                        setBidAmount('')
                      }}
                      onChange={(e) => {
                        setPendingItem(item.iid)
                        setBidAmount(e.target.value)
                      }}
                    />
                    <button
                      type="button"
                      disabled={busyItem === item.iid || pendingItem !== item.iid || !bidAmount}
                      onClick={() => submitBid(item.iid)}
                      className="rounded-md border border-[var(--custom-border-color)] px-3 py-1 text-xs uppercase tracking-wide hover:bg-[var(--custom-bg-primary)]/60 disabled:opacity-50"
                    >
                      Place bid
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
