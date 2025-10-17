// 'use client';

// import { useEffect, useState } from "react";
// import { supabaseBrowser } from '@/utils/supabase/client';
// import { useParams } from 'next/navigation';
// import PopulateReviews from '@/components/Profile/Review';
// import Listings from '@/components/Profile/Listings';
// import getTimeAgo from '@/utils/getTimeAgo';

// export default function PublicProfile() {
//     const params = useParams();
//     const userId = params.userId;
//     const [tab, setTab] = useState("Listings");
//     const [username, setUsername] = useState("");
//     const [avatarPath, setAvatarPath] = useState("");
//     const [loading, setLoading] = useState(true);
//     const [reviewData, setReviewData] = useState(null);
//     const [reviewStars, setReviewStars] = useState(0);
//     const [formattedReviews, setFormattedReviews] = useState([]);
//     const [items, setItems] = useState([]);
//     const [itemsLoading, setItemsLoading] = useState(false);
//     const [joinedDate, setJoinedDate] = useState('');
//     const [stats, setStats] = useState({
//         listed: 0,
//         sold: 0,
//         bought: 0
//     });
//     const [notFound, setNotFound] = useState(false);
//     const supabase = supabaseBrowser();

//     useEffect(() => {
//         const fetchProfile = async () => {
//             if (!userId) return;

//             const { data, error } = await supabase
//                 .from('profile')
//                 .select('username, object_path, created_at')
//                 .eq('id', userId)
//                 .single();

//             if (error || !data) {
//                 setNotFound(true);
//                 setLoading(false);
//                 return;
//             }

//             setUsername(data.username || "Unknown User");
//             setAvatarPath(data.object_path);
//             setJoinedDate(getTimeAgo({ datetime: data.created_at }));
//             setLoading(false);
//         };

//         fetchProfile();
//     }, [userId, supabase]);

//     useEffect(() => {
//         const fetchReviews = async () => {
//             if (!userId) return;

//             const { data: reviews, error } = await supabase
//                 .from('review')
//                 .select('*')
//                 .eq('reviewee_id', userId);

//             if (error || !reviews) {
//                 setReviewData([]);
//                 return;
//             }

//             setReviewData(reviews);

//             let totalStars = 0;
//             const reviewsWithUsernames = await Promise.all(
//                 reviews.map(async (review) => {
//                     totalStars += review.stars;
//                     const { data: profileData } = await supabase
//                         .from('profile')
//                         .select('username, object_path')
//                         .eq('id', review.reviewer_id)
//                         .single();

//                     return {
//                         reviewer: profileData?.username || "Anonymous",
//                         timeCreated: review.time_created,
//                         review: review.review,
//                         stars: review.stars,
//                         avatarUrl: profileData?.object_path
//                             ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/avatar/${profileData.object_path}`
//                             : "/default-avatar.jpg"
//                     };
//                 })
//             );

//             setFormattedReviews(reviewsWithUsernames);
//             setReviewStars(reviews.length ? (totalStars / reviews.length).toFixed(2) : 0);
//         };

//         fetchReviews();
//     }, [userId, supabase]);

//     useEffect(() => {
//         const fetchItems = async () => {
//             if (!userId) return;

//             setItemsLoading(true);

//             const { data: itemsData, error } = await supabase
//                 .from('item')
//                 .select(`
//                     iid,
//                     title,
//                     description,
//                     min_bid,
//                     item_bucket,
//                     object_path,
//                     auction:aid (
//                         aid,
//                         end_time,
//                         start_time
//                     )
//                 `)
//                 .eq('oid', userId);

//             if (error) {
//                 setItems([]);
//                 setItemsLoading(false);
//                 return;
//             }

//             const itemsWithBids = await Promise.all(
//                 itemsData.map(async (item) => {
//                     const { data: bidData } = await supabase
//                         .from('current_bid')
//                         .select('current_price, bid_datetime')
//                         .eq('iid', item.iid)
//                         .single();

//                     return {
//                         iid: item.iid,
//                         title: item.title,
//                         description: item.description,
//                         minBid: item.min_bid,
//                         itemBucket: item.item_bucket,
//                         objectPath: item.object_path,
//                         aid: item.auction?.aid,
//                         auctionEndTime: item.auction?.end_time,
//                         startTime: item.auction?.start_time,
//                         currentBid: bidData?.current_price || null,
//                         lastBidTime: bidData?.bid_datetime || null
//                     };
//                 })
//             );

//             setItems(itemsWithBids);

//             const now = new Date();
//             const currentListings = itemsWithBids.filter(
//                 item => new Date(item.auctionEndTime) > now
//             ).length;

//             setStats(prev => ({ ...prev, listed: currentListings }));
//             setItemsLoading(false);
//         };

//         fetchItems();
//     }, [userId, supabase]);

//     useEffect(() => {
//         const fetchStats = async () => {
//             if (!userId) return;

//             const { data: soldItems } = await supabase
//                 .from('item')
//                 .select(`
//                     iid,
//                     auction:aid (
//                         end_time
//                     )
//                 `)
//                 .eq('oid', userId);

