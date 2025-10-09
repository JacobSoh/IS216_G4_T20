import { notFound, redirect } from 'next/navigation'

import AuctionHouse3D from '@/components/auction/AuctionHouse3D'
import { getAuctionLiveState } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export default async function AuctionViewerPage({ params }) {
  const { aid } = await params
  if (!aid) {
    notFound()
  }

  const [snapshot, user] = await Promise.all([getAuctionLiveState(aid), getServerUser()])
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
      <AuctionHouse3D aid={aid} initialLiveData={snapshot} />
    </div>
  )
}
