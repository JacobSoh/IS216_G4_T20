'use client';

import Link from 'next/link';

const navigation = [
    {
        title: 'Quick Links',
        links: [
            { name: 'Live Auctons', href: '/' },
            { name: 'Categories', href: '/categories' },
            { name: 'How It Works', href: '/how_it_works' },
            { name: 'Selling Guide', href: '/about' }
        ]
    },
    {
        title: 'Support',
        links: [
            { name: 'Help Center', href: '/' },
            { name: 'Contact Us', href: '/categories' },
            { name: 'Terms of Service', href: '/how_it_works' },
            { name: 'Privacy Policy', href: '/about' }
        ]
    },
    {
        title: 'Contact',
        links: [
            { name: 'Twitter', href: '/' },
            { name: 'Instagram', href: '/categories' },
            { name: 'Facebook', href: '/how_it_works' },
            { name: 'Newsletter', href: '/about' }
        ]
    }
];

export default function Footer() {
    return (
        <footer className='relative z-10 bg-gray-800'>
            <div className="py-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                    className="grid grid-cols-2 md:grid-cols-4 gap-10 items-start justify-between"
                >
                    <section>
                        <h3 className='text-2xl font-bold tracking-tight text-(--custom-cream-yellow)'>BidHub</h3>
                        <div className='mt-6 text-white'>
                            <p className='text-md'>The modern way to discover and bid on unique items from around the world.</p>
                        </div>
                    </section>
                    {navigation.map(v => (
                        <section
                            key={v.title + '_footer'}
                        >
                            <h3 className='text-2xl font-bold tracking-tight text-(--custom-cream-yellow)'>{v.title}</h3>
                            <div className='text-white mt-6 flex flex-col items-start justify-start'>
                                {v.links.map(s => (
                                    <Link key={s.name + '_footer'} href={s.href} className='text-md no-underline'>
                                        {s.name}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
            <div className='text-white border-t-1 border-top max-w-7xl text-center px-4 sm:px-6 lg:px-8 py-5 mx-auto max-w-9xl'>
                &copy; 2024 BidHub. All rights reserved.
            </div>
        </footer>
    );
};