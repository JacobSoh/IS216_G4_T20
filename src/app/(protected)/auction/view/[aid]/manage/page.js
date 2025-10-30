import { notFound, redirect } from 'next/navigation';

import AuctionManagePanel from '@/components/Auction/AuctionManagePanel'
import { getAuctionLiveState, getAuctionChatMessages } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export default async function AuctionManagePage({ params }) {
  const { aid } = await params
  if (!aid) {
    console.log('[AuctionManagePage] Missing aid in params')
    notFound()
  }

  const [snapshot, chatMessages, user] = await Promise.all([
    getAuctionLiveState(aid),
    getAuctionChatMessages(aid, { limit: 200 }),
    getServerUser()
  ]);

  if (!snapshot) {
    console.log('[AuctionManagePage] No snapshot retrieved for aid', aid)
    notFound()
  };

  const endTimeIso = snapshot.auction?.end_time ?? null
  const hasEnded = endTimeIso ? Date.now() >= new Date(endTimeIso).getTime() : false
  if (hasEnded) {
    console.log('[AuctionManagePage] Auction already ended, redirecting to ended page', { aid, endTimeIso })
    redirect(`/auction/view/${aid}/ended`)
  };

  const ownerCandidates = [
    snapshot.auction?.oid,
    snapshot.auction?.owner?.id
  ].filter(Boolean)

  console.log('[AuctionManagePage] Ownership check', {
    aid,
    ownerCandidates,
    userId: user.id
  })

  if (ownerCandidates.length > 0 && !ownerCandidates.includes(user.id)) {
    console.log('[AuctionManagePage] User not owner, redirecting to viewer', {
      aid,
      ownerCandidates,
      userId: user.id
    })
    redirect(`/auction/view/${aid}`)
  }

  return <AuctionManagePanel aid={aid} initialLiveData={snapshot} initialChatMessages={chatMessages} />
}
