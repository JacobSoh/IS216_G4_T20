import { notFound, redirect } from 'next/navigation'

import AuctionManagePanel from '@/components/auction/AuctionManagePanel'
import { getAuctionLiveState } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export default async function AuctionManagePage({ params }) {
  const { aid } = await params
  if (!aid) {
    notFound()
  }

  const [snapshot, user] = await Promise.all([getAuctionLiveState(aid), getServerUser()])
  if (!snapshot) {
    notFound()
  }
  if (!user) {
    redirect(`/login?next=/auction/${aid}/manage`)
  }
  if (snapshot.auction?.oid !== user.id) {
    redirect(`/auction/${aid}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-10 px-6">
      <AuctionManagePanel aid={aid} initialLiveData={snapshot} />
    </div>
  )
}
