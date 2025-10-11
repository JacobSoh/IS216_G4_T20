import 'server-only'

import { supabaseServer } from '@/utils/supabase/server'

const baseChatSelect = `
  chat_id,
  aid,
  uid,
  message,
  sent_at,
  sender:profile!auction_chat_uid_fkey (
    id,
    username,
    avatar_bucket,
    object_path
  )
`

export async function retrieveAuctionChats(aid, { limit = 100 } = {}) {
  const sb = supabaseServer()
  const query = (
    await sb
  ).from('auction_chat')
    .select(baseChatSelect)
    .eq('aid', aid)
    .order('sent_at', { ascending: true })
  if (limit) {
    query.limit(limit)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function insertAuctionChat(payload) {
  const sb = supabaseServer()
  const { data, error } = await (
    await sb
  ).from('auction_chat')
    .insert(payload)
    .select(baseChatSelect)
    .single()
  if (error) throw error
  return data ?? null
}
