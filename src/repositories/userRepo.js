
import 'server-only'

import { supabaseServer } from '@/utils/supabase/server'

export async function re(input) {
    const sb = await supabaseServer();

    const { data, error } = await sb.auth.signUp(input);
    if ( error ) throw error;
    return data ?? null;
};