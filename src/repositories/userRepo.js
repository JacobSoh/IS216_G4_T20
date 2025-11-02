
import 'server-only'

import { supabaseServer } from '@/utils/supabase/server'

export async function verifyEmailExists(email) {
    const sb = await supabaseServer();

    const { data, error } = await sb.rpc('auth_user_exists', {p_email: email});

    if ( error ) throw error;
    return data ?? null;
};