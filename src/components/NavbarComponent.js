'use client';

import { Disclosure } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { MobileMenu, NavItems } from '@/components/sub/navbar/index';

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// ------------------------------
// Nav Items Config
// ------------------------------
const NAV_ITEMS = [
	{
		label: 'Live Auctions',
		href: '/',
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
	},
	{
		label: 'Logout',
		notRed: false,
		onlyWhenAuthed: true,
		action: 'logout'
	},
];

// ------------------------------
// Main Navbar Component
// ------------------------------
export default function Navbar({ isAuthed: initialAuthed = false }) {
	const { isAuthed, logout } = useSupabaseAuth(initialAuthed);
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
		<Disclosure as="nav" className="fixed inset-x-0 top-0 z-50 bg-gray-800">
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