//             const soldWithBids = await Promise.all(
//                 (soldItems || []).map(async (item) => {
//                     const { data: bid } = await supabase
//                         .from('current_bid')
//                         .select('iid')
//                         .eq('iid', item.iid)
//                         .single();

//                     const ended = new Date(item.auction?.end_time) < new Date();
//                     return bid && ended ? item : null;
//                 })
//             );

//             const actualSold = soldWithBids.filter(item => item !== null).length;

//             const { data: boughtItems } = await supabase
//                 .from('current_bid')
//                 .select(`
//                     iid,
//                     uid,
//                     item:iid (
//                         auction:aid (
//                             end_time
//                         )
//                     )
//                 `)
//                 .eq('uid', userId);

//             const actualBought = (boughtItems || []).filter(
//                 item => new Date(item.item?.auction?.end_time) < new Date()
//             ).length;

//             setStats(prev => ({
//                 ...prev,
//                 sold: actualSold,
//                 bought: actualBought
//             }));
//         };

//         fetchStats();
//     }, [userId, supabase]);

//     const handleShareProfile = () => {
//         if (typeof window === 'undefined') return;

//         const shareUrl = window.location.href; // Uses current URL

//         navigator.clipboard.writeText(shareUrl).then(() => {
//             alert(`Profile link copied! Share this link:\n${shareUrl}`);
//         }).catch(() => {
//             alert(`Share this link:\n${shareUrl}`);
//         });
//     };

//     if (notFound) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <div className="text-center">
//                     <h1 className="text-4xl font-bold text-white mb-4">User Not Found</h1>
//                     <p className="text-gray-400">This profile doesn't exist or has been removed.</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="pb-10 min-h-screen px-4 sm:px-6 lg:px-8">
//             {/* Profile Banner */}
//             <div className="w-full max-w-6xl bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 lg:p-8 mx-auto mt-4 sm:mt-8 shadow-xl border border-gray-600">
//                 <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
//                     <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 flex-1">
//                         <div className="relative flex-shrink-0">
//                             <img
//                                 src={
//                                     avatarPath
//                                         ? `https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/avatar/${avatarPath}`
//                                         : "/default-avatar.jpg"
//                                 }
//                                 alt="User Avatar"
//                                 className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-600 object-cover ring-4 ring-gray-600 shadow-lg"
//                             />
//                         </div>
//                         <div className="text-center sm:text-left">
//                             <div className="text-2xl sm:text-3xl font-bold text-white">
//                                 {loading ? "Loading..." : username}
//                             </div>
//                             {/* Share button for public profile */}
//                             <button
//                                 onClick={handleShareProfile}
//                                 className="text-sm mt-2 flex items-center justify-center sm:justify-start gap-2 text-gray-300 hover:text-white transition"
//                             >
//                                 Share <span>🔗</span>
//                             </button>
//                         </div>
//                     </div>

//                     <div className="flex flex-col items-center sm:items-end justify-center text-center sm:text-right">
//                         <div className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-white">
//                             {isNaN(reviewStars) || reviewStars === 0 ? "No reviews" : reviewStars}
//                             <span className="text-yellow-400 text-2xl sm:text-3xl">⭐</span>
//                         </div>
//                         <div className="text-sm sm:text-base text-gray-300 mt-1">
//                             {stats.listed} Listed | {stats.sold} Sold | {stats.bought} Bought
//                         </div>
//                         <div className="text-xs sm:text-sm text-gray-400 mt-1">
//                             Joined {joinedDate}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Tabs - Only Listings and Reviews */}
//             <div className="max-w-6xl mx-auto mt-6 sm:mt-10">
//                 <div className="flex gap-2 sm:gap-3">
//                     {["Listings", "Reviews"].map(item => (
//                         <button
//                             key={item}
//                             onClick={() => setTab(item)}
//                             className={`flex-1 px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${
//                                 tab === item
//                                     ? "bg-blue-600 text-white shadow-md"
//                                     : "bg-gray-700 text-gray-300 hover:bg-gray-600"
//                             }`}
//                         >
//                             {item}
//                         </button>
//                     ))}
//                 </div>
//             </div>

//             <div className="max-w-6xl mx-auto mt-4 sm:mt-6 border-t-2 border-gray-700" />

//             {/* Tab Panels */}
//             <div className="mt-6 sm:mt-10 max-w-6xl mx-auto min-h-[400px]">
//                 {tab === "Listings" && (
//                     <div className="w-full">
//                         {(
//                             <Listings items={items} isPublicView={true} />
//                         )}
//                     </div>
//                 )}
//                 {tab === "Reviews" && (
//                     <div className="w-full">
//                         {reviewData && reviewData.length === 0 && (
//                             <div className="flex items-center justify-center py-20">
//                                 <div className="text-gray-400 text-lg sm:text-xl">No reviews yet</div>
//                             </div>
//                         )}
//                         {reviewData && reviewData.length > 0 && (
//                             <PopulateReviews reviews={formattedReviews} />
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
