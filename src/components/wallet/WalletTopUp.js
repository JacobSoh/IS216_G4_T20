'use client';

import { useState, useEffect } from 'react';
import { createTopUpPayment } from '@/utils/hitpay';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function WalletTopUp({ currentBalance }) {
    const { isAuthed } = useSupabaseAuth();
    const [session, setSession] = useState(null);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const supabase = supabaseBrowser();

    const quickAmounts = [10, 50, 100, 200, 500];

    useEffect(() => {
        if (isAuthed) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
            });
        }
    }, [isAuthed, supabase]);

    const handleTopUp = async (topUpAmount) => {
        if (!session) return;

        setLoading(true);
        setError(null);

        try {
            const result = await createTopUpPayment(
                topUpAmount,
                session.user.id,
                session.user.email
            );

            if (result.success) {
                window.location.href = result.checkoutUrl;
            } else {
                setError(result.error || 'Failed to create payment');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Top Up Wallet</h2>
            <p className="text-gray-400 mb-6">Current Balance: ${currentBalance.toFixed(2)}</p>

            {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {quickAmounts.map((amt) => (
                    <button
                        key={amt}
                        onClick={() => handleTopUp(amt)}
                        disabled={loading}
                        className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition disabled:opacity-50"
                    >
                        ${amt}
                    </button>
                ))}
            </div>

            <div className="flex gap-3">
                <input
                    type="number"
                    placeholder="Custom amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <button
                    onClick={() => handleTopUp(parseFloat(amount))}
                    disabled={loading || !amount || parseFloat(amount) <= 0}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Top Up'}
                </button>
            </div>
        </div>
    );
}
