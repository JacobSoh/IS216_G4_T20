'use client';

import { useState, useEffect, useReducer } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { createTopUpPayment } from '@/utils/hitpay/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { CustomSelect, CustomTextarea } from '@/components/Form';

const initialWallet = {
    wallet_balance: 0,
    wallet_held: 0
};

const reducer = (s, a) => {
	switch (a.type) {
		case 'FIELD': return { ...s, [a.field]: a.value };
		case 'RESET': return intitial;
		default: return s;
	};
};

export default function WalletModal({
    profile
}) {
    const [wallet, setWallet] = useReducer(reducer, initialWallet);

    const { isAuthed } = useSupabaseAuth();

    // Format large numbers - show in millions if >= 1,000,000
    const formatBalance = (amount) => {
        const num = parseFloat(amount) || 0;
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(2)} million`;
        }
        return num.toFixed(2);
    };
    // const [session, setSession] = useState(null);
    const [tab, setTab] = useState('balance');

    // const [walletBalance, setWalletBalance] = useState(0);
    // const [walletHeld, setWalletHeld] = useState(0);
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
    const [withdrawNote, setWithdrawNote] = useState('');

    const quickAmounts = [10, 50, 100, 200, 500];
    const BANK_OPTIONS = [
        { value: 'DBS', label: 'DBS Bank' },
        { value: 'OCBC', label: 'OCBC Bank' },
        { value: 'UOB', label: 'UOB' },
        { value: 'HSBC', label: 'HSBC' },
        { value: 'Standard Chartered', label: 'Standard Chartered' },
        { value: 'Maybank', label: 'Maybank' },
        { value: 'CIMB', label: 'CIMB Bank' },
    ];

    useEffect(() => {

        const fetchWalletData = async () => {
            const sb = supabaseBrowser();
            setLoading(true);

            setWallet({ type: 'FIELD', field: 'wallet_balance', value: profile?.wallet_balance || 0 });
            setWallet({ type: 'FIELD', field: 'wallet_held', value: profile?.wallet_held || 0 });



            const { data: txData } = await sb
                .from('wallet_transaction')
                .select('*')
                .eq('uid', profile.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (txData) {
                setTransactions(txData);
            }

            setLoading(false);
        };

        fetchWalletData();
    }, []);

    const handleTopUp = async (amount) => {

        setTopUpLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Get current origin for redirect after payment
            const currentOrigin = typeof window !== 'undefined' ? window.location.origin : null;

            const result = await createTopUpPayment(
                amount,
                profile.id,
                profile.email,
                currentOrigin
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

            if (amount > profile?.wallet_balance) {
                throw new Error('Insufficient balance');
            }

            if (amount < 10) {
                throw new Error('Minimum withdrawal amount is $10');
            }

            if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
                throw new Error('Please fill in all bank details');
            }

            const { error: txError } = await sb
                .from('wallet_transaction')
                .insert({
                    uid: session.user.id,
                    transaction_type: 'withdraw',
                    amount: amount,
                    status: 'pending',
                    description: `Withdrawal to ${bankDetails.bankName} - ${bankDetails.accountNumber}${withdrawNote ? ` | ${withdrawNote}` : ''}`,
                    created_at: new Date().toISOString()
                });

            if (txError) throw txError;

            const { error: deductError } = await sb
                .from('profile')
                .update({
                    wallet_balance: profile?.wallet_balance - amount
                })
                .eq('id', session.user.id);

            if (deductError) throw deductError;

            setSuccess('Withdrawal request submitted successfully! Processing time: 1-3 business days');
            setWithdrawAmount('');
            setBankDetails({ bankName: '', accountNumber: '', accountName: '' });
            setWithdrawNote('');

            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setWithdrawLoading(false);
        }
    };

    return (
        <div className="bg-[var(--custom-bg-secondary)] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-[var(--custom-border-color)]">
                <button
                    onClick={() => setTab('balance')}
                    className={`flex-1 px-6 py-3 font-semibold transition ${tab === 'balance'
                            ? 'bg-[var(--theme-primary)] text-[var(--theme-cream)]'
                            : 'bg-[var(--custom-bg-secondary)] text-[var(--custom-text-muted)] hover:bg-[var(--custom-bg-tertiary)]'
                        }`}
                >
                    Balance
                </button>
                <button
                    onClick={() => setTab('topup')}
                    className={`flex-1 px-6 py-3 font-semibold transition ${tab === 'topup'
                            ? 'bg-[var(--theme-primary)] text-[var(--theme-cream)]'
                            : 'bg-[var(--custom-bg-secondary)] text-[var(--custom-text-muted)] hover:bg-[var(--custom-bg-tertiary)]'
                        }`}
                >
                    Top Up
                </button>
                <button
                    onClick={() => setTab('withdraw')}
                    className={`flex-1 px-6 py-3 font-semibold transition ${tab === 'withdraw'
                            ? 'bg-[var(--theme-primary)] text-[var(--theme-cream)]'
                            : 'bg-[var(--custom-bg-secondary)] text-[var(--custom-text-muted)] hover:bg-[var(--custom-bg-tertiary)]'
                        }`}
                >
                    Withdraw
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {error && (
                    <div className="mb-4 p-4 bg-[var(--custom-accent-red)]/20 border border-[var(--custom-accent-red)] rounded-md text-[var(--theme-cream)]">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-[var(--theme-gold)]/20 border border-[var(--theme-gold)] rounded-md text-[var(--theme-gold)]">
                        {success}
                    </div>
                )}

                {tab === 'balance' && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-center">
                            <div className="bg-[var(--custom-bg-tertiary)] rounded-md p-4 border border-[var(--custom-border-color)]">
                                <p className="text-[var(--custom-text-muted)] text-sm mb-1">Available Balance</p>
                                <p className="text-2xl font-bold text-[var(--theme-gold)]">
                                    ${formatBalance(profile?.wallet_balance)}
                                </p>
                            </div>
                            <div className="bg-[var(--custom-bg-tertiary)] rounded-md p-4 border border-[var(--custom-border-color)]">
                                <p className="text-[var(--custom-text-muted)] text-sm mb-1">Held (Active Bids)</p>
                                <p className="text-2xl font-bold text-[var(--theme-accent)]">
                                    ${formatBalance(profile?.wallet_held)}
                                </p>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold mb-3 text-[var(--custom-text-primary)]">Recent Transactions</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {transactions.length === 0 ? (
                                <p className="text-[var(--custom-text-muted)] text-center py-4">No transactions yet</p>
                            ) : (
                                transactions.map((tx) => (
                                    <div
                                        key={tx.tid}
                                        className="bg-[var(--custom-bg-tertiary)] border border-[var(--custom-border-color)] rounded-md p-3 flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-semibold text-[var(--custom-text-primary)]">{tx.description}</p>
                                            <p className="text-xs text-[var(--custom-text-muted)]">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${tx.transaction_type === 'topup' || tx.transaction_type === 'release'
                                                    ? 'text-[var(--theme-gold)]'
                                                    : 'text-[var(--theme-accent)]'
                                                }`}>
                                                {tx.transaction_type === 'topup' || tx.transaction_type === 'release' ? '+' : '-'}
                                                ${parseFloat(tx.amount).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-[var(--custom-text-muted)] capitalize">{tx.status}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {tab === 'topup' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-[var(--custom-text-primary)]">Top Up Your Wallet</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                            {quickAmounts.map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => handleTopUp(amt)}
                                    disabled={topUpLoading}
                                    className="px-6 py-4 bg-[var(--custom-bg-tertiary)] hover:bg-[var(--theme-primary)] hover:text-[var(--theme-cream)] border border-[var(--custom-border-color)] rounded-md font-semibold transition disabled:opacity-50 text-[var(--custom-text-primary)]"
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
                                className="flex-1 px-4 py-2 bg-[var(--custom-bg-tertiary)] border border-[var(--custom-border-color)] rounded-md text-[var(--custom-text-primary)] placeholder:text-[var(--custom-text-muted)] focus:outline-none focus:border-[var(--theme-secondary)]"
                            />
                            <button
                                onClick={() => handleTopUp(parseFloat(topUpAmount))}
                                disabled={topUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
                                className="px-6 py-2 bg-[var(--theme-gold)] hover:bg-[var(--nav-cta-hover-bg)] text-[var(--theme-primary)] rounded-md font-semibold transition disabled:opacity-50"
                            >
                                {topUpLoading ? 'Processing...' : 'Top Up'}
                            </button>
                        </div>
                    </div>
                )}

                {tab === 'withdraw' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-[var(--custom-text-primary)]">Withdraw Funds</h3>
                        <p className="text-[var(--custom-text-muted)] mb-4">
                            Available: <span className="text-[var(--theme-gold)] font-semibold">${formatBalance(profile?.wallet_balance)}</span>
                        </p>

                        <div className="space-y-4">
                            <CustomSelect
                                type="withdrawBank"
                                label="Bank"
                                placeholder="Select your bank"
                                options={BANK_OPTIONS}
                                value={bankDetails.bankName}
                                onChange={(event) => setBankDetails({ ...bankDetails, bankName: event.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Account Number"
                                value={bankDetails.accountNumber}
                                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                className="w-full px-4 py-2 bg-[var(--custom-bg-tertiary)] border border-[var(--custom-border-color)] rounded-md text-[var(--custom-text-primary)] placeholder:text-[var(--custom-text-muted)] focus:outline-none focus:border-[var(--theme-secondary)]"
                            />
                            <input
                                type="text"
                                placeholder="Account Name"
                                value={bankDetails.accountName}
                                onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                className="w-full px-4 py-2 bg-[var(--custom-bg-tertiary)] border border-[var(--custom-border-color)] rounded-md text-[var(--custom-text-primary)] placeholder:text-[var(--custom-text-muted)] focus:outline-none focus:border-[var(--theme-secondary)]"
                            />
                            <input
                                type="number"
                                placeholder="Withdrawal Amount (Min $10)"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full px-4 py-2 bg-[var(--custom-bg-tertiary)] border border-[var(--custom-border-color)] rounded-md text-[var(--custom-text-primary)] placeholder:text-[var(--custom-text-muted)] focus:outline-none focus:border-[var(--theme-secondary)]"
                            />
                            <CustomTextarea
                                type="withdrawNote"
                                label="Notes (optional)"
                                placeholder="Include any reference or instructions for this withdrawal"
                                value={withdrawNote}
                                onChange={(event) => setWithdrawNote(event.target.value)}
                                autoGrow
                                className="bg-[var(--custom-bg-tertiary)] border border-[var(--custom-border-color)] text-[var(--custom-text-primary)]"
                            />
                            <button
                                onClick={handleWithdraw}
                                disabled={withdrawLoading}
                                className="w-full px-6 py-3 bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-[var(--theme-cream)] rounded-md font-semibold transition disabled:opacity-50"
                            >
                                {withdrawLoading ? 'Processing...' : 'Request Withdrawal'}
                            </button>
                        </div>

                        <p className="text-xs text-[var(--custom-text-muted)] mt-4">
                            * Withdrawals are processed within 1-3 business days
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
