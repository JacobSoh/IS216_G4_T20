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
  created_at
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
