'use client';

import { useEffect, useState } from "react";
import { supabaseBrowser } from '@/utils/supabase/client';
import PopulateReviews from './Reviews';
import Listings from './Listings';
import Settings from './Settings';
import WalletModal from '@/components/wallet/WalletModal';

// Helper function to calculate time ago
function getTimeAgo(dateString) {
    if (!dateString) return 'Recently';

    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return 'Today';
}

export default function ProfilePage({ session }) {
    const [tab, setTab] = useState("Listings");
    const [userid, setUserid] = useState("");
    const [username, setUsername] = useState("");
    const [avatarPath, setAvatarPath] = useState("");
    const [loading, setLoading] = useState(true);
    const [reviewData, setReviewData] = useState(null);
    const [reviewError, setReviewError] = useState(null);
    const [reviewStars, setReviewStars] = useState(0);
    const [formattedReviews, setFormattedReviews] = useState([]);
    const [items, setItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [joinedDate, setJoinedDate] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);
    const [stats, setStats] = useState({
        listed: 0,
        sold: 0,
        bought: 0
    });
    const supabase = supabaseBrowser();

    useEffect(() => {
        if (!session || !session.user) {
            setUserid("");
            setUsername("Unknown User");
            setAvatarPath("");
            setLoading(false);
            return;
        }

        const user = session.user;
        setUserid(user.id);
        setUsername(user.user_metadata.username || "Unknown User");

        supabase
            .from('profile')
            .select('*')
            .eq('id', user.id)
            .single()
            .then(({ data, error }) => {
                if (!error && data) {
                    setAvatarPath(data.object_path);
                    setProfileData(data);
                    setJoinedDate(getTimeAgo(data.created_at));
                    setWalletBalance(parseFloat(data.wallet_balance || 0));
                } else {
                    setAvatarPath("");
                }
                setLoading(false);
            });
    }, [session, supabase]);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!session || !session.user || !session.user.id) {
                setReviewError(null);
                setReviewData(null);
                setFormattedReviews([]);
                setReviewStars(0);
                return;
            }

            const userId = session.user.id;
            const { data: reviews, error } = await supabase
                .from('review')
                .select('*')
                .eq('reviewee_id', userId);

            if (error) {
                setReviewError(error);
                setReviewData(null);
                setFormattedReviews([]);
                setReviewStars(0);
                return;
            }

            setReviewError(null);
            setReviewData(reviews);

            let totalStars = 0;
            const reviewsWithUsernames = await Promise.all(
                reviews.map(async (review) => {
                    totalStars += review.stars;
                    const { data: profileData } = await supabase
                        .from('profile')
                        .select('username, object_path')
                        .eq('id', review.reviewer_id)
                        .single();

                    return {
                        reviewer: profileData?.username || "Anonymous",
                        timeCreated: review.time_created,
                        review: review.review,
                        stars: review.stars,
                        avatarUrl: profileData?.object_path
                            ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/avatar/${profileData.object_path}`
                            : "/default-avatar.jpg"
                    };
                })
            );

            setFormattedReviews(reviewsWithUsernames);
            setReviewStars(reviews.length ? (totalStars / reviews.length).toFixed(2) : 0);
        };

        fetchReviews();
    }, [session, supabase]);

    useEffect(() => {
        const fetchItems = async () => {
            if (!session || !session.user || !session.user.id) {
                setItems([]);
                return;
            }

            setItemsLoading(true);
            const userId = session.user.id;

            const { data: itemsData, error } = await supabase
                .from('item')
                .select(`
                    iid,
                    title,
                    description,
                    min_bid,
                    item_bucket,
                    object_path,
                    auction:aid (
                        aid,
                        end_time,
                        start_time
                    )
                `)
                .eq('oid', userId);

            if (error) {
                console.error('Error fetching items:', error);
                setItems([]);
                setItemsLoading(false);
                return;
            }

            const itemsWithBids = await Promise.all(
                itemsData.map(async (item) => {
                    const { data: bidData } = await supabase
                        .from('current_bid')
                        .select('current_price, bid_datetime')
                        .eq('iid', item.iid)
                        .single();

                    return {
                        iid: item.iid,
                        title: item.title,
                        description: item.description,
                        minBid: item.min_bid,
                        itemBucket: item.item_bucket,
                        objectPath: item.object_path,
                        aid: item.auction?.aid,
                        auctionEndTime: item.auction?.end_time,
                        startTime: item.auction?.start_time,
                        currentBid: bidData?.current_price || null,
                        lastBidTime: bidData?.bid_datetime || null
                    };
                })
            );

            setItems(itemsWithBids);

            // Calculate current listings (not ended yet)
            const now = new Date();
            const currentListings = itemsWithBids.filter(
                item => new Date(item.auctionEndTime) > now
            ).length;

            setStats(prev => ({ ...prev, listed: currentListings }));
            setItemsLoading(false);
        };

        fetchItems();
    }, [session, supabase]);

    // Fetch sold and bought stats
    useEffect(() => {
        const fetchStats = async () => {
            if (!session || !session.user || !session.user.id) return;

            const userId = session.user.id;

            // Count sold items (user was seller and auction ended with a bid)
            const { data: soldItems } = await supabase
                .from('item')
                .select(`
                    iid,
                    auction:aid (
                        end_time
                    )
                `)
                .eq('oid', userId);

            // Filter sold items (ended auctions with bids)
            const soldWithBids = await Promise.all(
                (soldItems || []).map(async (item) => {
                    const { data: bid } = await supabase
                        .from('current_bid')
                        .select('iid')
                        .eq('iid', item.iid)
                        .single();

                    const ended = new Date(item.auction?.end_time) < new Date();
                    return bid && ended ? item : null;
                })
            );

            const actualSold = soldWithBids.filter(item => item !== null).length;

            // Count bought items (user won the bid on ended auctions)
            const { data: boughtItems } = await supabase
                .from('current_bid')
                .select(`
                    iid,
                    uid,
                    item:iid (
                        auction:aid (
                            end_time
                        )
                    )
                `)
                .eq('uid', userId);

            const actualBought = (boughtItems || []).filter(
                item => new Date(item.item?.auction?.end_time) < new Date()
            ).length;

            setStats(prev => ({
                ...prev,
                sold: actualSold,
                bought: actualBought
            }));
        };

        fetchStats();
    }, [session, supabase]);

    return (
        <div className="pb-10 min-h-screen px-4 sm:px-6 lg:px-8">
            {/* Settings Modal */}
            <Settings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                userId={userid}
                currentData={profileData}
            />

            {/* Wallet Modal */}
            <WalletModal
                isOpen={isWalletOpen}
                onClose={() => setIsWalletOpen(false)}
            />

            {/* Profile Banner */}
            <div className="w-full max-w-6xl bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 lg:p-8 mx-auto mt-4 sm:mt-8 shadow-xl border border-gray-600">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                    {/* Avatar and Name Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 flex-1">
                        <div className="relative flex-shrink-0">
                            <img
                                src={
                                    avatarPath
                                        ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/avatar/${avatarPath}`
                                        : "/default-avatar.jpg"
                                }
                                alt="User Avatar"
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-600 object-cover ring-4 ring-gray-600 shadow-lg"
                            />
                        </div>
                        <div className="text-center sm:text-left">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                                {loading ? "Loading..." : username}
                            </div>
                            <button className="text-sm mt-2 flex items-center justify-center sm:justify-start gap-2 text-gray-300 hover:text-white transition">
                                Share <span>🔗</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="flex flex-col items-center sm:items-end justify-center text-center sm:text-right">
                        <div className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-white">
                            {isNaN(reviewStars) || reviewStars === 0 ? "No reviews" : reviewStars}
                            <span className="text-yellow-400 text-2xl sm:text-3xl">⭐</span>
                        </div>
                        <div className="text-sm sm:text-base text-gray-300 mt-1">
                            {stats.listed} Listed | {stats.sold} Sold | {stats.bought} Bought
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400 mt-1">
                            Joined {joinedDate}
                        </div>
                    </div>

                    {/* Setting Button */}
                    <div className="w-full sm:w-auto mt-4 sm:mt-0">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="w-full sm:w-auto bg-gray-600 text-white px-6 py-2.5 rounded-xl font-semibold text-base hover:bg-gray-500 transition shadow-md"
                        >
                            Setting
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto mt-6 sm:mt-10">
                <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                    {["Listings", "Analytics", "Reviews"].map(item => (
                        <button
                            key={item}
                            onClick={() => setTab(item)}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                                tab === item
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                    {/* Wallet Button - Clickable */}
                    <button
                        onClick={() => setIsWalletOpen(true)}
                        className="w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0 px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm sm:text-base bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 shadow-md transition"
                    >
                        💰 Wallet: ${walletBalance.toFixed(2)}
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="max-w-6xl mx-auto mt-4 sm:mt-6 border-t-2 border-gray-700" />

            {/* Tab Panels */}
            <div className="mt-6 sm:mt-10 max-w-6xl mx-auto min-h-[400px]">
                {tab === "Listings" && (
                    <div className="w-full">
                        {itemsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-gray-400 text-lg sm:text-xl">Loading listings...</div>
                            </div>
                        ) : (
                            <Listings items={items} />
                        )}
                    </div>
                )}
                {tab === "Analytics" && (
                    <div className="w-full flex items-center justify-center py-20">
                        <div className="text-gray-400 text-lg sm:text-xl">Analytics Coming Soon</div>
                    </div>
                )}
                {tab === "Reviews" && (
                    <div className="w-full">
                        {reviewError && (
                            <div className="text-red-400 text-center py-10">
                                Error: {reviewError.message}
                            </div>
                        )}
                        {!reviewError && !reviewData && (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-gray-400 text-lg sm:text-xl">Loading reviews...</div>
                            </div>
                        )}
                        {!reviewError && reviewData && reviewData.length === 0 && (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-gray-400 text-lg sm:text-xl">No reviews yet</div>
                            </div>
                        )}
                        {!reviewError && reviewData && reviewData.length > 0 && (
                            <PopulateReviews reviews={formattedReviews} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
