'use client';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@headlessui/react';
import Image from 'next/image';
import AuthFormComponent from '@/components/AuthFormComponent';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';

function VerifiedGate() {
  const params = useSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    const v = params.get('verified');
    if (v === '1') {
      showAlert({ message: 'Email verified! You can log in now.', variant: 'success' });
      // Clean the URL so the alert doesn’t re-fire on refresh/back
      router.replace('/login');
    }
  }, [params, router, showAlert]);

  return null; // no UI, just side-effect
}

export default function LoginPage() {
    const [showLoading, setShowLoading] = useState(false);
    const { showAlert } = useAlert();
    const router = useRouter();
    const sb = supabaseBrowser();

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
        return router.push('/');
    };

    return (
        <>
        <Suspense fallback={null}>
            <VerifiedGate />
        </Suspense>

        <AuthFormComponent showLoading={showLoading} onSubmit={onSubmit}/>
        </>
    );
};