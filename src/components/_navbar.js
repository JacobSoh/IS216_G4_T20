'use client';

import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navigation = [
	{ name: 'Live Auctions', href: '/', button: false },
	{ name: 'Categories', href: '/categories', button: false },
	{ name: 'How It Works', href: '/how_it_works', button: false },
	{ name: 'About', href: '/about', button: false },
	{ name: 'Contact', href: '/contact', button: false },
	{ name: 'Join Us', href: '/register', button: true },
]

const profileDropdown = [
	{ name: 'Your Profile', href: '/', key:'profile_1' },
	{ name: 'Settings', href: '/', key:'profile_2' },
	{ name: 'Sign Out', href: '/', key:'profile_3' }
]

function classNames(...classes) {
	return classes.filter(Boolean).join(' ')
};

export default function Navbar() {
	const pathname = usePathname();
	const isActive = (href) => pathname === href;

	return (
		<Disclosure as="nav" className="fixed left-0 right-0 top-0 bg-gray-800 z-100">
			<div className="mx-auto max-w-7xl px-2 md:px-6 lg:px-8">
				<div className="relative flex h-16 items-center justify-between">
					<div className="absolute inset-y-0 left-0 flex items-center md:hidden">
						{/* Mobile menu button*/}
						<DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500">
							<span className="absolute -inset-0.5" />
							<span className="sr-only">Open main menu</span>
							<Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
							<XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
						</DisclosureButton>
					</div>
					<div className="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
						<div className="flex shrink-0 items-center">
							<Link
								key="BidHubLogo_navbar"
								href="/"
								className='text-2xl font-bold no-underline tracking-tight text-(--custom-cream-yellow)'
							>
								BidHub
							</Link>
						</div>
						<div className="hidden ms-auto md:ml-6 md:block">
							<div className="flex space-x-4">
								{navigation.map((item) => (
										<Link
											key={item.name + '_navbar'}
											href={item.href}
											aria-current={isActive(item.href) ? 'page' : undefined}
											className={classNames(
												isActive(item.href) ? 'bg-gray-900 text-white' :
													item.button ? 'bg-(--custom-accent-red) text-white hover:bg-red-800 px-3' : 'text-gray-300 hover:bg-white/5 hover:text-white',
												'rounded-md px-3 py-2 text-sm font-medium',
											)}>
											{item.name}
										</Link>
									)
								)}
							</div>
						</div>
					</div>
					{/*
					<div className="absolute inset-y-0 right-0 flex items-center pr-2 md:static md:inset-auto md:ml-6 md:pr-0">
						<button
							type="button"
							className="relative rounded-full p-1 text-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
						>
							<span className="absolute -inset-1.5 cursor-pointer" />
							<span className="sr-only">View notifications</span>
							<BellIcon aria-hidden="true" className="size-6" />
						</button>

						 Profile dropdown 
						<Menu as="div" className="relative ml-3">
							<MenuButton className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
								<span className="absolute -inset-1.5" />
								<span className="sr-only">Open user menu</span>
								<Image 
									alt=""
									src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
									className="size-8 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
								/>
							</MenuButton>

							<MenuItems
								transition
								className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
							>
								{profileDropdown.map((item) => (
									<MenuItem key={item.key + '_menu_navbar'}>
										<Link
											key={item.name + '_menu_navbar'}
											href={item.href}
											className='block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden'
										>
											{item.name}
										</Link>
									</MenuItem>
								))}
							</MenuItems>
						</Menu>
						
					</div>
					*/}
				</div>
			</div>

			<DisclosurePanel className="md:hidden">
				<div className="space-y-1 px-2 pt-2 pb-3">
					{navigation.map((item) => (
						<DisclosureButton
							key={item.name}
							as="a"
							href={item.href}
							aria-current={isActive(item.href) ? 'page' : undefined}
							className={classNames(
								isActive(item.href) ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white',
								'block rounded-md px-3 py-2 text-base font-medium',
							)}
						>
							{item.name}
						</DisclosureButton>
					))}
				</div>
			</DisclosurePanel>
		</Disclosure>
	)
}