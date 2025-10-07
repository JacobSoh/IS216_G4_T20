import 'server-only';
import { supabaseServer } from '@/utils/supabase/server';

export async function retrieveAllAuctions() {
    const sb = supabaseServer();
    const { data, error } = await (await sb).from('auction').select('*');
    if ( error ) throw error;
    return data ?? [];
};

export async function insertAuction(auction) {
    const sb = supabaseServer();
    const { data, error } = await (await sb).from('auction').insert(auction.getJson()).select().single();
    if ( error ) throw error;
    return data ?? null;
};

/* All AID Methods */
export async function retrieveAuctionById(id) {
    const sb = supabaseServer();
    const { data, error } = await (await sb).from('auction').select('*').eq('id', id).maybeSingle();
    if ( error ) throw error;
    return data ?? null;
};

export async function upAuctionById(auction,id) {
    const sb = supabaseServer();
    const { data, error } = await (await sb).from('auction').update(auction.getJson()).eq('id', id).select().single();
    if ( error ) throw error;
    return data ?? null;
};

export async function delAuctionById(id, oid) {
    const sb = supabaseServer();
    const { data, error } = await (await sb).from('auction').delete().eq('id', id).eq('oid', oid);
    if ( error ) throw error;
    return data ?? null;
};