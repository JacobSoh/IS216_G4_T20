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
  object_path
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

export async function markItemAsSold(iid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('item')
    .update({ sold: true })
    .eq('iid', iid)
    .select(baseItemSelect)
    .single()
  if (error) throw error
  return data ?? null
}
