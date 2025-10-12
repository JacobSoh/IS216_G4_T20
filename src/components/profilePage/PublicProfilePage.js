'use client';

import { useEffect, useState } from "react";
import { supabaseBrowser } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import PopulateReviews from './Reviews';
import Listings from './Listings';
import Spinner from '@/components/SpinnerComponent';

// Helper function to calculate time ago (EXACT SAME AS PROFILEPAGE)
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

export default function PublicProfile() {
    const params = useParams();
    const username = params.username;
    const supabase = supabaseBrowser();

    // Single state object
    const [state, setState] = useState({
        user: null,
        avatarUrl: '',
        loading: true,
        tab: "Listings",
        joinedAgo: '',
        showCopyToast: false,
        stats: {
            currentListings: 0,
            itemsSold: 0,
            itemsBought: 0,
            avgRating: 0,
            totalReviews: 0
        },
        notFound: false
    });

    // Helper to update state
    const updateState = (updates) => setState(prev => ({ ...prev, ...updates }));

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Single useEffect for all data loading
    useEffect(() => {
        if (!username) return;

        const fetchAllData = async () => {
            try {
                // Fetch profile
                const { data, error } = await supabase
                    .from('profile')
                    .select('id, username, first_name, last_name, avatar_bucket, object_path, created_at')
                    .ilike('username', username)
                    .single();

                if (error || !data) {
                    updateState({ notFound: true, loading: false });
                    return;
                }

                // Get avatar URL
                let avatarUrl = '';
                if (data.object_path) {
                    const { data: avatarData } = supabase.storage
                        .from(data.avatar_bucket || 'avatar')
                        .getPublicUrl(data.object_path);
                    avatarUrl = avatarData.publicUrl;
                }

                // Update basic profile info using getTimeAgo function
                updateState({
                    user: data,
                    avatarUrl,
                    joinedAgo: getTimeAgo(data.created_at)
                });

                // Fetch user stats
                const userId = data.id;

                // Fetch items for current listings
                const { data: items } = await supabase
                    .from('item')
                    .select(`
                        iid,
                        auction:aid (
                            end_time
                        )
                    `)
                    .eq('oid', userId);

                const now = new Date();
                const currentListings = items?.filter(item =>
                    item.auction?.end_time && new Date(item.auction.end_time) > now
                ).length || 0;

                // Fetch reviews
                const { data: reviews } = await supabase
                    .from('review')
                    .select('stars')
                    .eq('reviewee_id', userId);

                const totalReviews = reviews?.length || 0;
                const totalStars = reviews?.reduce((sum, review) => sum + (review.stars || 0), 0) || 0;
                const avgRating = totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : 0;

                // Update stats
                updateState({
                    stats: {
                        currentListings,
                        itemsSold: 0,
                        itemsBought: 0,
                        avgRating: parseFloat(avgRating),
                        totalReviews
                    },
                    loading: false
                });

            } catch (error) {
                console.error('Failed to load profile:', error);
                updateState({ notFound: true, loading: false });
            }
        };

        fetchAllData();
    }, [username, supabase]);

    const handleShareProfile = () => {
        const profileUrl = window.location.href;
        navigator.clipboard.writeText(profileUrl);
        updateState({ showCopyToast: true });
        setTimeout(() => updateState({ showCopyToast: false }), 2000);
    };

    // Loading state (EXACT SAME AS PROFILEPAGE)
    if (state.loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a'
            }}>
                <Spinner size="md" className="text-blue-500" />
            </div>
        );
    }

    if (state.notFound) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
                <div style={{ textAlign: 'center', padding: '32px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', maxWidth: '400px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔍</div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>User Not Found</h1>
                    <p style={{ color: '#6b7280' }}>This profile doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '24px 0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
                {/* Toast */}
                {state.showCopyToast && (
                    <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
                        <div style={{ backgroundColor: '#16a34a', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '8px', border: '2px solid #22c55e' }}>
                            <span style={{ fontWeight: 'bold' }}>✓</span>
                            <span style={{ fontWeight: '500' }}>Link copied to clipboard!</span>
                        </div>
                    </div>
                )}

                {/* Profile Header */}
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Avatar */}
                        <div style={{ flexShrink: 0 }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #3b82f6', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
                                {state.avatarUrl ? (
                                    <img src={state.avatarUrl} alt={state.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
                                        {state.user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>@{state.user.username}</h1>
                                {state.stats.avgRating > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
                                        <span>⭐</span>
                                        <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{state.stats.avgRating}</span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', flexWrap: 'wrap' }}>
                                <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #475569' }}>
                                    <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{state.stats.currentListings}</span>
                                    <span style={{ color: '#94a3b8', marginLeft: '4px' }}>Listings</span>
                                </div>
                                <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #475569' }}>
                                    <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{state.stats.itemsSold}</span>
                                    <span style={{ color: '#94a3b8', marginLeft: '4px' }}>Sold</span>
                                </div>
                                <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #475569' }}>
                                    <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{state.stats.itemsBought}</span>
                                    <span style={{ color: '#94a3b8', marginLeft: '4px' }}>Bought</span>
                                </div>
                                <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '4px' }}>• Joined {state.joinedAgo}</span>
                            </div>
                        </div>

                        {/* Share Button */}
                        <div>
                            <button
                                onClick={handleShareProfile}
                                style={{ padding: '10px 16px', backgroundColor: '#2563eb', color: 'white', border: '1px solid #3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' }}
                            >
                                <span>🔗</span>
                                <span>Share</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid #334155' }}>
                    {/* Tab Headers */}
                    <div style={{ display: 'flex', backgroundColor: '#0f172a', borderBottom: '2px solid #334155' }}>
                        <button
                            onClick={() => updateState({ tab: "Listings" })}
                            style={{
                                flex: 1,
                                padding: '16px 24px',
                                backgroundColor: state.tab === "Listings" ? '#1e293b' : 'transparent',
                                color: state.tab === "Listings" ? '#60a5fa' : '#94a3b8',
                                border: 'none',
                                borderBottom: state.tab === "Listings" ? '3px solid #3b82f6' : '3px solid transparent',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: state.tab === "Listings" ? '0 -2px 10px rgba(59, 130, 246, 0.2)' : 'none'
                            }}
                        >
                            <span style={{ marginRight: '8px', fontSize: '16px' }}>📦</span>
                            Listings
                        </button>
                        <button
                            onClick={() => updateState({ tab: "Reviews" })}
                            style={{
                                flex: 1,
                                padding: '16px 24px',
                                backgroundColor: state.tab === "Reviews" ? '#1e293b' : 'transparent',
                                color: state.tab === "Reviews" ? '#60a5fa' : '#94a3b8',
                                border: 'none',
                                borderBottom: state.tab === "Reviews" ? '3px solid #3b82f6' : '3px solid transparent',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: state.tab === "Reviews" ? '0 -2px 10px rgba(59, 130, 246, 0.2)' : 'none'
                            }}
                        >
                            <span style={{ marginRight: '8px', fontSize: '16px' }}>⭐</span>
                            Reviews ({state.stats.totalReviews})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div style={{ padding: '24px', backgroundColor: '#1e293b' }}>
                        {state.tab === "Listings" && <Listings userId={state.user.id} isPublicView={true} />}
                        {state.tab === "Reviews" && <PopulateReviews userId={state.user.id} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
