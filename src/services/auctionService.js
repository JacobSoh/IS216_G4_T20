import 'server-only'

import { Auction } from '@/models/auction'
import {
  retrieveAllAuctions,
  insertAuction,
  retrieveAuctionById,
  upAuctionById,
  delAuctionById,
  updateAuctionTimer
} from '@/repositories/auctionRepo'
import { retrieveItemsByAuction, retrieveItemById, markItemAsSold } from '@/repositories/itemRepo'
import { retrieveAuctionChats, insertAuctionChat } from '@/repositories/auctionChatRepo'
import {
  retrieveCurrentBidsByAuction,
  retrieveCurrentBidByItem,
  upsertCurrentBid
} from '@/repositories/currentBidRepo'
import {
  insertBidHistory,
  retrieveBidHistoryByAuction
} from '@/repositories/bidHistoryRepo'
import { insertItemSold } from '@/repositories/itemsSoldRepo'
import { buildStoragePublicUrl } from '@/utils/storage'

const REQUIRED_FIELDS = ['oid', 'name', 'start_time', 'end_time', 'thumbnail_bucket', 'object_path']

function validateParam(data = {}) {
  const missing = REQUIRED_FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(data, field))
  if (missing.length > 0) {
    return {
      success: false,
      message: `Missing parameters: ${missing.join(', ')}`
    }
  }
  return {
    success: true,
    message: null
  }
}

function enhanceAuctionRecord(record) {
  if (!record) return null
  const auction = Auction.fromRecord(record)
  const thumbnailUrl = auction.thumbnailUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  return {
    ...auction.getJson(),
    owner: record.owner ?? null,
    thumbnailUrl,
    // Include timer fields from the raw database record
    time_interval: record.time_interval ?? null,
    timer_started_at: record.timer_started_at ?? null,
    timer_duration_seconds: record.timer_duration_seconds ?? null
  }
}

function enhanceItemRecord(item, bidsMap) {
  const bid = bidsMap.get(item.iid)
  const bidIncrement = Number(item.bid_increment ?? 0.01)
  return {
    ...item,
    bid_increment: Number.isFinite(bidIncrement) && bidIncrement > 0 ? bidIncrement : 0.01,
    imageUrl: buildStoragePublicUrl({
      bucket: item.item_bucket,
      objectPath: item.object_path
    }),
    current_bid: bid ?? null
  }
}

function deriveActiveItem(items = []) {
  if (items.length === 0) return { active: null, next: null }
  let active = null
  items.forEach((item, index) => {
    if (!active) {
      active = item
      return
    }
    const activeTimestamp = active.current_bid?.bid_datetime
      ? new Date(active.current_bid.bid_datetime).getTime()
      : 0
    const candidateTimestamp = item.current_bid?.bid_datetime
      ? new Date(item.current_bid.bid_datetime).getTime()
      : 0
    if (candidateTimestamp > activeTimestamp) {
      active = item
    }
  })
  if (!active) active = items[0]
  const activeIndex = items.findIndex((item) => item.iid === active.iid)
  const next = activeIndex >= 0 && activeIndex + 1 < items.length ? items[activeIndex + 1] : null
  return { active, next }
}

async function hydrateAuctionData(aid) {
  const auctionRecord = await retrieveAuctionById(aid)
  if (!auctionRecord) {
    throw new Error('Auction not found')
  }
  const items = await retrieveItemsByAuction(aid)
  const bids = await retrieveCurrentBidsByAuction(aid)
  const bidsMap = new Map(bids.map((bid) => [bid.iid, bid]))
  const normalizedItems = items.map((item) => enhanceItemRecord(item, bidsMap))
  const { active, next } = deriveActiveItem(normalizedItems)
  const auction = enhanceAuctionRecord(auctionRecord)
  return {
    auction,
    items: normalizedItems,
    activeItem: active,
    nextItem: next
  }
}

