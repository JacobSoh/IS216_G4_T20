import { notFound, redirect } from 'next/navigation'

import AuctionHouse3D from '@/components/auction/AuctionHouse3D'
import { getAuctionLiveState, getAuctionChatMessages } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export default async function AuctionViewerPage({ params }) {
  const { aid } = await params
  if (!aid) {
    notFound()
  }

  const [snapshot, chatMessages, user] = await Promise.all([
    getAuctionLiveState(aid),
    getAuctionChatMessages(aid, { limit: 200 }),
    getServerUser()
  ])
  if (!snapshot) {
    notFound()
  }

  if (!user) {
    redirect(`/login?next=/auction/${aid}`)
  }

  if (snapshot.auction?.oid === user.id) {
    redirect(`/auction/${aid}/manage`)
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
