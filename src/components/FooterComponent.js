'use client';

import {
    FooterLink,
    FooterTop,
    FooterBottom
} from '@/components/footer';

export default function FooterComponent() {
    return (
        <footer className='fixed bottom-0 left-0 right-0 lg:h-76 z-10 bg-gray-800'>
            <div className='py-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 
                        [@media(max-width:29rem)]:hidden'>
                <div
                    className='grid grid-cols-2 md:grid-cols-4 gap-10 items-start justify-between'
                >
                    <FooterLink title={'BidHub'} isLink={false} message={'The modern way to discover and bid on unique items from around the world.'} />
                    <FooterTop />
                </div>
            </div>
            <hr className='max-w-7xl mx-auto [@media(max-width:29rem)]:hidden'/>
            <FooterBottom />
        </footer>
    );
};