export async function getAllAuctions() {
  const data = await retrieveAllAuctions()
  if (!data) throw new Error('Auctions not found')
  return data.map(enhanceAuctionRecord)
}

export async function setAuction(param) {
  const validation = validateParam(param)
  if (!validation.success) throw new Error(validation.message)
  const auction = new Auction(param)
  const data = await insertAuction(auction)
  if (!data) throw new Error('Auction not inserted')
  return enhanceAuctionRecord(data)
}

export async function getAuctionById(aid) {
  const data = await retrieveAuctionById(aid)
  if (!data) throw new Error('Auction does not exists')
  return enhanceAuctionRecord(data)
}

export async function updateAuctionById(param, aid) {
  const validation = validateParam(param)
  if (!validation.success) throw new Error(validation.message)
  const auction = new Auction(param)
  const data = await upAuctionById(auction, aid)
  if (!data) throw new Error('Auction is not updated')
  return enhanceAuctionRecord(data)
}

export async function deleteAuctionById(aid, oid) {
  await delAuctionById(aid, oid)
  const data = await retrieveAuctionById(aid)
  if (data !== null) throw new Error('Auction is not deleted')
  return true
}

export async function getAuctionLiveState(aid) {
  const data = await hydrateAuctionData(aid)
  // Also include bid history for the seller's management panel
  const bidHistory = await retrieveBidHistoryByAuction(aid, { limit: 100 })
  return {
    ...data,
    bidHistory
  }
}

export async function setActiveAuctionItem({ aid, iid, actorId, currentPrice }) {
  const auctionRecord = await retrieveAuctionById(aid)
  if (!auctionRecord) {
    throw new Error('Auction not found')
  }
  if (auctionRecord.oid !== actorId) {
    throw new Error('Only the auction owner can update the active item')
  }
  const itemRecord = await retrieveItemById(iid)
  if (!itemRecord || itemRecord.aid !== aid) {
    throw new Error('Item does not belong to this auction')
  }

  // Check if item is already sold
  if (itemRecord.sold) {
    throw new Error('Cannot activate item: This item has already been sold')
  }

  const price = currentPrice ?? itemRecord.min_bid
  const payload = {
    aid,
    iid,
    oid: auctionRecord.oid,
    uid: actorId,
    current_price: price,
    bid_datetime: new Date().toISOString()
  }

  // Start the countdown timer for this item
  const defaultTimeInterval = auctionRecord.time_interval ?? 300 // Default 5 minutes
  await updateAuctionTimer(aid, {
    timer_started_at: new Date().toISOString(),
    timer_duration_seconds: defaultTimeInterval
  })

  const result = await upsertCurrentBid(payload)
  return result
}

export async function placeBidForItem({ aid, iid, bidderId, amount }) {
  const itemRecord = await retrieveItemById(iid)
  if (!itemRecord || itemRecord.aid !== aid) {
    throw new Error('Item not found for this auction')
  }
  const currentBid = await retrieveCurrentBidByItem(iid)
  const rawIncrement = Number(itemRecord.bid_increment ?? 0.01)
  const bidIncrement = Number.isFinite(rawIncrement) && rawIncrement > 0 ? rawIncrement : 0.01
  const currentPrice = currentBid?.current_price ? Number(currentBid.current_price) : null
  const minimumRequired = currentPrice !== null
    ? currentPrice + bidIncrement
    : Math.max(Number(itemRecord.min_bid ?? 0), bidIncrement)
  const normalizedAmount = Number(amount)
  if (!Number.isFinite(normalizedAmount)) {
    throw new Error('Bid amount must be a valid number')
  }
  if (normalizedAmount + 1e-9 < minimumRequired) {
    throw new Error(`Bid must be at least ${minimumRequired.toFixed(2)}`)
  }

  const bidDatetime = new Date().toISOString()

  // 1. Insert into bid_history (permanent record of this bid)
  const historyPayload = {
    aid,
    iid,
    uid: bidderId,
    oid: itemRecord.oid,
    bid_amount: normalizedAmount,
    bid_datetime: bidDatetime
  }
  await insertBidHistory(historyPayload)

  // 2. Update current_bid (current highest bid for this item)
  const currentBidPayload = {
    aid,
    iid,
    uid: bidderId,
    oid: itemRecord.oid,
    current_price: normalizedAmount,
    bid_datetime: bidDatetime
  }
  return upsertCurrentBid(currentBidPayload)
}

