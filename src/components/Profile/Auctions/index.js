'use client';

import { useState, useEffect, Fragment } from "react";
import { Tab } from '@headlessui/react';
import { supabaseBrowser } from '@/utils/supabase/client';
import Link from 'next/link';
import Spinner from '@/components/SpinnerComponent';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

// Helper functions
const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function Auctions({ userId }) {
    const sb = supabaseBrowser();
    const filterCategories = ['All', 'Current', 'Past'];

    // Single state object
    const [state, setState] = useState({
        allAuctions: [],
        loading: true,
    });

    // Single useEffect
    useEffect(() => {
        if (!userId) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        const fetchAuctions = async () => {
            try {
                // Fetch auctions
                const { data: auctions, error } = await sb
                    .from('auction')
                    .select(`
                        aid,
                        name,
                        description,
                        start_time,
                        thumbnail_bucket,
                        object_path
                    `)
                    .eq('oid', userId);
                console.log(auctions);
                if (error || !auctions) {
                    setState(prev => ({ ...prev, loading: false }));
                    return;
                }

                const auctionsWithUrls = auctions.map(({ object_path, ...auction }) => ({
                    ...auction,
                    picUrl: sb.storage
                        .from(auction.thumbnail_bucket || 'thumbnail')
                        .getPublicUrl(object_path).data.publicUrl
                }));
                console.log(auctions);

                setState({ allAuctions: auctionsWithUrls, loading: false });

            } catch (error) {
                console.error('[Auctions] Error:', error);
                setState(prev => ({ ...prev, loading: false }));
            }
        };

        fetchAuctions();
    }, [userId, sb]);

    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="md" className="text-blue-500" />
            </div>
        );
    }


    if (!state.allAuctions || state.allAuctions.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl text-gray-500">No auctions yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-2">
            {state.loading
                ? Array.from({ length: 25 }).map(auction => <AuctionCardSkeleton key={auction.aid} />)
                : state.allAuctions.map((auction) => (
                    <Link
                        key={auction.aid}
                        href={`/auction/view/${auction.aid}`}
                        className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300 rounded-md"
                    >
                        <AuctionCard {...auction} />
                    </Link>
                ))
            }
        </div>
    );
}
