import 'server-only'
import { supabaseServer } from '@/utils/supabase/server'

const baseBidSelect = `
  iid,
  aid,
  uid,
  oid,
  current_price,
  bid_datetime,
  bidder:profile!current_bid_uid_fkey (
    id,
    username,
    avatar_bucket,
    object_path
  )
`

export async function retrieveCurrentBidsByAuction(aid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('current_bid')
    .select(baseBidSelect)
    .eq('aid', aid)
  if (error) throw error
  return data ?? []
}

export async function retrieveCurrentBidByItem(iid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('current_bid')
    .select(baseBidSelect)
    .eq('iid', iid)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function upsertCurrentBid(payload) {
  const sb = supabaseServer()
  const normalized = {
    ...payload,
    bid_datetime: payload.bid_datetime ?? new Date().toISOString()
  }
  const { data, error } = await (
    await sb
  ).from('current_bid')
    .upsert(normalized, { onConflict: 'iid' })
    .select(baseBidSelect)
    .single()
  if (error) throw error
  return data ?? null
}

export async function deleteCurrentBidsByAuction(aid) {
  const sb = supabaseServer()
  const { error } = await (
    await sb
  ).from('current_bid')
    .delete()
    .eq('aid', aid)
  if (error) throw error
  return true
}
