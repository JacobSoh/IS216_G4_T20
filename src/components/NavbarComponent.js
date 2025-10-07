'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import {
	MobileMenu,
	DesktopNav,
	MobileNav
} from '@/components/navbar/index';
import { useAlert } from '@/context/AlertContext';

const NAV_ITEMS = [
	{ label: 'Live Auctions', href: '/', button: false },
	{ label: 'Categories', href: '/categories', button: false },
	{ label: 'How It Works', href: '/how_it_works', button: false },
	{ label: 'About', href: '/about', button: false },
	{ label: 'Contact', href: '/contact', button: false },
	{ label: 'Login', href: '/login', button: false, hideWhenAuthed: true },
	{ label: 'Join Us', href: '/register', button: true, hideWhenAuthed: true },
	{ label: 'Logout', action: 'logout', button: true, onlyWhenAuthed: true },
];

export default function Navbar({ isAuthed: initialAuthed = false }) {
	const { showAlert } = useAlert();
	const [isAuthed, setIsAuthed] = useState(Boolean(initialAuthed));
	const router = useRouter();

	const sbRef = useRef(null);
	if (!sbRef.current) sbRef.current = supabaseBrowser();

	// guard for StrictMode double-run in dev
	const didInit = useRef(false);

	// track last auth value to avoid redundant refreshes
	const lastAuthedRef = useRef(Boolean(initialAuthed));

	async function handleLogout() {
		await sbRef.current.auth.signOut();
		showAlert({message: 'Successfully logout', variant: 'info'});
	};

	useEffect(() => {
		if (didInit.current) return;
		didInit.current = true;

		let cancelled = false;
		const sb = sbRef.current;

		sb.auth.getSession().then(({ data: { session } }) => {
			if (cancelled) return;
			const next = !!session;
			setIsAuthed(next);
			lastAuthedRef.current = next;
		});

		const { data: { subscription } } = sb.auth.onAuthStateChange((evt, session) => {
			const next = !!session;
			setIsAuthed(next);

			// only refresh on real auth boundary changes
			if ((evt === 'SIGNED_IN' || evt === 'SIGNED_OUT') && lastAuthedRef.current !== next) {
				lastAuthedRef.current = next;
				router.refresh(); // keep server bits (RSC, layouts) in sync
			}
			// ignore TOKEN_REFRESHED to avoid noisy refreshes
		});

		// 3) cleanup
		return () => {
			cancelled = true;
			subscription?.unsubscribe();
		};
	}, [router]);

	const items = useMemo(() =>
		NAV_ITEMS.filter(i => {
			if (i.onlyWhenAuthed) return isAuthed;   // show only when authed
			if (i.hideWhenAuthed) return !isAuthed;  // hide when authed
			return true;
		}),
		[isAuthed]);

	return (
		<Disclosure as="nav" className="fixed inset-x-0 top-0 z-50 bg-gray-800">
			<div className="mx-auto max-w-7xl px-2 md:px-6 lg:px-8">
				<div className="relative flex h-16 items-center justify-between">
					{/* Mobile menu button */}
					<MobileMenu />

					<div className="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
						{/* Brand */}
						<Link
							href="/"
							className="flex shrink-0 items-center text-2xl font-bold tracking-tight no-underline text-(--custom-cream-yellow)"
						>
							BidHub
						</Link>

						{/* Desktop nav */}
						<DesktopNav items={items} onLogout={handleLogout} />
					</div>
				</div>
			</div>

			{/* Mobile nav */}
			<MobileNav items={items} onLogout={handleLogout} />
		</Disclosure>
	);
};