'use client';

import { useState } from 'react';
import { createTopUpPayment } from '@/utils/hitpay';
import { useSession } from '@/context/SessionContext';

export default function WalletTopUp({ currentBalance }) {
    const session = useSession();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const quickAmounts = [10, 50, 100, 200, 500];

    const handleTopUp = async (topUpAmount) => {
        setLoading(true);
        setError(null);

        try {
            const result = await createTopUpPayment(
                topUpAmount,
                session.user.id,
                session.user.email
            );

            if (result.success) {
                // Redirect to HitPay checkout
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
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Top Up Wallet</h2>

            <div className="mb-6">
                <div className="text-gray-400 text-sm mb-2">Current Balance</div>
                <div className="text-4xl font-bold text-green-400">
                    ${currentBalance.toFixed(2)}
                </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-6">
                <div className="text-gray-400 text-sm mb-3">Quick Top-Up</div>
                <div className="grid grid-cols-3 gap-3">
                    {quickAmounts.map(amt => (
                        <button
                            key={amt}
                            onClick={() => handleTopUp(amt)}
                            disabled={loading}
                            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                        >
                            ${amt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Custom Amount</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        disabled={loading}
                    />
                    <button
                        onClick={() => amount && handleTopUp(parseFloat(amount))}
                        disabled={loading || !amount || parseFloat(amount) <= 0}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Top Up'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="text-gray-500 text-xs mt-4">
                Powered by HitPay • Secure Payment Gateway
            </div>
        </div>
    );
}
