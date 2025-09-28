import 'server-only';
import { supabaseServer } from '@/utils/supabase/server';

export async function re(email, password, metadata) {
    const sb = supabaseServer();
    const { data, error } = await (await sb).auth.signUp({
        email, 
        password,
        options: {
            data: metadata
        }
    });
    if ( error ) throw error;
    return data ?? null;
};