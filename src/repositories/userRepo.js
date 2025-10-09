
import 'server-only'

import { supabaseServer } from '@/utils/supabase/server'

export async function signUpUser({ email, password, options }) {
  const clientPromise = supabaseServer()
  const client = await clientPromise
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options
  })
  if (error) throw error
  return data ?? null
}
