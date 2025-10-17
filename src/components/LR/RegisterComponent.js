'use client';
import { useState } from 'react';
import AuthFormComponent from '@/components/Auth/AuthForm';
import { axiosBrowserClient } from '@/utils/axios/client';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';
import { useModal } from '@/context/ModalContext';
import {
    Login
} from '@/components/LR/index';


export default function Register() {
    const [error, setError] = useState('');
    const [showLoading, setShowLoading] = useState(false);
    const { showAlert } = useAlert();
    const { openModal, closeModal } = useModal();
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
                username: form.get('username'),
            });
            if (res.status !== 200) return showAlert({ message: 'Something went wrong.', variant: 'danger' });
            closeModal();
            requestAnimationFrame(() => {
                openModal({content: Login, title: 'BidHub'});
            })
        } catch (err) {
            setShowLoading(false);
            return showAlert({ message: err, variant: 'danger' });
        };
    }

    return <AuthFormComponent showLoading={showLoading} error={error} isLogin={false} onSubmit={onSubmit} />;
};