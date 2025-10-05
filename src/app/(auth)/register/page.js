'use client';
import { useState } from 'react';
import AuthFormComponent from '@/components/AuthFormComponent';
import { axiosBrowserClient } from '@/utils/axios/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [showLoading, setShowLoading] = useState(false);
    const router = useRouter();

    async function onSubmit(e) {
        // Preventing form from submitting
        e.preventDefault();
        setError('');
        setShowLoading(true);
        
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
            return router.push('/login');
        } catch (err) {
            setShowLoading(false);
            return setError(err);
        };
    }

    return <AuthFormComponent showLoading={showLoading} error={error} isLogin={false} onSubmit={onSubmit}/>;
};