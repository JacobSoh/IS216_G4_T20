

'use client';

import { useEffect, useReducer, useState } from "react";
import { useSearchParams } from 'next/navigation';
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
import getTimeAgo from '@/utils/profile/getTimeAgo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import Auctions from "@/components/Profile/Auctions";
import Overview from "@/components/Profile/Overview";
import Analytics from "@/components/Profile/Analytics";
import ItemsWon from "@/components/Profile/ItemsWon";
import {
	Box,
	CircularProgress
} from '@mui/material';

export default function ProfilePage() {
	const { openModal, closeModal } = useModal();
	const { showAlert } = useAlert();
	const [profile, setProfile] = useState(null);
	const [avatarUrl, setAvatarUrl] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadProfileData = async () => {
			try {
				const profile = await getProfile();
				const avatar_url = await getAvatarPublicUrl(profile);
				setProfile(profile);
				setLoading(false);
				console.log(profile);
			} catch (error) {
				console.error('Failed to load profile:', error);
				setLoading(false);
			}
		};
		loadProfileData();
	}, []);

	const handleDisplay = (type) => (e) => {
		switch (type) {
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
						{/* this alert doesnt fit iPhone6 width, can help mod @/context/AlertContext? */}
						showAlert({
							message: 'Link copied to clipboard!',
							variant: 'success',
							timeoutMs: 2000
						});
					})
					.catch(() => {
						showAlert({
							message: 'Failed to copy link',
							variant: 'error',
							timeoutMs: 2000
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

	return (
		<div className="py-6">
			<div className='max-w-6xl mx-auto px-4'>
				{/* Profile Header */}
				{/* >>>loading circle i think this one cleaner? can revert if you want<<<
				{loading && (<aside className="flex items-center justify-center"><Spinner size="sssxl" /></aside>)} */}
				{loading && (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
					<CircularProgress />
				</Box>)}
				<div className={loading ? 'hidden' : ''}>
					<div id="header" className="bg-slate-800 rounded-xl p-6 mb-6 shadow-xl border border-slate-700">
						<div className="flex flex-col lg:flex-row items-center justify-between gap-4">
							<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full lg:w-auto">
								{/* Avatar */}
								<Avatar avatar_url={profile?.avatar_url} username={profile?.username} />

								{/* User Info */}
								<div className="flex-1 text-center sm:text-left">
									<div className="flex items-center justify-center sm:justify-start gap-3 mb-2 flex-wrap">
										<h1 className="text-white text-xl font-bold m-0">@{profile?.username}</h1>
										<AvgReview number={profile?.avg_rating} />
									</div>

									{/* Stats */}
									<div className="flex items-center justify-center sm:justify-start gap-3 text-sm flex-wrap">
										{profile?.stats.map(v => (
											<Stats key={v.title} {...v} />
										))}
										<span className="text-slate-500 text-xs ml-1">• Joined {getTimeAgo({ datetime: profile?.created_at })}</span>
									</div>
								</div>
							</div>

							<div className="flex gap-2 w-full lg:w-auto justify-center lg:justify-end flex-wrap">
								<Options icon='creditcard' bgColor='bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-500' onClick={(handleDisplay(1))} text={profile?.wallet_balance} />
								<Options icon='link' bgColor='bg-gradient-to-br from-blue-500 to-blue-700 border-blue-500' onClick={(handleDisplay(2))} text='Share' />
								<Options icon='gear' bgColor='bg-gradient-to-br from-gray-500 to-gray-700 border-gray-500' onClick={(handleDisplay(3))} text='Edit' />
							</div>
						</div>
					</div>


					<div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700">
						<div>
							<Tabs defaultValue="auctions" className="m-4">
								<TabsList>
									<TabsTrigger value="auctions">Auctions</TabsTrigger>
									<TabsTrigger value="won">Items Won</TabsTrigger>
									<TabsTrigger value="overview">Overview</TabsTrigger>
									<TabsTrigger value="analytics">Analytics</TabsTrigger>
									<TabsTrigger value="reviews">Reviews</TabsTrigger>
								</TabsList>
								<TabsContent value="auctions"><Auctions userId={profile?.id} /></TabsContent>
								<TabsContent value="won"><ItemsWon userId={profile?.id} /></TabsContent>
								<TabsContent value="overview"><Overview userId={profile?.id} /></TabsContent>
								<TabsContent value="analytics"><Analytics user={profile?.user} /></TabsContent>
								<TabsContent value="reviews"><Reviews userId={profile?.id} /></TabsContent>
							</Tabs>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}