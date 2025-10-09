'use client';

import Link from 'next/link';
import { DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { useAlert } from '@/context/AlertContext';
import { useModal } from '@/context/ModalContext';
import { memo } from 'react';
import { useIsActive } from '@/hooks/useIsActive';
import Login from '@/components/LoginComponent';
import Register from '@/components/RegisterComponent';


// -------------------------
// Utility
// -------------------------
const cn = (...c) => c.filter(Boolean).join(' ');

const styles = {
    base: 'rounded-md px-3 py-2 font-medium',
    inactive: 'text-gray-300 hover:bg-white/5 hover:text-white',
    active: 'bg-gray-900 text-white',
    cta: 'bg-(--custom-accent-red) text-white hover:bg-red-800',
    xta: 'hover:bg-white/5',
    title: 'text-2xl font-bold tracking-tight text-(--custom-cream-yellow)'
};

// -------------------------
// Action Handler
// -------------------------
async function handleAction(action, showAlert, openModal, logout) {
    switch (action) {
        case 'login':
            openModal({ content: <Login />, title: "BidHub", titleClassName: styles.title });
            break;
        case 'register':
            openModal({ content: <Register />, title: "BidHub", titleClassName: styles.title });
            break;
        case 'logout':
            await logout?.();
            showAlert({ message: 'Successfully logged out', variant: 'info' });
            break;
        default:
            break;
    }
}

// -------------------------
// Unified Nav Component
// -------------------------
export default memo(function NavItems({
    items,
    layout = 'desktop', // 'mobile' or 'desktop'
    logout,
}) {
    const isActive = useIsActive();
    const { showAlert } = useAlert();
    const { openModal } = useModal();

    const isMobile = layout === 'mobile';

    const containerClass = isMobile
        ? 'flex flex-col gap-3 px-2 pt-2 pb-3'
        : 'flex space-x-4';

    const itemClass = (item) =>
        cn(
            styles.base,
            isMobile ? 'block text-base text-left w-full' : 'text-sm',
            item.notRed ? styles.xta : styles.cta
        );

    const Wrapper = isMobile ? DisclosurePanel : 'div';
    const WrapperProps = isMobile ? { className: 'md:hidden' } : { className: 'hidden ml-auto md:block' };

    return (
        <Wrapper {...WrapperProps}>
            <div className={containerClass}>
                {items.map((item) =>
                    item.href ? (
                        isMobile ? (
                            <DisclosureButton
                                key={`${item.label}_${layout}`}
                                as={Link}
                                href={item.href}
                                scroll={false}
                                aria-current={isActive(item.href) ? 'page' : undefined}
                                className={cn(
                                    styles.base,
                                    isActive(item.href) ? styles.active : styles.inactive
                                )}
                            >
                                {item.label}
                            </DisclosureButton>
                        ) : (
                            <Link
                                key={`${item.label}_${layout}`}
                                href={item.href}
                                aria-current={isActive(item.href) ? 'page' : undefined}
                                className={cn(
                                    styles.base,
                                    isActive(item.href) ? styles.active : styles.inactive
                                )}
                            >
                                {item.label}
                            </Link>
                        )
                    ) : (
                        isMobile ? (
                            // IMPORTANT: use DisclosureButton on mobile so it closes after click
                            <DisclosureButton
                                key={`${item.label}_m_btn`}
                                as="button"
                                type="button"
                                onClick={() => handleAction(item.action, showAlert, openModal, logout)}
                                className={itemClass(item)}
                                aria-label={item.label}
                            >
                                {item.label}
                            </DisclosureButton>
                        ) : (
                            <button
                                key={`${item.label}_d_btn`}
                                type="button"
                                onClick={() => handleAction(item.action, showAlert, openModal, logout)}
                                className={itemClass(item)}
                                aria-label={item.label}
                            >
                                {item.label}
                            </button>
                        )
                    )
                )}
            </div>
        </Wrapper>
    );
});
