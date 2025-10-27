'use client';

import Link from 'next/link';

import { supabaseBrowser } from '@/utils/supabase/client';

import { DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { useModal } from '@/context/ModalContext';
import { memo } from 'react';
import { useIsActive } from '@/hooks/useIsActive';
import { axiosBrowserClient } from '@/utils/axios/client';
import { toast } from "sonner";

import Login from '@/components/LR/Login';
import Register from '@/components/LR/Register';

// -------------------------
// Utility
// -------------------------
const cn = (...c) => c.filter(Boolean).join(' ');

const styles = {
    base: 'rounded-md px-3 py-2 font-medium text-white',
    inactive: 'hover:bg-[var(--nav-hover-bg)] hover:text-white',
    active: 'bg-[var(--nav-active-bg)] text-white',
    cta: 'bg-[var(--nav-cta-bg)] hover:bg-[var(--nav-cta-hover-bg)] text-[var(--nav-cta-text)]',
    xta: 'hover:bg-[var(--nav-hover-bg)]'
};

// -------------------------
// Action Handler
// -------------------------

// const handleLogin = async (e, setModalState) => {
//     e.preventDefault();
//     const sb = supabaseBrowser();
//     const form = new FormData(e.currentTarget);

//     const { data, error } = sb.auth.signInWithPassword({
//         email: form.get('email'),
//         password: form.get('password')
//     }).then(res => {
//         // setLoading(false);
//         setModalState({ open: false });
//     }).catch(err => {
//         console.log(err.message);
//     });
// };

// const handleRegistration = async (e, setModalState) => {
//     e.preventDefault();
//     const sb = supabaseBrowser();
//     const form = new FormData(e.currentTarget);

//     try {
//         const res = await axiosBrowserClient.post('/auth/register', {
//             email: form.get('email').trim(),
//             password: form.get('password'),
//             username: form.get('username'),
//         });
//     } catch (err) {
//         console.log(err.message);
//     };
// };

function handleAction(action, setModalHeader, setModalState, setModalForm, logout) {

    const sb = supabaseBrowser();
    switch (action) {
        case 'login': {
            setModalHeader({ title: 'Login', description: 'Welcome back!' });
            setModalForm({
                isForm: true,
                onSubmit: async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const email = form.get('email')?.trim();
                    const password = form.get('password')?.trim();
                    const { error } = await sb.auth.signInWithPassword({ email, password });
                    if (error) return toast.error(error.message);
                    setModalState({ open: false });
                    toast.success('Successfully logged in!');
                    try {
                        const next = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('next') : null;
                        if (next) window.location.replace(next);
                    } catch {}
                }
            });
            setModalState({ open: true, content: <Login /> });
            break; }
        case 'register': {
            setModalHeader({ title: 'Registration', description: 'Join us today!' });
            setModalForm({
                isForm: true,
                onSubmit: async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const email = form.get('email')?.trim();
                    const password = form.get('password')?.trim();
                    const username = form.get('username')?.trim();
                    try {
                        const res = await axiosBrowserClient.post('/auth/register', { email, password, username });
                        if (res.status !== 200) return toast.error('Something went wrong.');
                        setModalState({ open: false });
                        return toast.success('Registration success! Please verify your email.');
                    } catch (error) {
                        return toast.error(error.message);
                    }
                }
            });
            setModalState({ open: true, content: <Register /> });
            break; }
        case 'logout':
            logout?.();
            toast.success('Sucessfully logged out')
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
    const { setModalHeader, setModalState, setModalForm } = useModal();

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
                                onClick={() => handleAction(item.action, setModalHeader, setModalState, setModalForm, logout)}
                                className={itemClass(item)}
                                aria-label={item.label}
                            >
                                {item.label}
                            </DisclosureButton>
                        ) : (
                            <button
                                key={`${item.label}_d_btn`}
                                type="button"
                                onClick={() => handleAction(item.action, setModalHeader, setModalState, setModalForm, logout)}
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
