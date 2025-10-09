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
