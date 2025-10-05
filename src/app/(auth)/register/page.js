'use client';
import { useState } from 'react';
import AuthFormComponent from '@/components/AuthFormComponent';
import { axiosBrowserClient } from '@/utils/axios/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [error, setError] = useState('');
    const router = useRouter();

    async function onSubmit(e) {
        // Preventing form from submitting
        e.preventDefault();
        setError('');
        
        const form = new FormData(e.currentTarget);
        try {
            const res = await axiosBrowserClient.post('/auth/register', {
                email: form.get('email'),
                password: form.get('password'),
                metadata: {
                    username: form.get('username')
                }
            });
            if (res.status !== 200) return setError('Unable to login!');
            router.push('/login');
        } catch (err) {
            return setError(err);
        };
    }

    return <AuthFormComponent error={error} isLogin={false} onSubmit={onSubmit}/>;
};