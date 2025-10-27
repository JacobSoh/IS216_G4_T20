import { User } from "@/models/user";
import { supabaseBrowser } from "@/utils/supabase/client";

async function getUserByUsername(username, sb) {
    const { data: profile, error: profileError } = await sb.from('profile')
        .select('*')
        .eq('username', username)
        .single();
    if (profileError) {
        throw new Error("User profile does not exists");
    };
    const id = profile.id;
    return  {'id': id, 'profile': profile};
}

async function getUserByAuth(sb) {
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
    return  {'id': id, 'profile': profile, 'user': user};
}

export default async function getProfile({ username } = {}) {
    const sb = supabaseBrowser();
    try {
        const {id: id, profile: profile, user: user} = username ? await getUserByUsername(username, sb) : await getUserByAuth(sb);

        const nowIso = new Date().toISOString();

        // Get currently listed items (active auctions not yet sold)
        const { data: currentlyListedItems, error: itemError } = await sb
            .from('item')
            .select(`
                iid,
                sold,
                auction!inner(
                    aid,
                    end_time
                )
            `)
            .eq('oid', id)
            .eq('sold', false)
            .gt('auction.end_time', nowIso);

        if (itemError) {
            console.error('Currently listed error:', itemError);
            throw new Error("Unable to retrieve user items");
        }

        // Get items sold (completed sales where user was seller)
        const { count: itemsSold, error: soldError } = await sb
            .from('items_sold')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', id);

        if (soldError) {
            console.error('Items sold error:', soldError);
            throw new Error("Unable to retrieve sold items");
        }

        // Get items won (completed purchases where user was buyer)
        const { count: itemsWon, error: wonError } = await sb
            .from('items_sold')
            .select('*', { count: 'exact', head: true })
            .eq('buyer_id', id);

        if (wonError) {
            console.error('Items won error:', wonError);
            throw new Error("Unable to retrieve won items");
        }

        const { data: review, error: reviewError } = await sb.rpc('review_stats', {
            p_reviewee: id
        });

        if (reviewError) {
            throw new Error("Unable to retrieve user's records");
        }

        const statsData = {
            currentlyListed: currentlyListedItems?.length || 0,
            itemsSold: itemsSold || 0,
            itemsWon: itemsWon || 0
        };

        if (username) {
            return new User({ id }, profile, statsData, review[0]);
        }
        return new User(user, profile, statsData, review[0]);

    } catch (e) {
        console.error('[getUserData] Error:', e);
        throw e;
    }
}
