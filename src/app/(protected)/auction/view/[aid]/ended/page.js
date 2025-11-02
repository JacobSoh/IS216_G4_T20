import Link from 'next/link'

import { getAuctionById } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export default async function AuctionEndedPage({ params }) {
  const { aid } = await params

  const [auction, user] = await Promise.all([
    getAuctionById(aid).catch(() => null),
    getServerUser()
  ])

  return (
    <div className="min-h-screen w-full bg-[var(--custom-bg-primary)] text-white flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="space-y-3">
          <span className="uppercase tracking-[0.3em] text-sm text-[#B984DB]">
            Auction Closed
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#F8E2D4]">
            Your auction has ended
          </h1>
          <p className="text-sm md:text-base text-[#B984DB]">
            {auction?.name
              ? `“${auction.name}” is now closed. Thanks for hosting a great event!`
              : 'This auction is closed. Thanks for hosting a great event!'}
          </p>
          {user && auction?.oid === user.id && (
            <p className="text-xs md:text-sm text-[#B984DB]">
              You can review results from your seller dashboard or create a new auction anytime.
            </p>
          )}
        </div>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-[#7209B7] text-white hover:bg-[#4D067B] transition-colors"
          >
            Return Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border border-[#B984DB] text-[#B984DB] hover:border-[#F8E2D4] hover:text-[#F8E2D4] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
