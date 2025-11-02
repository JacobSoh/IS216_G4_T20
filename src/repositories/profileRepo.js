import 'server-only'
import { supabaseServer } from '@/utils/supabase/server'

const baseProfileSelect = `
  id,
  username,
  first_name,
  middle_name,
  last_name,
  avatar_bucket,
  object_path,
  created_at,
  wallet_balance,
  wallet_held,
  verified
`

export async function insertProfile(profile) {
	const sb = await supabaseServer()
	const { data, error } = await sb
		.from('profile')
		.insert(profile)
		.select(baseProfileSelect)
		.single()

	if (error) throw error
	return data ?? null
}

export async function getProfileById(id) {
	const sb = await supabaseServer()
	const { data, error } = await sb
		.from('profile')
		.select(baseProfileSelect)
		.eq('id', id)
		.maybeSingle()

	if (error) throw error
	return data ?? null
}

export async function getProfileByUsername(username) {
	const sb = await supabaseServer()
	const { data, error } = await sb
		.from('profile')
		.select(baseProfileSelect)
		.ilike('username', username)
		.maybeSingle()

	if (error) throw error
	return data ?? null
}

export async function updateProfileById(userId, updates) {
	const sb = await supabaseServer()
	const { data, error } = await sb
		.from('profile')
		.update(updates)
		.eq('id', userId)
		.select(baseProfileSelect)
		.single()

	if (error) throw error
	return data ?? null
}

/**
 * Transfer funds directly from buyer to seller
 * Deducts from buyer's wallet_balance and adds to seller's wallet_balance
 */
export async function transferWalletFunds(buyerId, sellerId, amount) {
	const sb = await supabaseServer()

	// Get buyer's current balance
	const { data: buyerProfile, error: buyerError } = await sb
		.from('profile')
		.select('wallet_balance')
		.eq('id', buyerId)
		.single()

	if (buyerError) throw buyerError
	if (!buyerProfile) throw new Error('Buyer profile not found')

	const buyerBalance = Number(buyerProfile.wallet_balance ?? 0)
	if (buyerBalance < amount) {
		throw new Error('Insufficient wallet balance')
	}

	// Deduct from buyer's balance
	const { error: buyerUpdateError } = await sb
		.from('profile')
		.update({
			wallet_balance: buyerBalance - amount
		})
		.eq('id', buyerId)

	if (buyerUpdateError) throw buyerUpdateError

	// Add to seller's balance
	const { data: sellerProfile, error: sellerError } = await sb
		.from('profile')
		.select('wallet_balance')
		.eq('id', sellerId)
		.single()

	if (sellerError) throw sellerError
	if (!sellerProfile) throw new Error('Seller profile not found')

	const sellerBalance = Number(sellerProfile.wallet_balance ?? 0)

	const { error: sellerUpdateError } = await sb
		.from('profile')
		.update({
			wallet_balance: sellerBalance + amount
		})
		.eq('id', sellerId)

	if (sellerUpdateError) throw sellerUpdateError

	return { success: true }
}
