'use client';

import Link from 'next/link'

export default function ErrorBtn() {

    return (
        <Link
            className='
                lg:text-lg text-sm
                lg:py-3 py-2 
                lg:px-5 md:px-4 px-3
                text-black bg-[var(--custom-cream-yellow)]
                hover:bg-[var(--custom-cream-yellow-darker)]
                focus:ring-4 focus:ring-yellow-500
                rounded-lg focus:outline-none
            '
            href='/'
        >
            Back to Home
        </Link>
    );
}
