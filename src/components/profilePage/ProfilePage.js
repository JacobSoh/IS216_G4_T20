'use client';

import { useEffect, useReducer, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/utils/supabase/client';
import PopulateReviews from './Reviews';
import Listings from './Listings';
import Settings from '../Settings';
import WalletModal from '@/components/wallet/WalletModal';
import { useModal } from "@/context/ModalContext";
import { useAlert } from '@/context/AlertContext';
import Spinner from "@/components/SpinnerComponent";

import getProfile from "@/hooks/getProfile";
import { getAvatarPublicUrl } from '@/hooks/getStorage';


const initialState = {
    loading: true,
    isWalletOpen: false,
    tab: 1
};

const tabs = [
    { tab:1, title:'Listing', icon: '📦'},
    { tab:2, title:'Reviews', icon: '⭐' }
]

// const initial = {
//     user: null,
//     tab: "Listings",
//     avatarUrl: '',
//     joinedAgo: '',
//     walletBalance: 0,
//     stats: {
//         currentListings: 0,
//         itemsSold: 0,
//         itemsBought: 0,
//         avgRating: 0,
//         totalReviews: 0
//     }
// };

const reducer = (s, a) => {
    switch (a.type) {
        case 'FIELD': return { ...s, [a.field]: a.value };
        case 'RESET': return intitial;
        default: return s;
    };
};

export default function ProfilePage() {
    const { openModal, closeModal } = useModal();
    const { showAlert } = useAlert();
    const searchParams = useSearchParams();
    const supabase = supabaseBrowser();

    const [profile, setProfile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [state, setState] = useReducer(reducer, initialState);

    // Single state object
    // const [state, setState] = useState({
    //     user: null,
    //     loading: true,
    //     tab: "Listings",
    //     avatarUrl: '',
    //     joinedAgo: '',
    //     isWalletOpen: false,
    //     walletBalance: 0,
    //     stats: {
    //         currentListings: 0,
    //         itemsSold: 0,
    //         itemsBought: 0,
    //         avgRating: 0,
    //         totalReviews: 0
    //     }
    // });

    // Helper to update state
    // const updateState = (field) => (e) => setState({ type: 'FIELD', field, value: e.currentTarget.value });
    // const updateState = (updates) => setState(prev => ({ ...prev, ...updates }));

    // Single useEffect for data loading
    useEffect(() => {
        // if (!isAuthed) { setProcess({ type: 'FIELD', field: 'loading', value: false }); return; }

        const loadProfileData = async () => {
            try {
                // Load user data
                const profile = await getProfile();
                const avatar_url = await getAvatarPublicUrl(profile);
                setProfile(profile);

                // const reference = searchParams.get('reference');
                // const status = searchParams.get('status');

                // if (reference && status === 'completed') {
                //     console.log('Payment completed, fetching updated wallet balance...');

                //     // Re-fetch wallet balance after payment
                //     const { data: updatedProfile } = await supabase
                //         .from('profile')
                //         .select('wallet_balance')
                //         .eq('id', userData.id)
                //         .single();

                //     if (updatedProfile) {
                //         profileData.wallet_balance = updatedProfile.wallet_balance;
                //     }

                //     // Clean up URL parameters
                //     window.history.replaceState({}, '', '/profile');
                // }

                // Update all state at once
                // updateState({
                //     user: userData,
                //     avatarUrl,
                //     joinedAgo,
                //     walletBalance: profileData?.wallet_balance || 0,
                //     stats: {
                //         currentListings,
                //         itemsSold: 0,
                //         itemsBought: 0,
                //         avgRating: parseFloat(avgRating),
                //         totalReviews
                //     },
                //     loading: false
                // });
            } catch (error) {
                console.error('Failed to load profile:', error);
                setState({ type: 'FIELD', field: 'loading', value: false });
            }
        };

        loadProfileData()
            .then(() => {
                setState({ type: 'FIELD', field: 'loading', value: false });
            }).catch((err) => console.error(err.message));
    }, [searchParams, supabase]);

    const handleSettings = () => {
        openModal({
            content: <Settings user={profile?.user} onClose={closeModal} />
        });
    };

    const handleShareProfile = () => {
        const profileUrl = `${window.location.origin}/user/${profile?.username}`;
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

    // if (!profile) {
    //     return <div style={{ textAlign: 'center', padding: '32px', color: 'white' }}>Failed to load profile</div>;
    // }

    const handleSwitchTab = (field) => (e) => {
        const value = e.currentTarget.dataset.tab;
        setState({ type:'FIELD', field, value: value });
    };

    return (
        <div className="py-6">
            <div className='max-w-6xl mx-auto px-4'>
                {/* Profile Header */}
                {state.loading && (<aside className="flex items-center justify-center"><Spinner size="sssxl" /></aside>)}
                <div className={state.loading ? 'hidden' : ''}>
                    <div className="bg-slate-800 rounded-xl p-6 mb-6 shadow-xl border border-slate-700">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="shrink-0">
                                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                                    {profile?.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={profile?.avatar_url}
                                            alt={profile?.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 text-white text-3xl font-bold">
                                            {profile?.username?.[0]?.toUpperCase() || "U"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-white text-xl font-bold m-0">@{profile?.username}</h1>
                                    {profile?.avgRating > 0 && (
                                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 border border-amber-400">
                                            <span>⭐</span>
                                            <span className="font-bold text-gray-800">{profile?.avgRating}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-3 text-sm flex-wrap">
                                    <div className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-600">
                                        <span className="font-bold text-blue-400">{profile?.current_listings}</span>
                                        <span className="text-slate-400 ml-1">Listings</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-600">
                                        <span className="font-bold text-blue-400">{profile?.items_sold}</span>
                                        <span className="text-slate-400 ml-1">Sold</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-600">
                                        <span className="font-bold text-blue-400">{profile?.items_bought}</span>
                                        <span className="text-slate-400 ml-1">Bought</span>
                                    </div>
                                    <span className="text-slate-500 text-xs ml-1">• Joined {profile?.getTimeAgo()}</span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                {/* Wallet Button */}
                                <button
                                    onClick={() => setProcess({ type: "FIELD", field: "isWalletOpen", value: true })}
                                    className="px-4 py-2 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border border-emerald-500 rounded-md text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                                >
                                    <span>💰</span>
                                    <span>${profile?.walletBalance.toFixed(2)}</span>
                                </button>

                                <button
                                    onClick={handleShareProfile}
                                    className="px-4 py-2 bg-blue-600 text-white border border-blue-500 rounded-md text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                                >
                                    <span>🔗</span>
                                    <span>Share</span>
                                </button>

                                <button
                                    onClick={handleSettings}
                                    className="px-4 py-2 bg-slate-600 text-white border border-slate-400 rounded-md text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                                >
                                    <span>⚙️</span>
                                    <span>Edit</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700">
                        <div className="flex bg-slate-900 border-b-2 border-slate-700">
                            {tabs.map(v => (
                                <button
                                    className={`flex-1 px-6 py-4 text-sm font-bold cursor-pointer border-b-4 transition-shadow ${state.tab === v.tab
                                        ? "bg-slate-800 text-blue-400 border-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.2)]"
                                        : "bg-transparent text-slate-400 border-transparent"
                                        }`}
                                    onClick={handleSwitchTab('tab')}
                                    data-tab={v.tab}
                                >
                                    <span className="mr-2 text-base">{v.icon}</span>
                                    {v.title}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 bg-slate-800">
                            {state.tab === 1 && <Listings userId={profile?.id} />}
                            {state.tab === 2 && <PopulateReviews userId={profile?.id} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallet Modal */}
            <WalletModal
                isOpen={process.isWalletOpen}
                onClose={() => setProcess({ type: "FIELD", field: "isWalletOpen", value: false })}
            />
        </div>

    );
}
