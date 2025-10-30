

'use client';

import { useEffect, useReducer, useState } from "react";
import { useRouter } from 'next/navigation';
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
import { toast } from "sonner";
import { supabaseBrowser } from '@/utils/supabase/client';


import getProfile from "@/hooks/getProfile";
import { getAvatarPublicUrl } from '@/hooks/getStorage';
import getTimeAgo from '@/utils/profile/getTimeAgo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import Auctions from "@/components/Profile/Auctions";
import Overview from "@/components/Profile/Overview";
import Analytics from "@/components/Profile/Analytics";
import ItemsWon from "@/components/Profile/ItemsWon";
import { Spinner as UISpinner } from '@/components/ui/spinner';
import BlockingOverlay from '@/components/BlockingOverlay';
import PersonaButton from '@/components/Persona'
import { ShieldCheckIcon } from "lucide-react";

export default function ProfilePage() {
	const { setModalHeader, setModalState, setModalForm } = useModal();
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
			try {
				const profile = await getProfile();
				await getAvatarPublicUrl(profile);
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

  // Removed auto-open Settings logic; navigation tab now handles access

	const handleDisplay = (type) => (e) => {
		switch (type) {
			case 1: {
				setModalHeader({ title: 'My Wallet' });
				setModalForm({ isForm: false });
				setModalState({ open: true, content: <WalletModal profile={profile} /> });
				break;
			};
			case 2: {
				const profileUrl = `${window.location.origin}/user/${profile?.username}`;
				navigator.clipboard.writeText(profileUrl)
					.then(() => {
						{/* this alert doesnt fit iPhone6 width, can help mod @/context/AlertContext? */}
						toast.success('Link copied to clipboard!');
					})
					.catch(() => {
						toast.error('Failed to copy link!');
					});
				break;
			};
			case 3: {
				setModalHeader({ title: 'Settings' });
				setModalForm({ isForm: true, onSubmit: async (e) => {
					e.preventDefault();
					const f = new FormData(e.currentTarget);
					const sb = supabaseBrowser();
					try {
						if (!profile) throw new Error('Profile not loaded');
                const username = f.get('username')?.toString().trim() || '';
                const firstName = f.get('firstname')?.toString().trim() || '';
                const middleName = f.get('middlename')?.toString().trim() || '';
                const lastName = f.get('lastname')?.toString().trim() || '';
                const address = f.get('address')?.toString().trim() || '';
                const avatarFile = f.get('avatar');
						let newAvatarPath = profile.object_path || null;
						const bucket = profile.avatar_bucket || 'avatar';
						if (avatarFile && avatarFile.size > 0) {
							if (!avatarFile.type?.startsWith('image/')) throw new Error('Please select a valid image file');
							if (avatarFile.size > 5 * 1024 * 1024) throw new Error('Image size should be less than 5MB');
							const fileExt = avatarFile.name.split('.').pop();
							const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
							if (profile.object_path) {
								await sb.storage.from(bucket).remove([profile.object_path]);
							}
							const { error: uploadError } = await sb.storage.from(bucket).upload(fileName, avatarFile, { cacheControl: '3600', upsert: false });
							if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
							newAvatarPath = fileName;
						}
                const { error: updateError } = await sb.from('profile').update({
                  username,
                  first_name: firstName,
                  middle_name: middleName,
                  last_name: lastName,
									address: address,
                  object_path: newAvatarPath
                }).eq('id', profile.id);
						if (updateError) throw new Error(`Update failed: ${updateError.message}`);
            toast.success('Profile updated');
            setModalState({ open: false });
            setBlocking(true);
            // Poll until changes are visible, then refresh local view
            const deadline = Date.now() + 8000; // up to 8s
            let updated = false;
            while (Date.now() < deadline) {
              try {
                const latest = await getProfile();
                if (
                  latest?.username === username &&
                  (!newAvatarPath || latest?.object_path === newAvatarPath) &&
                  latest?.first_name === firstName &&
                  latest?.middle_name === middleName &&
                  latest?.last_name === lastName
                ) {
                  await getAvatarPublicUrl(latest);
                  setProfile(latest);
                  updated = true;
                  break;
                }
              } catch {}
              await new Promise(r => setTimeout(r, 500));
            }
            if (!updated) router.refresh();
            setBlocking(false);
					} catch (err) {
						toast.error(err?.message || 'Failed to update profile');
					}
				} });
				setModalState({ open: true, content: <Settings profile={profile} onClose={() => setModalState({ open: false })} /> });
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
				{loading && (
					<div className="flex items-center justify-center h-[400px]">
						<UISpinner className="size-6" />
					</div>
				)}
				<div className={loading ? 'hidden' : ''}>
					<div id="header" className="bg-slate-800 rounded-md p-6 mb-6 shadow-xl border border-slate-700">
						<div className="flex flex-col lg:flex-row items-center justify-between gap-4">
							<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full lg:w-auto">
								{/* Avatar */}
								<Avatar avatar_url={profile?.avatar_url} username={profile?.username} />

								{/* User Info */}
								<div className="flex-1 text-center sm:text-left">
									<div className="flex items-center justify-center sm:justify-start gap-3 mb-2 flex-wrap">
										<h1 className="text-white text-xl font-bold m-0">@{profile?.username}</h1>
										<AvgReview number={profile?.avg_rating} />
										{profile?.verified
										? <ShieldCheckIcon className="text-green-500" />
										:<PersonaButton id={profile?.id} />
										}
										
										
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
								<Options icon='creditcard' variant="outline" onClick={(handleDisplay(1))} text={profile?.wallet_balance} />
								<Options icon='link' variant="info" onClick={(handleDisplay(2))} text='Share' />
								<Options icon='gear' variant="secondary" onClick={(handleDisplay(3))} text='Edit' />
							</div>
						</div>
					</div>


					<div className="bg-slate-800 rounded-md overflow-hidden shadow-xl border border-slate-700">
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

			<BlockingOverlay show={blocking} message="Updating your profile…" />
		</div>
	);
}
