'use client';
import { useEffect, useState } from 'react';
import AuthFormComponent from '@/components/AuthFormComponent';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';
import { useModal } from '@/context/ModalContext';

export default function Login() {
    const [showLoading, setShowLoading] = useState(false);
    const { showAlert } = useAlert();
    const { closeModal } = useModal();
    const router = useRouter();
    const sb = supabaseBrowser();

    useEffect(() => {
        const raw = sessionStorage.getItem('flash');
        if (raw) {
            const { message, variant = 'info' } = JSON.parse(raw);
            showAlert({message, variant});
            sessionStorage.removeItem('flash');
        };
    }, [showAlert]);

    async function onSubmit(e) {
        e.preventDefault();
        setShowLoading(true);

        const form = new FormData(e.currentTarget);

        const { data, error } = await (await sb).auth.signInWithPassword({
            email: form.get('email'),
            password: form.get('password')
        });

        setShowLoading(false);

        if (error) {
            showAlert({ message: error.message, variant: 'danger' });
            return window.scrollTo({ top: 0, behavior: 'smooth' })
        };
        sessionStorage.setItem('flash', JSON.stringify({
            message: 'Login successfully!',
            variant: 'success',
        }));
        closeModal();
        return router.push('/');
    };

    return <AuthFormComponent showLoading={showLoading} onSubmit={onSubmit} />;
};