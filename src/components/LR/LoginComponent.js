'use client';
import { useEffect, useState } from 'react';
import AuthFormComponent from '@/components/Auth/AuthForm';
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

    async function onSubmit(e) {
        e.preventDefault();
        setShowLoading(true);

        const form = new FormData(e.currentTarget);

        const { data, error } = await sb.auth.signInWithPassword({
            email: form.get('email'),
            password: form.get('password')
        });

        setShowLoading(false);

        if (error) {
            showAlert({ message: error.message, variant: 'danger' });
            return window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        showAlert({ message: "Login Successfully!", variant: 'success' });
        closeModal();
        return;
    };

    return <AuthFormComponent showLoading={showLoading} onSubmit={onSubmit}/>;
};