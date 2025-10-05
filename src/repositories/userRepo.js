import 'server-only';
import { supabaseServer } from '@/utils/supabase/server';

export async function re(email, password, options) {
    const sb = supabaseServer();
    const { data, error } = await (await sb).auth.signUp({
        email, 
        password,
        options
    });
    if ( error ) throw error;
    return data ?? null;
};