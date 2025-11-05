import 'server-only'
import { supabaseServer } from '@/utils/supabase/server'

const baseAuctionSelect = `
  aid,
  oid,
  name,
  description,
  start_time,
  thumbnail_bucket,
  object_path,
  time_interval,
  timer_started_at,
  timer_duration_seconds,
  auction_end,
  owner:profile!auction_oid_fkey (
    id,
    username,
    avatar_bucket,
    object_path
  )
`

export async function retrieveAllAuctions() {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('auction')
    .select(baseAuctionSelect)
    .order('start_time', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function retrieveAuctionsByOwner(oid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('auction')
    .select(baseAuctionSelect)
    .eq('oid', oid)
    .order('start_time', { ascending: true });
  if (error) throw error
  return data ?? []
}

export async function insertAuction(auction) {
  const sb = supabaseServer()
  const payload = auction.getJson()
  const { data, error } = await (
    await sb
  ).from('auction')
    .insert(payload)
    .select(baseAuctionSelect)
    .single()
  if (error) throw error
  return data ?? null
}

export async function retrieveAuctionById(aid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('auction')
    .select(baseAuctionSelect)
    .eq('aid', aid)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function upAuctionById(auction, aid) {
  const sb = supabaseServer()
  const payload = auction.getJson()
  const { data, error } = await (
    await sb
  ).from('auction')
    .update(payload)
    .eq('aid', aid)
    .select(baseAuctionSelect)
    .single()
  if (error) throw error
  return data ?? null
}

export async function delAuctionById(aid, oid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('auction')
    .delete()
    .eq('aid', aid)
    .eq('oid', oid)
  if (error) throw error
  return data ?? null
}

export async function retrieveAuctionDetail(aid) {
  return retrieveAuctionById(aid)
}

/**
 * Update auction timer fields
 * @param {string} aid - Auction ID
 * @param {object} timerData - { timer_started_at, timer_duration_seconds }
 */
export async function updateAuctionTimer(aid, timerData) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('auction')
    .update(timerData)
    .eq('aid', aid)
    .select(baseAuctionSelect)
    .single()
  if (error) throw error
  return data ?? null
}

export async function closeAuctionRecord(aid) {
  const sb = supabaseServer()
  const payload = {
    auction_end: true,
    timer_started_at: null,
    timer_duration_seconds: null
  }
  const { data, error } = await (
    await sb
  ).from('auction')
    .update(payload)
    .eq('aid', aid)
    .select(baseAuctionSelect)
    .single()
  if (error) throw error
  return data ?? null
}
