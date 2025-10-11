import 'server-only'

import { supabaseServer } from '@/utils/supabase/server'

export async function getServerUser() {
  const sb = supabaseServer()
  const { data, error } = await (await sb).auth.getUser()
  if (error) {
    if (error.message?.includes('Auth session missing')) {
      return null
    }
    throw error
  }
  return data?.user ?? null
}
