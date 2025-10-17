'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import Link from 'next/link';

export default function Listings({ items, isPublicView = false }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [auctionsData, setAuctionsData] = useState({});
    const supabase = supabaseBrowser();

    // Fetch auction details for all items
    useEffect(() => {
        const fetchAuctionsData = async () => {
            const auctionIds = [...new Set(items.map(item => item.aid).filter(Boolean))];

            if (auctionIds.length === 0) return;

            // Use "name" instead of "title" - that's the correct column name!
            const { data, error } = await supabase
                .from('auction')
                .select('aid, name, end_time, thumbnail_bucket, object_path')
                .in('aid', auctionIds);

            if (!error && data) {
                const auctionsMap = {};
                data.forEach(auction => {
                    auctionsMap[auction.aid] = auction;
                });
                setAuctionsData(auctionsMap);
            }
        };

        if (items.length > 0) {
            fetchAuctionsData();
        }
    }, [items, supabase]);

    if (!items || items.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-400 text-lg sm:text-xl">No listings yet</div>
            </div>
        );
    }

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAuctionStatus = (endTime) => {
        if (!endTime) return 'Unknown';
        const now = new Date();
        const end = new Date(endTime);
        return end > now ? 'Active' : 'Ended';
    };

    const getTimeRemaining = (endTime) => {
        if (!endTime) return 'N/A';
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;

        if (diff <= 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    return (
        <>
            {/* Edit Modal */}
            {isEditModalOpen && selectedItem && (
                <EditListingModal
                    item={selectedItem}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedItem(null);
                    }}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                    const status = getAuctionStatus(item.auctionEndTime);
                    const imageUrl = item.objectPath
                        ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/${item.itemBucket}/${item.objectPath}`
                        : '/placeholder-item.jpg';

                    const auctionInfo = auctionsData[item.aid];

                    // Use auction thumbnail from auction table - proper fallback chain
                    let auctionThumbnail = imageUrl; // Fallback to item image
                    let auctionTitle = 'View Auction'; // Default title

                    if (auctionInfo) {
                        // Try to get auction thumbnail
                        if (auctionInfo.object_path && auctionInfo.thumbnail_bucket) {
                            auctionThumbnail = `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/${auctionInfo.thumbnail_bucket}/${auctionInfo.object_path}`;
                        }

                        // Set auction title from "name" column
                        if (auctionInfo.name) {
                            auctionTitle = auctionInfo.name;
                        }
                    }

                    // Check if auction is still active
                    const isAuctionActive = status === 'Active';

                    return (
                        <div
                            key={item.iid}
                            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all hover:shadow-xl flex flex-col"
                        >
                            {/* Item Image */}
                            <div className="relative h-48 bg-gray-700">
                                <img
                                    src={imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-item.jpg';
                                    }}
                                />
                                {/* Status Badge */}
                                <div
                                    className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                        status === 'Active'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-red-600 text-white'
                                    }`}
                                >
                                    {status}
                                </div>
                            </div>

                            {/* Item Details */}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-white mb-2 truncate">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-400 mb-3 line-clamp-2 flex-grow">
                                    {item.description || 'No description'}
                                </p>

                                {/* Bottom section */}
                                <div className="mt-auto">
                                    {/* Bid Info */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Min Bid:</span>
                                            <span className="text-sm font-semibold text-white">
                                                ${item.minBid?.toFixed(2) || '0.00'}
                                            </span>
                                        </div>
                                        {item.currentBid && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Current Bid:</span>
                                                <span className="text-sm font-semibold text-green-400">
                                                    ${item.currentBid.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Time Info */}
                                    <div className="space-y-1 mb-4 text-xs text-gray-400">
                                        {status === 'Active' && (
                                            <div className="flex justify-between">
                                                <span>Time Left:</span>
                                                <span className="font-semibold text-yellow-400">
                                                    {getTimeRemaining(item.auctionEndTime)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Ends:</span>
                                            <span>{formatDateTime(item.auctionEndTime)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        {/* View Auction Button - Show if aid exists and status is Active */}
                                        {item.aid && isAuctionActive && (
                                            <Link
                                                href={`/auction/${item.aid}`}
                                                className="flex items-center gap-3 w-full px-3 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition group"
                                            >
                                                <img
                                                    src={auctionThumbnail}
                                                    alt={auctionTitle}
                                                    className="w-10 h-10 object-cover rounded flex-shrink-0"
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder-item.jpg';
                                                    }}
                                                />
                                                <div className="flex-1 text-left overflow-hidden min-w-0">
                                                    <p className="text-xs text-gray-400">View Auction</p>
                                                    <p className="text-sm font-bold truncate group-hover:text-blue-400 transition">
                                                        {auctionTitle}
                                                    </p>
                                                </div>
                                            </Link>
                                        )}

                                        {/* Edit Button - Only for owners */}
                                        {!isPublicView && (
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition"
                                            >
                                                Edit Listing
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

// Edit Listing Modal Component
function EditListingModal({ item, isOpen, onClose }) {
    const [formData, setFormData] = useState({
        title: item.title || '',
        description: item.description || '',
        minBid: item.minBid || 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [auctionData, setAuctionData] = useState(null);
    const [hasBids, setHasBids] = useState(false);
    const [isLoadingBids, setIsLoadingBids] = useState(true);
    const supabase = supabaseBrowser();

    useEffect(() => {
        const fetchAuctionData = async () => {
            if (!item.aid) return;

            // Use "name" instead of "title"
            const { data, error } = await supabase
                .from('auction')
                .select('aid, name, start_time, end_time, thumbnail_bucket, object_path')
                .eq('aid', item.aid)
                .single();

            if (!error && data) {
                setAuctionData(data);
            }
        };

        fetchAuctionData();
    }, [item.aid, supabase]);

    useEffect(() => {
        const checkBids = async () => {
            setIsLoadingBids(true);

            const { data, error } = await supabase
                .from('current_bid')
                .select('iid')
                .eq('iid', item.iid)
                .maybeSingle();

            if (!error && data) {
                setHasBids(true);
            } else {
                setHasBids(false);
            }

            setIsLoadingBids(false);
        };

        checkBids();
    }, [item.iid, supabase]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'minBid' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (hasBids && formData.minBid !== item.minBid) {
            alert('Invalid action: Cannot change minimum bid after bids have been placed on this item.');
            return;
        }

        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('item')
                .update({
                    title: formData.title,
                    description: formData.description,
                    min_bid: formData.minBid,
                })
                .eq('iid', item.iid);

            if (error) {
                console.error('Update error:', error);
                alert('Failed to update item. Please try again.');
            } else {
                alert('Item updated successfully!');
                window.location.reload();
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            alert('An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const auctionThumbnail = auctionData?.object_path
        ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/${auctionData.thumbnail_bucket}/${auctionData.object_path}`
        : item.objectPath
        ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/${item.itemBucket}/${item.objectPath}`
        : '/placeholder-item.jpg';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-white">Edit Listing</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-3xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex gap-4 items-start bg-gray-700 p-4 rounded-lg">
                        <img
                            src={
                                item.objectPath
                                    ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/${item.itemBucket}/${item.objectPath}`
                                    : '/placeholder-item.jpg'
                            }
                            alt={item.title}
                            className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                            <h3 className="font-bold text-white">{item.title}</h3>
                            <p className="text-sm text-gray-400">Item ID: {item.iid}</p>
                            {hasBids && (
                                <p className="text-xs text-yellow-400 mt-1">
                                    ⚠️ This item has active bids
                                </p>
                            )}
                        </div>
                    </div>

                    {auctionData && (
                        <Link
                            href={`/auction/${item.aid}`}
                            target="_blank"
                            className="flex gap-4 items-center bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition group"
                        >
                            <img
                                src={auctionThumbnail}
                                alt="Auction"
                                className="w-16 h-16 object-cover rounded-lg"
                                onError={(e) => {
                                    e.target.src = '/placeholder-item.jpg';
                                }}
                            />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-400">Part of Auction</p>
                                <p className="text-white font-bold group-hover:text-blue-400 transition">
                                    {auctionData.name || `Auction #${item.aid}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Click to view auction page →
                                </p>
                            </div>
                        </Link>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Minimum Bid ($)
                            {hasBids && (
                                <span className="text-xs text-red-400 ml-2">
                                    (Cannot be changed - item has bids)
                                </span>
                            )}
                        </label>
                        <input
                            type="number"
                            name="minBid"
                            value={formData.minBid}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            disabled={hasBids}
                            className={`w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 ${
                                hasBids ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            required
                        />
                        {hasBids && (
                            <p className="text-xs text-gray-400 mt-1">
                                The minimum bid cannot be changed once bids have been placed.
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || isLoadingBids}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : isLoadingBids ? 'Loading...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
