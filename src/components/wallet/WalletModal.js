'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { createTopUpPayment } from '@/utils/hitpay/client';
import { useSession } from '@/context/SessionContext';

export default function WalletModal({ isOpen, onClose }) {
    const session = useSession();
    const [tab, setTab] = useState('balance'); // 'balance', 'topup', 'withdraw'
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
        if (!isOpen || !session?.user?.id) return;

        const fetchWalletData = async () => {
            setLoading(true);

            // Fetch wallet balance
            const { data: profile } = await supabase
                .from('profile')
                .select('wallet_balance, wallet_held')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                setWalletBalance(parseFloat(profile.wallet_balance || 0));
                setWalletHeld(parseFloat(profile.wallet_held || 0));
            }

            // Fetch recent transactions
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

            // Create withdrawal request
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

            // Deduct from wallet balance
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

            // Refresh wallet data
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 overflow-y-auto">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
                {/* Header */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold text-white">My Wallet</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Balance Cards */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 shadow-lg">
                            <div className="text-green-100 text-xs mb-1">Available</div>
                            <div className="text-2xl font-bold text-white">
                                ${walletBalance.toFixed(2)}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 shadow-lg">
                            <div className="text-orange-100 text-xs mb-1">Held (Bids)</div>
                            <div className="text-2xl font-bold text-white">
                                ${walletHeld.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-gray-700">
                        <button
                            onClick={() => setTab('balance')}
                            className={`flex-1 px-4 py-2 font-semibold transition ${
                                tab === 'balance'
                                    ? 'border-b-2 border-blue-500 text-blue-400'
                                    : 'text-gray-400 hover:text-gray-300'
                            }`}
                        >
                            Balance
                        </button>
                        <button
                            onClick={() => setTab('topup')}
                            className={`flex-1 px-4 py-2 font-semibold transition ${
                                tab === 'topup'
                                    ? 'border-b-2 border-blue-500 text-blue-400'
                                    : 'text-gray-400 hover:text-gray-300'
                            }`}
                        >
                            Top Up
                        </button>
                        <button
                            onClick={() => setTab('withdraw')}
                            className={`flex-1 px-4 py-2 font-semibold transition ${
                                tab === 'withdraw'
                                    ? 'border-b-2 border-blue-500 text-blue-400'
                                    : 'text-gray-400 hover:text-gray-300'
                            }`}
                        >
                            Withdraw
                        </button>
                    </div>

                    {/* Tab Content */}
                    {tab === 'balance' && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
                            {loading ? (
                                <div className="text-center text-gray-400 py-8">Loading...</div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">No transactions yet</div>
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((tx) => (
                                        <div
                                            key={tx.tid}
                                            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium capitalize text-sm">
                                                    {tx.transaction_type}
                                                </div>
                                                <div className="text-gray-400 text-xs truncate">
                                                    {tx.description}
                                                </div>
                                                <div className="text-gray-500 text-xs mt-1">
                                                    {new Date(tx.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className={`text-lg font-bold ml-3 ${
                                                tx.transaction_type === 'topup' || tx.transaction_type === 'release'
                                                    ? 'text-green-400'
                                                    : tx.transaction_type === 'withdraw'
                                                    ? 'text-red-400'
                                                    : 'text-orange-400'
                                            }`}>
                                                {tx.transaction_type === 'topup' || tx.transaction_type === 'release' ? '+' : '-'}
                                                ${parseFloat(tx.amount).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'topup' && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Top Up Wallet</h3>

                            <div className="mb-6">
                                <div className="text-gray-400 text-sm mb-3">Quick Top-Up (SGD)</div>
                                <div className="grid grid-cols-3 gap-3">
                                    {quickAmounts.map(amt => (
                                        <button
                                            key={amt}
                                            onClick={() => handleTopUp(amt)}
                                            disabled={topUpLoading}
                                            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                        >
                                            ${amt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-400 text-sm mb-2">Custom Amount (SGD)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={topUpAmount}
                                        onChange={(e) => setTopUpAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        disabled={topUpLoading}
                                    />
                                    <button
                                        onClick={() => topUpAmount && handleTopUp(parseFloat(topUpAmount))}
                                        disabled={topUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                    >
                                        {topUpLoading ? 'Processing...' : 'Top Up'}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="text-gray-500 text-xs mt-4">
                                💳 Powered by HitPay • Supports PayNow, Cards, and more
                            </div>
                        </div>
                    )}

                    {tab === 'withdraw' && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Withdraw Funds</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Withdrawal Amount (SGD)</label>
                                    <input
                                        type="number"
                                        min="10"
                                        step="0.01"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="Minimum $10"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        disabled={withdrawLoading}
                                    />
                                    <div className="text-gray-500 text-xs mt-1">
                                        Available: ${walletBalance.toFixed(2)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Bank Name</label>
                                    <input
                                        type="text"
                                        value={bankDetails.bankName}
                                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                                        placeholder="e.g., DBS, OCBC, UOB"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        disabled={withdrawLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Account Number</label>
                                    <input
                                        type="text"
                                        value={bankDetails.accountNumber}
                                        onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                                        placeholder="Enter bank account number"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        disabled={withdrawLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Account Name</label>
                                    <input
                                        type="text"
                                        value={bankDetails.accountName}
                                        onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                                        placeholder="Name as per bank account"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        disabled={withdrawLoading}
                                    />
                                </div>

                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                >
                                    {withdrawLoading ? 'Processing...' : 'Request Withdrawal'}
                                </button>

                                {error && (
                                    <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
                                        {success}
                                    </div>
                                )}

                                <div className="bg-gray-700 p-4 rounded-lg">
                                    <div className="text-gray-300 text-sm font-semibold mb-2">⚠️ Withdrawal Information</div>
                                    <ul className="text-gray-400 text-xs space-y-1">
                                        <li>• Minimum withdrawal: $10</li>
                                        <li>• Processing time: 1-3 business days</li>
                                        <li>• Withdrawals are processed to Singapore bank accounts only</li>
                                        <li>• No withdrawal fees</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
