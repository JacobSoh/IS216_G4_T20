'use client';

import Link from 'next/link'

export default function ErrorBtn() {

    return (
        <Link
            className='
                lg:text-lg text-sm
                lg:py-3 py-2 
                lg:px-5 md:px-4 px-3
                text-white bg-[var(--theme-primary)]
                hover:bg-[var(--theme-secondary)]
                rounded-md outline-none
                focus-visible:ring-[color:var(--theme-secondary)]/40
            '
            href='/'
        >
            Back to Home
        </Link>
    );
}
