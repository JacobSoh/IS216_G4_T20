'use client';

import { Disclosure } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { MobileMenu, NavItems } from '@/components/Navbar/sub/index';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const NAV_ITEMS = [
	{
		label: 'Live Auctions',
		href: '/featured_auctions',
	},
	{
		label: 'Categories',
		href: '/categories',
	},
	{
		label: 'How It Works',
		href: '/how_it_works',
	},
	{
		label: 'About',
		href: '/about',
	},
	{
		label: 'Contact',
		href: '/contact',
	},
	{
		label: 'Profile',		
		href: '/profile',
		onlyWhenAuthed: true,
	},
	{
		label: 'Logout',
		notRed: false,
		onlyWhenAuthed: true,
		action: 'logout'
	},
	{
		label: 'Login',
		notRed: true,
		hideWhenAuthed: true,
		action: 'login'
	},
	{
		label: 'Join Us',
		notRed: false,
		hideWhenAuthed: true,
		action: 'register'
	}
];

// ------------------------------
// Main Navbar Component
// ------------------------------
export default function Navbar({ fullScreen }) {
	const { isAuthed, ready, logout } = useSupabaseAuth();
	const router = useRouter();

	// Memoize visible nav items
	const items = useMemo(
		() =>
			NAV_ITEMS.filter((i) => {
				if (i.onlyWhenAuthed) return isAuthed;
				if (i.hideWhenAuthed) return !isAuthed;
				return true;
			}),
		[isAuthed]
	);

	return (
		<Disclosure as="nav" className={`${fullScreen?'hidden':'fixed inset-x-0 top-0 z-50 bg-gray-800'}`}>
			<div className="mx-auto max-w-7xl px-2 md:px-6 lg:px-8">
				<div className="relative flex h-16 items-center justify-between">
					<MobileMenu />

					<div className="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
						<Link
							href="/"
							className="flex shrink-0 items-center text-2xl font-bold tracking-tight text-(--custom-cream-yellow)"
						>
							BidHub
						</Link>

						{/* Desktop navigation */}
						<NavItems
							items={items}
							layout="desktop"
							logout={logout}
						/>
					</div>
				</div>
			</div>

			<NavItems
				items={items}
				layout="mobile"
				logout={logout}
			/>
		</Disclosure>
	);
}
