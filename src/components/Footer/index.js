'use client';

import {
    FooterLink,
    FooterTop,
    FooterBottom
} from '@/components/Footer/sub/index';

export default function Footer({ fullScreen }) {
    return (
        <footer className="z-10 bg-[var(--nav-bg)] text-white border-t border-[color:var(--theme-secondary)]/30" suppressHydrationWarning>
            <FooterBottom />
        </footer>
    );
};
