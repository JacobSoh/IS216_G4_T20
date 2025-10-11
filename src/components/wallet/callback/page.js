'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/utils/supabase/client';

export default function WalletCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Processing your payment...');
    const supabase = supabaseBrowser();

    useEffect(() => {
        const processCallback = async () => {
            const reference = searchParams.get('reference');
            const paymentStatus = searchParams.get('status');

            console.log('Payment callback:', { reference, status: paymentStatus });

            if (paymentStatus === 'completed') {
                setStatus('success');
                setMessage('Payment successful! Updating your wallet...');

                // Extract user ID from reference (format: TOPUP_userId_timestamp)
                // Since we don't have the reference format here, we'll use the current user
                try {
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        // You can optionally verify the payment with HitPay API here
                        // For now, we'll just show success and redirect

                        setMessage('Payment successful! Redirecting...');

                        setTimeout(() => {
                            router.push('/profile_page');
                        }, 2000);
                    } else {
                        setStatus('error');
                        setMessage('User not found. Please log in again.');
                        setTimeout(() => {
                            router.push('/');
                        }, 3000);
                    }
                } catch (error) {
                    console.error('Callback error:', error);
                    setStatus('error');
                    setMessage('An error occurred. Redirecting...');
                    setTimeout(() => {
                        router.push('/profile_page');
                    }, 3000);
                }
            } else if (paymentStatus === 'failed' || paymentStatus === 'canceled') {
                setStatus('failed');
                setMessage('Payment was not completed.');
                setTimeout(() => {
                    router.push('/profile_page');
                }, 3000);
            } else {
                setStatus('pending');
                setMessage('Payment status unknown. Please check your wallet.');
                setTimeout(() => {
                    router.push('/profile_page');
                }, 3000);
            }
        };

        if (searchParams.get('status')) {
            processCallback();
        }
    }, [searchParams, router, supabase]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-700">
                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-4 animate-bounce">✅</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
                        <p className="text-gray-400 mb-4">{message}</p>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="bg-green-500 h-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                    </>
                )}
                {status === 'failed' && (
                    <>
                        <div className="text-6xl mb-4">❌</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
                        <p className="text-gray-400 mb-4">{message}</p>
                    </>
                )}
                {status === 'processing' && (
                    <>
                        <div className="text-6xl mb-4">⏳</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Processing Payment</h1>
                        <p className="text-gray-400 mb-4">{message}</p>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-500 h-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                    </>
                )}
                {status === 'pending' && (
                    <>
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Payment Pending</h1>
                        <p className="text-gray-400 mb-4">{message}</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
                        <p className="text-gray-400 mb-4">{message}</p>
                    </>
                )}
                <p className="text-gray-500 text-sm mt-6">Redirecting to profile page...</p>
            </div>
        </div>
    );
}
