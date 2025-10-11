'use client';

import { useEffect, useState } from "react";
import { supabaseBrowser } from '@/utils/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
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

export default function ProfilePage() {
    const { isAuthed } = useSupabaseAuth();
    const [session, setSession] = useState(null);
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
    const [stats, setStats] = useState({ listed: 0, sold: 0, bought: 0 });

    const supabase = supabaseBrowser();

    // Fetch session when isAuthed changes
    useEffect(() => {
        if (!isAuthed) {
            setSession(null);
            setUserid("");
            setUsername("Unknown User");
            setAvatarPath("");
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
    }, [isAuthed, supabase]);

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

            const now = new Date();
            const currentListings = itemsWithBids.filter(
                item => new Date(item.auctionEndTime) > now
            ).length;

            setStats(prev => ({ ...prev, listed: currentListings }));
            setItemsLoading(false);
        };

        fetchItems();
    }, [session, supabase]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!session || !session.user || !session.user.id) return;

            const userId = session.user.id;

            const { data: soldItems } = await supabase
                .from('item')
                .select(`
          iid,
          auction:aid (
            end_time
          )
        `)
                .eq('oid', userId);

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

    const handleShareProfile = () => {
        if (typeof window === 'undefined' || !userid) return;

        const shareUrl = `${window.location.origin}/user/${userid}`;

        navigator.clipboard.writeText(shareUrl).then(() => {
            alert(`Profile link copied! Share this link:\n${shareUrl}`);
        }).catch(() => {
            alert(`Share this link:\n${shareUrl}`);
        });
    };

    // REST OF YOUR COMPONENT JSX STAYS THE SAME...
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* Settings Modal */}
            {isSettingsOpen && (
                <Settings
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    userId={userid}
                    currentData={profileData}
                />
            )}

            {/* Wallet Modal */}
            {isWalletOpen && (
                <WalletModal
                    isOpen={isWalletOpen}
                    onClose={() => setIsWalletOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Profile Header */}
                <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 mb-6 shadow-2xl border border-gray-700">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl">
                                <img
                                    src={
                                        avatarPath
                                            ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/avatar/${avatarPath}`
                                            : "/default-avatar.jpg"
                                    }
                                    alt={username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                <h1 className="text-3xl sm:text-4xl font-bold">{username}</h1>
                                <div className="flex items-center justify-center sm:justify-start gap-1">
                                    <span className="text-2xl text-yellow-400">⭐</span>
                                    <span className="text-xl font-semibold">{reviewStars}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-gray-400 text-sm mb-4">
                                <span className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{stats.listed}</span> Listed
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{stats.sold}</span> Sold
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{stats.bought}</span> Bought
                                </span>
                                <span>Joined {joinedDate}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                                <button
                                    onClick={() => setIsWalletOpen(true)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-lg font-semibold shadow-lg transition-all hover:shadow-green-500/50"
                                >
                                    💰 Wallet: ${walletBalance.toFixed(2)}
                                </button>
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold shadow-lg transition-all"
                                >
                                    ⚙️ Settings
                                </button>
                                <button
                                    onClick={handleShareProfile}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold shadow-lg transition-all"
                                >
                                    🔗 Share Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
                    {/* Tab Headers */}
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setTab("Listings")}
                            className={`flex-1 px-6 py-4 font-semibold transition-all ${tab === "Listings"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                        >
                            📦 Listings
                        </button>
                        <button
                            onClick={() => setTab("Reviews")}
                            className={`flex-1 px-6 py-4 font-semibold transition-all ${tab === "Reviews"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                        >
                            ⭐ Reviews ({reviewData?.length || 0})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {tab === "Listings" && (
                            itemsLoading ? (
                                <div className="flex justify-center py-20">
                                    <div className="text-gray-400 text-xl">Loading listings...</div>
                                </div>
                            ) : (
                                <Listings items={items} isPublicView={false} />
                            )
                        )}

                        {tab === "Reviews" && (
                            <PopulateReviews reviews={formattedReviews} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
