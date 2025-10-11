'use client';

import { useState, useEffect } from 'react';
import { calculateEffectiveEndTime } from './BidHandler';

// Countdown Timer Component
function CountdownTimer({ endTime }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('Ended');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    if (isExpired) {
        return <span className="text-red-400 font-semibold">Ended</span>;
    }

    const timeInMinutes = (new Date(endTime) - new Date()) / 1000 / 60;
    const isUrgent = timeInMinutes < 5;

    return (
        <span className={`font-semibold ${isUrgent ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
            {timeLeft}
        </span>
    );
}

export default function Listings({ items }) {
    const [filter, setFilter] = useState('all');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every second for filtering
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const filteredItems = items.filter(item => {
        if (!item.auctionEndTime) return false;

        const effectiveEndTime = calculateEffectiveEndTime(item.auctionEndTime, item.lastBidTime);
        const isExpired = currentTime > effectiveEndTime;

        if (filter === 'all') return true;
        if (filter === 'past') return isExpired;
        if (filter === 'current') return !isExpired;
        return true;
    });

    return (
        <div className="w-full">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                        filter === 'all'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('current')}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                        filter === 'current'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    Current
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                        filter === 'past'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    Past
                </button>
            </div>

            {/* Grid Layout */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-lg sm:text-xl">
                    No listings found
                </div>
            ) : (
                <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredItems.map((item) => {
                        const effectiveEndTime = calculateEffectiveEndTime(item.auctionEndTime, item.lastBidTime);
                        const isExpired = currentTime > effectiveEndTime;

                        // Check if was extended
                        const auctionEnd = new Date(item.auctionEndTime);
                        const wasExtended = item.lastBidTime && effectiveEndTime > auctionEnd;

                        return (
                            <li
                                key={item.iid}
                                className="col-span-1 flex flex-col rounded-2xl bg-gray-800 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all overflow-hidden border border-gray-700"
                            >
                                <div className="flex flex-1 flex-col">
                                    <img
                                        className="w-full h-40 sm:h-48 object-cover"
                                        src={
                                            item.objectPath
                                                ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/${item.itemBucket}/${item.objectPath}`
                                                : "/default-item.jpg"
                                        }
                                        alt={item.title}
                                    />
                                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                                        <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                                            {item.description}
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Min Bid:</span>
                                                <span className="inline-flex items-center rounded-lg bg-green-900/30 px-2.5 py-1 text-xs sm:text-sm font-semibold text-green-400 ring-1 ring-inset ring-green-400/30">
                                                    ${item.minBid}
                                                </span>
                                            </div>
                                            {item.currentBid && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">Current:</span>
                                                    <span className="inline-flex items-center rounded-lg bg-blue-900/30 px-2.5 py-1 text-xs sm:text-sm font-semibold text-blue-400 ring-1 ring-inset ring-blue-400/30">
                                                        ${item.currentBid}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="pt-3 space-y-2">
                                                {isExpired ? (
                                                    <div className="text-center py-2 bg-red-900/30 rounded-lg">
                                                        <span className="text-red-400 font-semibold">Ended</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-500">Time Left:</span>
                                                            <CountdownTimer endTime={effectiveEndTime} />
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Ends: {effectiveEndTime.toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                second: '2-digit'
                                                            })}
                                                        </div>
                                                        {wasExtended && (
                                                            <div className="inline-flex items-center gap-1 text-yellow-400 text-xs">
                                                                <span>⚡</span>
                                                                <span>Extended (Anti-snipe)</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-gray-700">
                                    <div className="flex divide-x divide-gray-700">
                                        <a
                                            href={`/auction/${item.aid}`}
                                            className="flex-1 inline-flex items-center justify-center py-3 text-sm font-semibold text-blue-400 hover:bg-gray-700 transition"
                                        >
                                            View
                                        </a>
                                        <button className="flex-1 inline-flex items-center justify-center py-3 text-sm font-semibold text-blue-400 hover:bg-gray-700 transition">
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
