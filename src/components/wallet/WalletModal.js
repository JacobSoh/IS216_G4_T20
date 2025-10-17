'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { createTopUpPayment } from '@/utils/hitpay/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function WalletModal({ isOpen, onClose }) {
    const { isAuthed } = useSupabaseAuth();
    const [session, setSession] = useState(null);
    const [tab, setTab] = useState('balance');
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletHeld, setWalletHeld] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [topUpLoading, setTopUpLoading] = useState(false);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        accountNumber: '',
        accountName: ''
    });

    const supabase = supabaseBrowser();
    const quickAmounts = [10, 50, 100, 200, 500];

    useEffect(() => {
        if (isAuthed) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
            });
        }
    }, [isAuthed, supabase]);

    useEffect(() => {
        if (!isOpen || !session?.user?.id) return;

        const fetchWalletData = async () => {
            setLoading(true);

            const { data: profile } = await supabase
                .from('profile')
                .select('wallet_balance, wallet_held')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                setWalletBalance(parseFloat(profile.wallet_balance || 0));
                setWalletHeld(parseFloat(profile.wallet_held || 0));
            }

            const { data: txData } = await supabase
                .from('wallet_transaction')
                .select('*')
                .eq('uid', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (txData) {
                setTransactions(txData);
            }

            setLoading(false);
        };

        fetchWalletData();
    }, [isOpen, session, supabase]);

    const handleTopUp = async (amount) => {
        if (!session) return;

        setTopUpLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await createTopUpPayment(
                amount,
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
            setTopUpLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!session) return;

        setWithdrawLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const amount = parseFloat(withdrawAmount);

            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            if (amount > walletBalance) {
                throw new Error('Insufficient balance');
            }

            if (amount < 10) {
                throw new Error('Minimum withdrawal amount is $10');
            }

            if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
                throw new Error('Please fill in all bank details');
            }

            const { error: txError } = await supabase
                .from('wallet_transaction')
                .insert({
                    uid: session.user.id,
                    transaction_type: 'withdraw',
                    amount: amount,
                    status: 'pending',
                    description: `Withdrawal to ${bankDetails.bankName} - ${bankDetails.accountNumber}`,
                    created_at: new Date().toISOString()
                });

            if (txError) throw txError;

            const { error: deductError } = await supabase
                .from('profile')
                .update({
                    wallet_balance: walletBalance - amount
                })
                .eq('id', session.user.id);

            if (deductError) throw deductError;

            setSuccess('Withdrawal request submitted successfully! Processing time: 1-3 business days');
            setWithdrawAmount('');
            setBankDetails({ bankName: '', accountNumber: '', accountName: '' });

            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setWithdrawLoading(false);
        }
    };

    if (!isOpen) return null;

    // REST OF YOUR JSX STAYS THE SAME...
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-white">My Wallet</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-3xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setTab('balance')}
                        className={`flex-1 px-6 py-3 font-semibold transition ${tab === 'balance'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Balance
                    </button>
                    <button
                        onClick={() => setTab('topup')}
                        className={`flex-1 px-6 py-3 font-semibold transition ${tab === 'topup'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Top Up
                    </button>
                    <button
                        onClick={() => setTab('withdraw')}
                        className={`flex-1 px-6 py-3 font-semibold transition ${tab === 'withdraw'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Withdraw
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
                            {success}
                        </div>
                    )}

                    {tab === 'balance' && (
                        <div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <p className="text-gray-400 text-sm mb-1">Available Balance</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        ${walletBalance.toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <p className="text-gray-400 text-sm mb-1">Held (Active Bids)</p>
                                    <p className="text-2xl font-bold text-yellow-400">
                                        ${walletHeld.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {transactions.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">No transactions yet</p>
                                ) : (
                                    transactions.map((tx) => (
                                        <div
                                            key={tx.tid}
                                            className="bg-gray-700 rounded-lg p-3 flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-semibold">{tx.description}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${tx.transaction_type === 'topup' || tx.transaction_type === 'release'
                                                        ? 'text-green-400'
                                                        : 'text-red-400'
                                                    }`}>
                                                    {tx.transaction_type === 'topup' || tx.transaction_type === 'release' ? '+' : '-'}
                                                    ${parseFloat(tx.amount).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-400 capitalize">{tx.status}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'topup' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Top Up Your Wallet</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                {quickAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => handleTopUp(amt)}
                                        disabled={topUpLoading}
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
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={() => handleTopUp(parseFloat(topUpAmount))}
                                    disabled={topUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition disabled:opacity-50"
                                >
                                    {topUpLoading ? 'Processing...' : 'Top Up'}
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'withdraw' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
                            <p className="text-gray-400 mb-4">
                                Available: ${walletBalance.toFixed(2)}
                            </p>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Bank Name"
                                    value={bankDetails.bankName}
                                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Account Number"
                                    value={bankDetails.accountNumber}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Account Name"
                                    value={bankDetails.accountName}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Withdrawal Amount (Min $10)"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawLoading}
                                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition disabled:opacity-50"
                                >
                                    {withdrawLoading ? 'Processing...' : 'Request Withdrawal'}
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 mt-4">
                                * Withdrawals are processed within 1-3 business days
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
