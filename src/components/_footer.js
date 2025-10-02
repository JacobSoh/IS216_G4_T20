'use client';

import {
    _link
} from "@/components/footer";

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
            <div className="py-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 
                        [@media(max-width:29rem)]:hidden">
                <div
                    className={`
                        grid 
                        grid-cols-2 
                        md:grid-cols-4 gap-10 items-start justify-between
                    `}
                >
                    <section>
                        <h3 className='text-2xl font-bold tracking-tight text-(--custom-cream-yellow)'>BidHub</h3>
                        <div className='mt-6 text-white'>
                            <p className='text-md'>The modern way to discover and bid on unique items from around the world.</p>
                        </div>
                    </section>
                    {navigation.map(v => <_link key={v.title + '_footer'} title={v.title} links={v.links} />)}
                </div>
            </div>
            <hr className="max-w-7xl mx-auto [@media(max-width:29rem)]:hidden"/>
            <div className='text-white border-top max-w-7xl text-center px-4 sm:px-6 lg:px-8 py-5 mx-auto'>
                &copy; 2024 BidHub. All rights reserved.
            </div>
        </footer>
    );
};