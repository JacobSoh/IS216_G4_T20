'use client';

import Link from 'next/link';
import { Button, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { usePathname } from 'next/navigation';
import { memo, useMemo } from 'react';

const cn = (...c) => c.filter(Boolean).join(' ');

const styles = {
    base: 'rounded-md px-3 py-2 font-medium',
    desktop: 'text-sm',
    mobile: 'text-base block',
    mobile_btn: 'w-100 text-left',
    inactive: 'text-gray-300 hover:bg-white/5 hover:text-white',
    active: 'bg-gray-900 text-white',
    cta: 'bg-(--custom-accent-red) text-white hover:bg-red-800',
};

function useIsActive() {
    const pathname = usePathname();
    return (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
}

export const MobileNav = memo(function MobileNav({ items, onLogout }) {
    const isActive = useIsActive();

    return (
        <DisclosurePanel className="md:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
                {items.map((item) =>
                    item.action === 'logout' ? (
                        <DisclosureButton
                            key="logout_btn_mobile"
                            as={Button}
                            type="button"
                            onClick={onLogout}             // closes the panel automatically
                            className={cn(styles.base, styles.mobile, styles.cta, styles.mobile_btn)}
                            aria-label="Log out"
                        >
                            {item.label}
                        </DisclosureButton>
                    ) : (
                        <DisclosureButton
                            key={`${item.label}_mobile`}
                            as={Link}
                            href={item.href}
                            prefetch={false}
                            aria-current={isActive(item.href) ? 'page' : undefined}
                            className={cn(
                                styles.base,
                                styles.mobile,
                                item.button ? styles.cta : isActive(item.href) ? styles.active : styles.inactive
                            )}
                        >
                            {item.label}
                        </DisclosureButton>
                    )
                )}
            </div>
        </DisclosurePanel>
    );
});

export const DesktopNav = memo(function DesktopNav({ items, onLogout }) {
    const isActive = useIsActive();

    return (
        <div className="hidden ml-auto md:block">
            <div className="flex space-x-4">
                {items.map((item) =>
                    item.action === 'logout' ? (
                        <button
                            key="logout_btn_desktop"
                            type="button"
                            onClick={onLogout}
                            className={cn(styles.base, styles.desktop, styles.cta)}
                            aria-label="Log out"
                        >
                            {item.label}
                        </button>
                    ) : (
                        <Link
                            key={`${item.label}_desktop`}
                            href={item.href}
                            prefetch={false}
                            aria-current={isActive(item.href) ? 'page' : undefined}
                            className={cn(
                                styles.base,
                                styles.desktop,
                                item.button ? styles.cta : isActive(item.href) ? styles.active : styles.inactive
                            )}
                        >
                            {item.label}
                        </Link>
                    )
                )}
            </div>
        </div>
    );
});
