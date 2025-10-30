import 'server-only'
import { supabaseServer } from '@/utils/supabase/server'

const baseWalletTransactionSelect = `
  tid,
  uid,
  transaction_type,
  amount,
  status,
  reference_id,
  related_item_id,
  description,
  created_at,
  completed_at
`

/**
 * Create a new wallet transaction
 */
export async function insertWalletTransaction(payload) {
  const sb = supabaseServer()
  const normalized = {
    uid: payload.uid,
    transaction_type: payload.transaction_type,
    amount: payload.amount,
    status: payload.status ?? 'pending',
    reference_id: payload.reference_id ?? null,
    related_item_id: payload.related_item_id ?? null,
    description: payload.description ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
    completed_at: payload.completed_at ?? null
  }

  const { data, error } = await (await sb)
    .from('wallet_transaction')
    .insert(normalized)
    .select(baseWalletTransactionSelect)
    .single()

  if (error) throw error
  return data ?? null
}

/**
 * Update a wallet transaction status
 */
export async function updateWalletTransactionStatus(tid, status, completedAt = null) {
  const sb = supabaseServer()
  const updates = {
    status,
    completed_at: completedAt ?? (status === 'completed' ? new Date().toISOString() : null)
  }

  const { data, error } = await (await sb)
    .from('wallet_transaction')
    .update(updates)
    .eq('tid', tid)
    .select(baseWalletTransactionSelect)
    .single()

  if (error) throw error
  return data ?? null
}

/**
 * Get wallet transaction by ID
 */
export async function retrieveWalletTransactionById(tid) {
  const sb = supabaseServer()
  const { data, error } = await (await sb)
    .from('wallet_transaction')
    .select(baseWalletTransactionSelect)
    .eq('tid', tid)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

/**
 * Get wallet transactions by user ID
 */
export async function retrieveWalletTransactionsByUser(uid, { limit = 50 } = {}) {
  const sb = supabaseServer()
  const { data, error } = await (await sb)
    .from('wallet_transaction')
    .select(baseWalletTransactionSelect)
    .eq('uid', uid)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
