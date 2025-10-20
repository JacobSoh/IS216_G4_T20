'use client';

import { useState, useEffect } from "react";
import { supabaseBrowser } from '@/utils/supabase/client';
import Link from 'next/link';
import Spinner from '@/components/SpinnerComponent';
import { TrophyIcon } from '@heroicons/react/24/outline';
import ItemWonCard from "@/components/ItemWonCard"; // We'll create this

export default function ItemsWon({ userId }) {
    const sb = supabaseBrowser();

    const [state, setState] = useState({
        wonItems: [],
        loading: true,
    });

    useEffect(() => {
        if (!userId) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        const fetchWonItems = async () => {
            try {
                // Fetch items won by the user
                const { data: wonItems, error } = await sb
                    .from('items_sold')
                    .select(`
                        sid,
                        final_price,
                        sold_at,
                        item:iid (
                            iid,
                            title,
                            description,
                            item_bucket,
                            object_path
                        ),
                        auction:aid (
                            aid,
                            name
                        )
                    `)
                    .eq('buyer_id', userId)
                    .order('sold_at', { ascending: false });

                if (error || !wonItems) {
                    console.error('Error fetching won items:', error);
                    setState(prev => ({ ...prev, loading: false }));
                    return;
                }

                // Transform data for display
                const itemsWithUrls = wonItems
                    .filter(sale => sale.item) // Filter out any without item data
                    .map(({ item, auction, final_price, sold_at }) => ({
                        iid: item.iid,
                        aid: auction?.aid,
                        auctionName: auction?.name,
                        title: item.title,
                        description: item.description,
                        final_price: final_price,
                        sold_at: sold_at,
                        picUrl: sb.storage
                            .from(item.item_bucket || 'item')
                            .getPublicUrl(item.object_path).data.publicUrl
                    }));

                setState({ wonItems: itemsWithUrls, loading: false });

            } catch (error) {
                console.error('[ItemsWon] Error:', error);
                setState(prev => ({ ...prev, loading: false }));
            }
        };

        fetchWonItems();
    }, [userId, sb]);

    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="md" className="text-blue-500" />
            </div>
        );
    }

    if (!state.wonItems || state.wonItems.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="flex justify-center mb-4">
                    <TrophyIcon className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-xl text-gray-500">No items won yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-2">
            {state.wonItems.map((item) => (
                <Link
                    key={item.iid}
                    href={`/auction/${item.aid}`}
                    className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 rounded-lg"
                >
                    <ItemWonCard {...item} />
                </Link>
            ))}
        </div>
    );
}
