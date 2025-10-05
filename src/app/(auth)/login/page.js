'use client';
import { useState } from 'react';
import { Button } from '@headlessui/react';
import Image from 'next/image';
import AuthFormComponent from '@/components/AuthFormComponent';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const sb = supabaseBrowser();

    async function onSubmit(e) {
        setError('');
        e.preventDefault();

        const form = new FormData(e.currentTarget);
        console.log(form.get('email'));
        const { data, error } = await (await sb).auth.signInWithPassword({
            email: form.get('email'),
            password: form.get('password')
        });
        if (error) return setError(error.message);
        router.push('/');as
    };

    return <AuthFormComponent error={error} onSubmit={onSubmit}/>;
};