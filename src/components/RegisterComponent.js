'use client';
import { useState } from 'react';
import AuthFormComponent from '@/components/AuthFormComponent';
import { axiosBrowserClient } from '@/utils/axios/client';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';
import { useModal } from '@/context/ModalContext';

export default function Register() {
    const [error, setError] = useState('');
    const [showLoading, setShowLoading] = useState(false);
    const { showAlert } = useAlert();
    const { closeModal } = useModal();
    const router = useRouter();

    async function onSubmit(e) {
        // Preventing form from submitting
        e.preventDefault();
        setError('');
        setShowLoading(true);

        const form = new FormData(e.currentTarget);
        try {
            const res = await axiosBrowserClient.post('/auth/register', {
                email: form.get('email').trim(),
                password: form.get('password'),
                options: {
                    data: {
                        username: form.get('username')
                    },
                    emailRedirectTo: `${window.location.origin}/api/auth/verify`
                },
            });
            if (res.status !== 200) return showAlert({ message: 'Something went wrong.', variant: 'danger' });
            sessionStorage.setItem('flash', JSON.stringify({
                message: 'Registration complete! Please log in.',
                variant: 'success',
            }));
            return router.push('/login');
        } catch (err) {
            setShowLoading(false);
            return showAlert({ message: err, variant: 'danger' });
        };
    }

    return <AuthFormComponent showLoading={showLoading} error={error} isLogin={false} onSubmit={onSubmit} />;
};