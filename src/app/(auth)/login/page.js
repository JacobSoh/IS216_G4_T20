'use client';
import { useState } from 'react';
import { Button } from '@headlessui/react';
import Image from 'next/image';
import AuthFormComponent from '@/components/AuthFormComponent';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [showLoading, setShowLoading] = useState(false);
    const router = useRouter();
    const sb = supabaseBrowser();

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setShowLoading(true);

        const form = new FormData(e.currentTarget);
        console.log(form.get('email'));
        const { data, error } = await (await sb).auth.signInWithPassword({
            email: form.get('email'),
            password: form.get('password')
        });
        setShowLoading(false);
        if (error) return setError(error.message);
        return router.push('/');
    };

    return <AuthFormComponent showLoading={showLoading} error={error} onSubmit={onSubmit}/>;
};