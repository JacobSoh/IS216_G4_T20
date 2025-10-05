'use client';
import { useEffect, useState } from 'react';
import { Button } from '@headlessui/react';
import Image from 'next/image';
import AuthFormComponent from '@/components/AuthFormComponent';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';

export default function LoginPage() {
    const sp = useSearchParams();
    const [showLoading, setShowLoading] = useState(false);
    const { showAlert } = useAlert();
    const router = useRouter();
    const sb = supabaseBrowser();

    useEffect(() => {
        const verified = sp.get('verified');
        if (Number(verified) === 1) {
            showAlert({ message: 'Email verified! You can log in now.', variant: 'success' })
        };
    }, [])

    async function onSubmit(e) {
        e.preventDefault();
        setShowLoading(true);

        const form = new FormData(e.currentTarget);
        console.log(form.get('email'));
        const { data, error } = await (await sb).auth.signInWithPassword({
            email: form.get('email'),
            password: form.get('password')
        });
        setShowLoading(false);
        if (error) {
            showAlert({ message: error.message, variant: 'danger' });
            return window.scrollTo({ top: 0, behavior: 'smooth' })
        };
        return router.push('/');
    };

    return <AuthFormComponent showLoading={showLoading} onSubmit={onSubmit}/>;
};