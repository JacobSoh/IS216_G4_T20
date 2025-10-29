import { notFound, redirect } from 'next/navigation'

import AuctionHouse3D from '@/components/auction/AuctionHouse3D'
import { getAuctionLiveState, getAuctionChatMessages } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export default async function AuctionViewerPage({ params }) {
  const { aid } = await params
  if (!aid) {
    console.log('[AuctionViewerPage] Missing aid in params')
    notFound()
  }

  const [snapshot, chatMessages, user] = await Promise.all([
    getAuctionLiveState(aid),
    getAuctionChatMessages(aid, { limit: 200 }),
    getServerUser()
  ])
  if (!snapshot) {
    console.log('[AuctionViewerPage] No snapshot retrieved for aid', aid)
    notFound()
  }

  const ownerId = snapshot.auction?.oid ?? snapshot.auction?.owner?.id ?? null
  console.log('[AuctionViewerPage] Ownership check', {
    aid,
    ownerId,
    userId: user.id,
    hasOwnerId: Boolean(ownerId)
  })
  if (ownerId && ownerId === user.id) {
    console.log('[AuctionViewerPage] User is owner, redirecting to manage', { aid })
    redirect(`/auction/view/${aid}/manage`)
  }

  return (
    <div className="h-screen w-full bg-[var(--custom-bg-primary)]">
      <AuctionHouse3D
        aid={aid}
        initialLiveData={snapshot}
        initialChatMessages={chatMessages}
        currentUserId={user.id}
      />
    </div>
  )
}
