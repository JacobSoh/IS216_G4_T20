import 'server-only'
import { supabaseServer } from '@/utils/supabase/server'

const baseItemsSoldSelect = `
  sid,
  iid,
  aid,
  buyer_id,
  seller_id,
  final_price,
  sold_at,
  payment_transaction_id,
  buyer:profile!items_sold_buyer_fkey (
    id,
    username,
    avatar_bucket,
    object_path
  ),
  seller:profile!items_sold_seller_fkey (
    id,
    username,
    avatar_bucket,
    object_path
  ),
  item:item!items_sold_iid_fkey (
    iid,
    title,
    description
  )
`

/**
 * Insert a new sold item record
 */
export async function insertItemSold(payload) {
  const sb = supabaseServer()
  const normalized = {
    iid: payload.iid,
    aid: payload.aid,
    buyer_id: payload.buyer_id,
    seller_id: payload.seller_id,
    final_price: payload.final_price,
    sold_at: payload.sold_at ?? new Date().toISOString(),
    payment_transaction_id: payload.payment_transaction_id ?? null
  }

  const { data, error } = await (
    await sb
  )
    .from('items_sold')
    .insert(normalized)
    .select(baseItemsSoldSelect)
    .single()

  if (error) throw error
  return data ?? null
}

/**
 * Get all sold items for an auction
 */
export async function retrieveSoldItemsByAuction(aid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  )
    .from('items_sold')
    .select(baseItemsSoldSelect)
    .eq('aid', aid)
    .order('sold_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Check if an item is already sold
 */
export async function isItemSold(iid) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  )
    .from('items_sold')
    .select('sid')
    .eq('iid', iid)
    .maybeSingle()

  if (error) throw error
  return data !== null
}
