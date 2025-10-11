import 'server-only'

import { supabaseServer } from '@/utils/supabase/server'

const baseProfileSelect = `
  id,
  username,
  first_name,
  middle_name,
  last_name,
  avatar_bucket,
  object_path
`

export async function insertProfile(profile) {
	const sb = supabaseServer()
	const { data, error } = await (
		await sb
	)
		.from('profile')
		.insert(profile)
		.select(baseProfileSelect)
		.single()
	if (error) throw error
	return data ?? null
}

export async function getProfileById(id) {
	const sb = supabaseServer()
	const { data, error } = await (
		await sb
	)
		.from('profile')
		.select(baseProfileSelect)
		.eq('id', id)
		.maybeSingle()
	if (error) throw error
	return data ?? null
}

export async function getProfileByUsername(username) {
	const sb = supabaseServer()
	const { data, error } = await (
		await sb
	)
		.from('profile')
		.select(baseProfileSelect)
		.ilike('username', username)
		.maybeSingle()
	if (error) throw error
	return data ?? null
}

export async function updateProfileById(username) {
	const sb = supabaseServer()
	const { data, error } = await (
		await sb
	)
		.from('profile')
		.update({
			first_name: formData.firstName,
			middle_name: formData.middleName,
			last_name: formData.lastName,
			street: formData.street,
			city: formData.city,
			state: formData.state,
			zip: formData.zip,
			username: formData.username,
			object_path: objectPath
		})
		.eq('id', userId);
	if (error) throw error
	return data ?? null
}