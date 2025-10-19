import 'server-only'
import { supabaseServer } from '@/utils/supabase/server'

const baseBidHistorySelect = `
  bid_id,
  iid,
  aid,
  uid,
  oid,
  bid_amount,
  bid_datetime,
  bidder:profile!bid_history_uid_fkey (
    id,
    username,
    avatar_bucket,
    object_path
  ),
  item:item!bid_history_iid_fkey (
    iid,
    title
  )
`

/**
 * Retrieve all bid history for an auction, ordered by most recent first
 */
export async function retrieveBidHistoryByAuction(aid, { limit = 100 } = {}) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  )
    .from('bid_history')
    .select(baseBidHistorySelect)
    .eq('aid', aid)
    .order('bid_datetime', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/**
 * Retrieve bid history for a specific item
 */
export async function retrieveBidHistoryByItem(iid, { limit = 50 } = {}) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  )
    .from('bid_history')
    .select(baseBidHistorySelect)
    .eq('iid', iid)
    .order('bid_datetime', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/**
 * Insert a new bid into bid_history
 */
export async function insertBidHistory(payload) {
  const sb = supabaseServer()
  const normalized = {
    iid: payload.iid,
    aid: payload.aid,
    uid: payload.uid,
    oid: payload.oid,
    bid_amount: payload.bid_amount,
    bid_datetime: payload.bid_datetime ?? new Date().toISOString()
  }

  const { data, error } = await (
    await sb
  )
    .from('bid_history')
    .insert(normalized)
    .select(baseBidHistorySelect)
    .single()

  if (error) throw error
  return data ?? null
}

/**
 * Get bid count for an item
 */
export async function getBidCountByItem(iid) {
  const sb = supabaseServer()
  const { count, error } = await (
    await sb
  )
    .from('bid_history')
    .select('*', { count: 'exact', head: true })
    .eq('iid', iid)

  if (error) throw error
  return count ?? 0
}

/**
 * Get bid count for entire auction
 */
export async function getBidCountByAuction(aid) {
  const sb = supabaseServer()
  const { count, error } = await (
    await sb
  )
    .from('bid_history')
    .select('*', { count: 'exact', head: true })
    .eq('aid', aid)

  if (error) throw error
  return count ?? 0
}

export async function deleteBidHistoryByAuction(aid) {
  const sb = supabaseServer()
  const { error } = await (
    await sb
  )
    .from('bid_history')
    .delete()
    .eq('aid', aid)

  if (error) throw error

  return true
}
