// import ProfilePage from '@/components/ProfilePage/ProfilePage'

// export default async function Profile() {
// 	return <ProfilePage />
// }

'use client';

import { useEffect, useReducer, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/utils/supabase/client';
import {
    Listing,
    Reviews,
    Avatar,
    Stats,
    AvgReview,
    Options,
    Settings
} from '@/components/Profile';
import WalletModal from '@/components/wallet/WalletModal';
import { useModal } from "@/context/ModalContext";
import { useAlert } from '@/context/AlertContext';
import Spinner from "@/components/SpinnerComponent";

import getProfile from "@/hooks/getProfile";
import { getAvatarPublicUrl } from '@/hooks/getStorage';
import Modal from "@/components/ModalComponent";

const initialState = {
    loading: true,
    isWalletOpen: false,
    tab: 1
};

const tabs = [
    { tab: 1, title: 'Listing', icon: '📦' },
    { tab: 2, title: 'Reviews', icon: '⭐' }
];

const reducer = (s, a) => {
    switch (a.type) {
        case 'FIELD': return { ...s, [a.field]: a.value };
        case 'RESET': return intitial;
        default: return s;
    };
};

export default function ProfilePage({ req, ctx }) {
    const { openModal, closeModal } = useModal();
    const { showAlert } = useAlert();
    const searchParams = useSearchParams();
    const supabase = supabaseBrowser();

    const [profile, setProfile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [state, setState] = useReducer(reducer, initialState);

    useEffect(() => {
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

    const handleDisplay = (type) => (e) => {
        switch (type) {
            // Handling settings open
            case 1: {
                openModal({
                    content: <WalletModal profile={profile} />,
                    title: 'My Wallet'
                });
                break;
            };
            case 2: {
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
                break;
            };
            case 3: {
                openModal({
                    title: 'Settings',
                    content: <Settings user={profile?.user} onClose={closeModal} />
                });
                break;
            };
            default: return;
        };
    };

    const handleSwitchTab = (field) => (e) => {
        const value = e.currentTarget.dataset.tab;
        setState({ type: 'FIELD', field, value: Number(value) });
    };

    return (
        <div className="py-6">
            <div className='max-w-6xl mx-auto px-4'>
                {/* Profile Header */}
                {state.loading && (<aside className="flex items-center justify-center"><Spinner size="sssxl" /></aside>)}
                <div className={state.loading ? 'hidden' : ''}>
                    <div className="bg-slate-800 rounded-xl p-6 mb-6 shadow-xl border border-slate-700">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-4">
                                {/* Avatar */}
                                <Avatar avatar_url={profile?.avatar_url} username={profile?.username} />

                                {/* User Info */}
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-white text-xl font-bold m-0">@{profile?.username}</h1>
                                        <AvgReview number={profile?.avg_rating} />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 text-sm flex-wrap">
                                        {profile?.stats.map(v => (
                                            <Stats key={v.title} {...v} />
                                        ))}
                                        <span className="text-slate-500 text-xs ml-1">• Joined {profile?.getTimeAgo()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Options icon='creditcard' bgColor='bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-500' onClick={(handleDisplay(1))} text={profile?.wallet_balance} />
                                <Options icon='link' bgColor='bg-gradient-to-br from-blue-500 to-blue-700 border-blue-500' onClick={(handleDisplay(2))} text='Share' />
                                <Options icon='gear' bgColor='bg-gradient-to-br from-gray-500 to-gray-700 border-gray-500' onClick={(handleDisplay(3))} text='Edit' />
                                {/* <button
                                    onClick={() => setState({ type: "FIELD", field: "isWalletOpen", value: true })}
                                    className="px-4 py-2 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border border-emerald-500 rounded-md text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                                >
                                    <span>💰</span>
                                    <span>${profile?.walletBalance.toFixed(2)}</span>
                                </button> */}

                                {/* <button
                                    onClick={handleShareProfile}
                                    className="px-4 py-2 bg-blue-600 text-white border border-blue-500 rounded-md text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                                >
                                    <span>🔗</span>
                                    <span>Share</span>
                                </button>

                                <button
                                    onClick={handleDisplay(3)}
                                    className="px-4 py-2 bg-slate-600 text-white border border-slate-400 rounded-md text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                                >
                                    <span>⚙️</span>
                                    <span>Edit</span>
                                </button> */}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700">
                        <div className="flex bg-slate-900 border-b-2 border-slate-700">
                            {tabs.map(v => (
                                <button
                                    key={`tab${v.tab}`}
                                    className={`flex-1 px-6 py-4 text-sm font-bold cursor-pointer border-b-4 transition-shadow 
                                        ${state.tab === v.tab
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
                            {state.tab === 1 && <Listing userId={profile?.id} />}
                            {state.tab === 2 && <Reviews userId={profile?.id} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}