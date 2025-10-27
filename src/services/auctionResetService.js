import 'server-only'

import { retrieveAuctionById, updateAuctionTimer } from '@/repositories/auctionRepo'
import { resetItemsSoldStatus } from '@/repositories/itemRepo'
import { deleteCurrentBidsByAuction } from '@/repositories/currentBidRepo'
import { deleteBidHistoryByAuction } from '@/repositories/bidHistoryRepo'
import { deleteAuctionChatsByAuction } from '@/repositories/auctionChatRepo'
import { deleteItemsSoldByAuction } from '@/repositories/itemsSoldRepo'

export async function resetAuctionState({ aid, actorId }) {
  const auctionRecord = await retrieveAuctionById(aid)
  if (!auctionRecord) {
    throw new Error('Auction not found')
  }
  if (auctionRecord.oid !== actorId) {
    throw new Error('Only the auction owner can reset this auction')
  }

  await deleteItemsSoldByAuction(aid)
  await deleteAuctionChatsByAuction(aid)
  await deleteBidHistoryByAuction(aid)
  await deleteCurrentBidsByAuction(aid)
  await resetItemsSoldStatus(aid)
  await updateAuctionTimer(aid, {
    timer_started_at: null,
    timer_duration_seconds: null
  })

  return {
    success: true
  }
}
