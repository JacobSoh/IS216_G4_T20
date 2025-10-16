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

const getTimeRemaining = (endTime) => {
    if (!endTime) return 'Not started';
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
};

const filterItems = (items, filter) => {
    const now = new Date();

    if (filter === 'All') return items;
    if (filter === 'Current') {
        return items.filter(item =>
            item.auction?.end_time && new Date(item.auction.end_time) > now
        );
    }
    if (filter === 'Past') {
        return items.filter(item =>
            !item.auction?.end_time || new Date(item.auction.end_time) <= now
        );
    }
    return items;
};

// Item Card Component
function ItemCard({ item, currentBid, supabase }) {
    const auction = item.auction;
    const imageUrl = item.object_path
        ? supabase.storage.from(item.item_bucket || 'item').getPublicUrl(item.object_path).data.publicUrl
        : auction?.object_path
            ? supabase.storage.from(auction.thumbnail_bucket || 'thumbnail').getPublicUrl(auction.object_path).data.publicUrl
            : '/placeholder-image.jpg';

    const isActive = auction?.end_time && new Date(auction.end_time) > new Date();
    const timeRemaining = getTimeRemaining(auction?.end_time);

    return (
        <Link
            href={`/auction/${item.aid}`}
            className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
        >
            {/* Image */}
            <div className="relative h-56 bg-gray-100">
                <img
                    src={imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                />
                {/* Live Badge */}
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'
                    }`}>
                    {isActive ? '🟢 Live' : '🔴 Ended'}
                </span>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Auction Name */}
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">
                    {auction?.name || 'Auction'}
                </p>

                {/* Item Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                    {item.title}
                </h3>

                {/* Pricing */}
                <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Bid</span>
                        <span className="text-lg font-bold text-green-600">
                            {formatCurrency(currentBid?.current_price || 0)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Min Bid</span>
                        <span className="text-sm font-semibold text-gray-700">
                            {formatCurrency(item.min_bid)}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-sm">
                        <span>⏱️</span>
                        <span className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                            {timeRemaining}
                        </span>
                    </div>
                    <span className="text-blue-600 text-sm font-semibold hover:underline">
                        View →
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default function Listings({ userId }) {
    const supabase = supabaseBrowser();
    const filterCategories = ['All', 'Current', 'Past'];

    // Single state object
    const [state, setState] = useState({
        allItems: [],
        currentBids: {},
        loading: true
    });

    // Single useEffect
    useEffect(() => {
        if (!userId) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        const fetchListings = async () => {
            try {
                // Fetch items
                const { data: items, error } = await supabase
                    .from('item')
                    .select(`
                        *,
                        auction:aid (
                            aid,
                            name,
                            end_time,
                            thumbnail_bucket,
                            object_path
                        )
                    `)
                    .eq('oid', userId);

                if (error || !items) {
                    setState(prev => ({ ...prev, loading: false }));
                    return;
                }

                // Fetch current bids
                const itemIds = items.map(item => item.iid);
                let bidsMap = {};

                if (itemIds.length > 0) {
                    const { data: bids } = await supabase
                        .from('current_bid')
                        .select('iid, current_price')
                        .in('iid', itemIds);

                    if (bids) {
                        bidsMap = bids.reduce((acc, bid) => {
                            acc[bid.iid] = bid;
                            return acc;
                        }, {});
                    }
                }

                setState({
                    allItems: items,
                    currentBids: bidsMap,
                    loading: false
                });

            } catch (error) {
                console.error('[Listings] Error:', error);
                setState(prev => ({ ...prev, loading: false }));
            }
        };

        fetchListings();
    }, [userId, supabase]);

    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="md" className="text-blue-500" />
            </div>
        );
    }


    if (!state.allItems || state.allItems.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl text-gray-500">No listings yet</p>
            </div>
        );
    }

    return (
        <Tab.Group>
            {/* Filter Tabs */}
            <Tab.List className="flex gap-2 mb-6">
                {filterCategories.map((category) => (
                    <Tab key={category} as={Fragment}>
                        {({ selected }) => (
                            <button
                                className={classNames(
                                    'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                                    selected
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                            >
                                {category}
                            </button>
                        )}
                    </Tab>
                ))}
            </Tab.List>

            {/* Filtered Items */}
            <Tab.Panels>
                {filterCategories.map((category) => {
                    const filteredItems = filterItems(state.allItems, category);

                    return (
                        <Tab.Panel key={category}>
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    No {category.toLowerCase()} listings
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredItems.map(item => (
                                        <ItemCard
                                            key={item.iid}
                                            item={item}
                                            currentBid={state.currentBids[item.iid]}
                                            supabase={supabase}
                                        />
                                    ))}
                                </div>
                            )}
                        </Tab.Panel>
                    );
                })}
            </Tab.Panels>
        </Tab.Group>
    );
}
