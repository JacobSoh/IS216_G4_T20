import 'server-only'

import { Auction } from '@/models/auction'
import {
  retrieveAllAuctions,
  insertAuction,
  retrieveAuctionById,
  upAuctionById,
  delAuctionById
} from '@/repositories/auctionRepo'
import { retrieveItemsByAuction, retrieveItemById } from '@/repositories/itemRepo'
import {
  retrieveCurrentBidsByAuction,
  retrieveCurrentBidByItem,
  upsertCurrentBid
} from '@/repositories/currentBidRepo'
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
    thumbnailUrl
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
  return hydrateAuctionData(aid)
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
  const price = currentPrice ?? itemRecord.min_bid
  const payload = {
    aid,
    iid,
    oid: auctionRecord.oid,
    uid: actorId,
    current_price: price,
    bid_datetime: new Date().toISOString()
  }
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
  const payload = {
    aid,
    iid,
    uid: bidderId,
    oid: itemRecord.oid,
    current_price: normalizedAmount,
    bid_datetime: new Date().toISOString()
  }
  return upsertCurrentBid(payload)
}
