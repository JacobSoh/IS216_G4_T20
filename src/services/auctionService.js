import 'server-only'

import { Auction } from '@/models/auction'
import {
  retrieveAllAuctions,
  retrieveAuctionsByOwner,
  insertAuction,
  retrieveAuctionById,
  upAuctionById,
  delAuctionById,
  updateAuctionTimer,
  closeAuctionRecord
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
import {
  transferWalletFunds
} from '@/repositories/profileRepo'
import {
  insertWalletTransaction
} from '@/repositories/walletTransactionRepo'

const REQUIRED_FIELDS = ['oid', 'aid', 'name', 'start_time', 'thumbnail_bucket', 'object_path']

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
    timer_duration_seconds: record.timer_duration_seconds ?? null,
    auction_end: record.auction_end ?? false
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

  // Consider only items that currently have an active bid entry (lot is live)
  const candidates = items.filter((item) => Boolean(item.current_bid) && item.sold !== true)
  let active = null

  if (candidates.length > 0) {
    active = candidates.reduce((latest, item) => {
      if (!latest) return item
      const latestTimestamp = latest.current_bid?.bid_datetime
        ? new Date(latest.current_bid.bid_datetime).getTime()
        : 0
      const candidateTimestamp = item.current_bid?.bid_datetime
        ? new Date(item.current_bid.bid_datetime).getTime()
        : 0
      return candidateTimestamp > latestTimestamp ? item : latest
    }, null)
  }

  if (!active) {
    const nextUnsold = items.find((item) => item.sold !== true) ?? null
    return {
      active: null,
      next: nextUnsold
    }
  }

  const activeIndex = items.findIndex((item) => item.iid === active.iid)
  let next = null
  if (activeIndex >= 0) {
    for (let idx = activeIndex + 1; idx < items.length; idx += 1) {
      const candidate = items[idx]
      if (candidate?.sold !== true) {
        next = candidate
        break
      }
    }
  }
  if (!next) {
    next = items.find((item) => item.sold !== true && item.iid !== active.iid) ?? null
  }

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

export async function getAuctionsByOwner(oid) {
  if (!oid) throw new Error('Missing owner id')
  const data = await retrieveAuctionsByOwner(oid)
  return (data ?? []).map(enhanceAuctionRecord)
}

function normalizeSoldFlag(value) {
  if (value === true || value === 'true' || value === 1) return true
  if (value === false || value === 'false' || value === 0) return false
  return Boolean(value)
}

function deriveAuctionStatusFromItems(auction, items = []) {
  const startMs = auction?.start_time
    ? new Date(auction.start_time).getTime()
    : null
  if (!startMs || Number.isNaN(startMs)) return 'scheduled'
  const now = Date.now()
  if (now < startMs) return 'scheduled'
  if (!Array.isArray(items) || items.length === 0) {
    return 'ended'
  }
  const hasUnsold = items.some((item) => !normalizeSoldFlag(item?.sold))
  return hasUnsold ? 'live' : 'ended'
}

export async function getAuctionSummariesByOwner(oid) {
  if (!oid) throw new Error('Missing owner id')
  const rawAuctions = await retrieveAuctionsByOwner(oid)
  if (!rawAuctions || rawAuctions.length === 0) {
    return []
  }
  const enhanced = rawAuctions.map(enhanceAuctionRecord)
  const ids = enhanced.map((auction) => auction.aid).filter(Boolean)
  let itemsByAuction = new Map()
  if (ids.length > 0) {
    const items = await retrieveItemSoldStateByAuctions(ids)
    itemsByAuction = items.reduce((map, row) => {
      const key = row?.aid
      if (!key) return map
      const list = map.get(key) ?? []
      list.push(row)
      map.set(key, list)
      return map
    }, new Map())
  }
  return enhanced.map((auction) => {
    const items = itemsByAuction.get(auction.aid) ?? []
    const status = deriveAuctionStatusFromItems(auction, items)
    const unsoldItems = items.filter((item) => !normalizeSoldFlag(item?.sold)).length
    return {
      aid: auction.aid,
      name: auction.name,
      description: auction.description,
      start_time: auction.start_time,
      end_time: auction.end_time ?? null,
      thumbnailUrl: auction.thumbnailUrl ?? null,
      status,
      totalItems: items.length,
      unsoldItems
    }
  })
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
  const validation = validateParam({...param, aid})
  if (!validation.success) throw new Error(validation.message)
  const auction = new Auction({...param, aid})
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
    uid: null,
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
  // Check if there's an actual bidder (uid is set), not just if current_price exists
  // When item becomes active, current_bid is created with uid=null and current_price=min_bid
  const hasActualBid = currentBid && currentBid.uid != null
  const currentPrice = hasActualBid ? Number(currentBid.current_price) : null
  const minimumRequired = currentPrice !== null
    ? currentPrice + bidIncrement
    : Number(itemRecord.min_bid ?? 0)
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
  const hasBids = Boolean(
    currentBid &&
    currentBid.uid &&
    currentBid.uid !== auctionRecord.oid
  )

  // If there are bids, complete the payment and log to items_sold table
  let paymentTransactionId = null

  if (hasBids) {
    const buyerId = currentBid.uid
    const sellerId = itemRecord.oid
    const finalPrice = Number(currentBid.current_price)

    try {
      // Transfer funds directly from buyer to seller
      await transferWalletFunds(buyerId, sellerId, finalPrice)

      // Create payment transaction record for buyer
      const paymentTransaction = await insertWalletTransaction({
        uid: buyerId,
        transaction_type: 'payment',
        amount: finalPrice,
        status: 'completed',
        related_item_id: iid,
        description: `Payment for item: ${itemRecord.title}`,
        completed_at: new Date().toISOString()
      })

      paymentTransactionId = paymentTransaction?.tid ?? null

      // Create credit transaction for seller
      await insertWalletTransaction({
        uid: sellerId,
        transaction_type: 'sale',
        amount: finalPrice,
        status: 'completed',
        related_item_id: iid,
        description: `Sale of item: ${itemRecord.title}`,
        completed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error processing payment:', error)
      throw new Error(`Failed to process payment: ${error.message}`)
    }

    // Log to items_sold table
    const itemSoldPayload = {
      iid,
      aid,
      buyer_id: buyerId,
      seller_id: sellerId,
      final_price: finalPrice,
      sold_at: new Date().toISOString(),
      payment_transaction_id: paymentTransactionId
    }
    await insertItemSold(itemSoldPayload)
  }

  // Mark item as sold in items table (whether or not there are bids)
  await markItemAsSold(iid, { sold: true })

  // Clear the countdown timer
  await updateAuctionTimer(aid, {
    timer_started_at: null,
    timer_duration_seconds: null
  })

  return {
    success: true,
    itemId: iid,
    buyerId: hasBids ? currentBid.uid : null,
    finalPrice: hasBids ? currentBid.current_price : null,
    hasBids,
    paymentTransactionId
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

export async function closeAuction({ aid, actorId }) {
  const auctionRecord = await retrieveAuctionById(aid)
  if (!auctionRecord) {
    throw new Error('Auction not found')
  }
  if (auctionRecord.oid !== actorId) {
    throw new Error('Only the auction owner can close this auction')
  }

  await closeAuctionRecord(aid)

  return {
    success: true,
    closedAt: new Date().toISOString()
  }
}
