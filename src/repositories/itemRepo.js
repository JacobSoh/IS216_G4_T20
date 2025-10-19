import 'server-only'
import { supabaseServer } from '@/utils/supabase/server'

const baseItemSelect = `
  iid,
  aid,
  oid,
  title,
  description,
  min_bid,
  bid_increment,
  item_bucket,
  object_path,
  sold
`

export async function retrieveItemsByAuction(aid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('item')
    .select(baseItemSelect)
    .eq('aid', aid)
    .order('title', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function retrieveItemById(iid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('item')
    .select(baseItemSelect)
    .eq('iid', iid)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function upsertItem(payload) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('item')
    .upsert(payload, { onConflict: 'iid' })
    .select(baseItemSelect)
    .single()
  if (error) throw error
  return data ?? null
}

export async function markItemAsSold(iid, { sold = true } = {}) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('item')
    .update({ sold })
    .eq('iid', iid)
    .select(baseItemSelect)
    .single()
  if (error) throw error
  return data ?? null
}

export async function resetItemsSoldStatus(aid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('item')
    .update({ sold: false })
    .eq('aid', aid)
    .select(baseItemSelect)
  if (error) throw error
  return data ?? []
}
