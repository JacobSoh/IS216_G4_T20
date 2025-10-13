'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import PopulateReviews from './Reviews';
import Listings from './Listings';
import Settings from '../Settings';
import WalletModal from '@/components/wallet/WalletModal';
import { useModal } from "@/context/ModalContext";
import { useAlert } from '@/context/AlertContext';
import getUser from "@/hooks/getUserData";
import Spinner from "@/components/SpinnerComponent";

export default function ProfilePage() {
    const { isAuthed } = useSupabaseAuth();
    const { openModal, closeModal } = useModal();
    const { showAlert } = useAlert();
    const searchParams = useSearchParams();
    const supabase = supabaseBrowser();

    // Single state object
    const [state, setState] = useState({
        user: null,
        loading: true,
        tab: "Listings",
        avatarUrl: '',
        joinedAgo: '',
        isWalletOpen: false,
        walletBalance: 0,
        stats: {
            currentListings: 0,
            itemsSold: 0,
            itemsBought: 0,
            avgRating: 0,
            totalReviews: 0
        }
    });

    // Helper to update state
    const updateState = (updates) => setState(prev => ({ ...prev, ...updates }));

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Single useEffect for data loading
    useEffect(() => {
        if (!isAuthed) {
            updateState({ loading: false });
            return;
        }

        const loadProfileData = async () => {
            try {
                // Load user data
                const userData = await getUser();

                let avatarUrl = '';
                if (userData.avatarPath) {
                    const { data } = supabase.storage
                        .from(userData.avatarBucket)
                        .getPublicUrl(userData.avatarPath);
                    avatarUrl = data.publicUrl;
                }

                const joinedAgo = userData.createdAt
                    ? userData.getTimeAgo(userData.createdAt)
                    : '';

                // Fetch wallet balance
                const { data: profileData } = await supabase
                    .from('profile')
                    .select('wallet_balance')
                    .eq('id', userData.id)
                    .single();

                // Fetch user stats
                const { data: items } = await supabase
                    .from('item')
                    .select(`
                        iid,
                        auction:aid (
                            end_time
                        )
                    `)
                    .eq('oid', userData.id);

                const now = new Date();
                const currentListings = items?.filter(item =>
                    item.auction?.end_time && new Date(item.auction.end_time) > now
                ).length || 0;

                const { data: reviews } = await supabase
                    .from('review')
                    .select('stars')
                    .eq('reviewee_id', userData.id);

                const totalReviews = reviews?.length || 0;
                const totalStars = reviews?.reduce((sum, review) => sum + (review.stars || 0), 0) || 0;
                const avgRating = totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : 0;

                // Check for payment completion
                const reference = searchParams.get('reference');
                const status = searchParams.get('status');

                if (reference && status === 'completed') {
                    console.log('Payment completed, fetching updated wallet balance...');

                    // Re-fetch wallet balance after payment
                    const { data: updatedProfile } = await supabase
                        .from('profile')
                        .select('wallet_balance')
                        .eq('id', userData.id)
                        .single();

                    if (updatedProfile) {
                        profileData.wallet_balance = updatedProfile.wallet_balance;
                    }

                    // Clean up URL parameters
                    window.history.replaceState({}, '', '/profile');
                }

                // Update all state at once
                updateState({
                    user: userData,
                    avatarUrl,
                    joinedAgo,
                    walletBalance: profileData?.wallet_balance || 0,
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
                updateState({ loading: false });
            }
        };

        loadProfileData();
    }, [isAuthed, searchParams, supabase]);

    const handleSettings = () => {
        openModal({
            content: <Settings user={state.user} onClose={closeModal} />
        });
    };

    const handleShareProfile = () => {
        const profileUrl = `${window.location.origin}/user/${state.user.username}`;
        navigator.clipboard.writeText(profileUrl)
            .then(() => {
                showAlert({
                    message: 'Link copied to clipboard!',
                    variant: 'success',
                    timeoutMs: 3000
                });
            })
            .catch(() => {
                showAlert({
                    message: 'Failed to copy link',
                    variant: 'error',
                    timeoutMs: 3000
                });
            });
    };

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

    if (!isAuthed) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
                <div style={{ textAlign: 'center', padding: '32px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', maxWidth: '400px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔒</div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Authentication Required</h1>
                    <p style={{ color: '#6b7280' }}>Please log in to view your profile</p>
                </div>
            </div>
        );
    }

    if (!state.user) {
        return <div style={{ textAlign: 'center', padding: '32px', color: 'white' }}>Failed to load profile</div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '24px 0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
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

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Wallet Button */}
                            <button
                                onClick={() => updateState({ isWalletOpen: true })}
                                style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: '1px solid #10b981', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}
                            >
                                <span>💰</span>
                                <span>${state.walletBalance.toFixed(2)}</span>
                            </button>

                            <button
                                onClick={handleShareProfile}
                                style={{ padding: '10px 16px', backgroundColor: '#2563eb', color: 'white', border: '1px solid #3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' }}
                            >
                                <span>🔗</span>
                                <span>Share</span>
                            </button>
                            <button
                                onClick={handleSettings}
                                style={{ padding: '10px 16px', backgroundColor: '#475569', color: 'white', border: '1px solid #64748b', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(71, 85, 105, 0.3)' }}
                            >
                                <span>⚙️</span>
                                <span>Edit</span>
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
                        {state.tab === "Listings" && <Listings userId={state.user.id} />}
                        {state.tab === "Reviews" && <PopulateReviews userId={state.user.id} />}
                    </div>
                </div>
            </div>

            {/* Wallet Modal */}
            <WalletModal
                isOpen={state.isWalletOpen}
                onClose={() => updateState({ isWalletOpen: false })}
            />
        </div>
    );
}