export async function getAuctionChatMessages(aid, { limit = 120 } = {}) {
  if (!aid) throw new Error('Missing auction id')
  return retrieveAuctionChats(aid, { limit })
}

export async function postAuctionChatMessage({ aid, uid, message }) {
  if (!aid || !uid) {
    throw new Error('Missing auction or user id')
  }
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty')
  }
  return insertAuctionChat({
    aid,
    uid,
    message: message.trim()
  })
}

/**
 * Close an item sale - marks item as sold and records the sale
 * Only works if the item has received bids
 */
export async function closeItemSale({ aid, iid, actorId }) {
  // Verify auction ownership
  const auctionRecord = await retrieveAuctionById(aid)
  if (!auctionRecord) {
    throw new Error('Auction not found')
  }
  if (auctionRecord.oid !== actorId) {
    throw new Error('Only the auction owner can close item sales')
  }

  // Get item details
  const itemRecord = await retrieveItemById(iid)
  if (!itemRecord || itemRecord.aid !== aid) {
    throw new Error('Item does not belong to this auction')
  }

  // Check if already sold
  if (itemRecord.sold) {
    throw new Error('Item is already marked as sold')
  }

  // Get current bid
  const currentBid = await retrieveCurrentBidByItem(iid)
  if (!currentBid || !currentBid.uid) {
    throw new Error('Cannot close sale: No bids have been placed on this item')
  }

  // 1. Insert into items_sold table
  const itemSoldPayload = {
    iid,
    aid,
    buyer_id: currentBid.uid,
    seller_id: itemRecord.oid,
    final_price: currentBid.current_price,
    sold_at: new Date().toISOString()
  }
  await insertItemSold(itemSoldPayload)

  // 2. Mark item as sold in items table
  await markItemAsSold(iid)

  // 3. Clear the countdown timer
  await updateAuctionTimer(aid, {
    timer_started_at: null,
    timer_duration_seconds: null
  })

  return {
    success: true,
    itemId: iid,
    buyerId: currentBid.uid,
    finalPrice: currentBid.current_price
  }
}

/**
 * Check if an item can be activated (not sold)
 */
export async function canActivateItem(iid) {
  const itemRecord = await retrieveItemById(iid)
  if (!itemRecord) {
    return { canActivate: false, reason: 'Item not found' }
  }
  if (itemRecord.sold) {
    return { canActivate: false, reason: 'Item has already been sold' }
  }
  return { canActivate: true }
}

/**
 * Adjust the countdown timer for the active item
 * @param {string} aid - Auction ID
 * @param {number} durationSeconds - New duration in seconds
 * @param {string} actorId - User ID of the actor (must be auction owner)
 */
export async function adjustAuctionTimer({ aid, durationSeconds, actorId }) {
  // Verify auction ownership
  const auctionRecord = await retrieveAuctionById(aid)
  if (!auctionRecord) {
    throw new Error('Auction not found')
  }
  if (auctionRecord.oid !== actorId) {
    throw new Error('Only the auction owner can adjust the timer')
  }

  // Validate duration
  const duration = Number(durationSeconds)
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error('Invalid duration: must be a positive number')
  }

  // Update the timer with new duration, restart the timer
  await updateAuctionTimer(aid, {
    timer_started_at: new Date().toISOString(),
    timer_duration_seconds: duration
  })

  return {
    success: true,
    timer_started_at: new Date().toISOString(),
    timer_duration_seconds: duration
  }
}
