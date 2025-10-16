import { User } from "@/models/user";
import { axiosBrowserClient } from "@/utils/axios/client";
import { supabaseBrowser } from "@/utils/supabase/client";

export default async function getProfile() {
    const sb = supabaseBrowser();

    try {
        const { data: { user } } = await sb.auth.getUser();
        const id = user.id;
        
        if (!user) {
            throw new Error("User does not exist");
        };
        
        const { data: profile, error: profileError } = await sb.from('profile')
            .select('*')
            .eq('id', id)
            .single();
        if (profileError) {
            throw new Error("User profile does not exists");
        };

        const nowIso = new Date().toISOString();
        const { data: item, error: itemError } = await sb.from('item')
            .select((`
                iid,
                auction:aid(
                    end_time
                )
            `))
            .eq('oid', id)
            .gt('auction.end_time', nowIso); 
        if (itemError) {
            throw new Error("Unable to retrieve user items");
        };

        const { data: review, error: reviewError } = await sb.rpc('review_stats', {
            p_reviewee: id
        });
        if (reviewError) {
            throw new Error("Unable to retrieve user's records");
        };

        return new User(user, profile, item?.length, review[0]);

    } catch (e) {
        console.error('[getUserData] Error:', e);
        throw e;
    }
}
