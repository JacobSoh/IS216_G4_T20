'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { createTopUpPayment } from '@/utils/hitpay/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import getUser from "@/hooks/getProfile";
import { InputControl } from '../sub';

export default function WalletModal({ isOpen, onClose }) {
    const { isAuthed } = useSupabaseAuth();

    const [state, setState] = useState({
        // User & wallet data
        user: null,
        balance: 0,
        held: 0,
        transactions: [],

        // Form inputs
        topUpAmount: '',
        withdrawAmount: '',
        bankName: '',
        accountNumber: '',
        accountName: '',

        // UI state
        tab: 'balance',
        loading: true,
        topUpLoading: false,
        withdrawLoading: false,
        error: null,
        success: null
    });

    const supabase = supabaseBrowser();
    const quickAmounts = [10, 50, 100, 200, 500];

    const updateState = (updates) => setState(prev => ({ ...prev, ...updates }));

    useEffect(() => {
        if (!isOpen || !isAuthed) return;

        const loadWalletData = async () => {
            updateState({ loading: true });

            try {
                const userData = await getUser();
                if (!userData?.id) return;

                const { data: profile } = await supabase
                    .from('profile')
                    .select('wallet_balance, wallet_held')
                    .eq('id', userData.id)
                    .single();

                const { data: txData } = await supabase
                    .from('wallet_transaction')
                    .select('*')
                    .eq('uid', userData.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                updateState({
                    user: userData,
                    balance: parseFloat(profile?.wallet_balance || 0),
                    held: parseFloat(profile?.wallet_held || 0),
                    transactions: txData || [],
                    loading: false
                });
            } catch (error) {
                console.error('Failed to load wallet data:', error);
                updateState({ error: 'Failed to load wallet data', loading: false });
            }
        };

        loadWalletData();
    }, [isOpen, isAuthed, supabase]);

    const handleTopUp = async (amount) => {
        if (!state.user) return;

        updateState({ topUpLoading: true, error: null, success: null });

        try {
            const result = await createTopUpPayment(amount, state.user.id, state.user.email);

            if (result.success) {
                window.location.href = result.checkoutUrl;
            } else {
                updateState({ error: result.error || 'Failed to create payment', topUpLoading: false });
            }
        } catch (err) {
            updateState({ error: err.message, topUpLoading: false });
        }
    };

    const handleWithdraw = async () => {
        if (!state.user) return;

        updateState({ withdrawLoading: true, error: null, success: null });

        try {
            const amount = parseFloat(state.withdrawAmount);

            if (isNaN(amount) || amount <= 0) throw new Error('Please enter a valid amount');
            if (amount > state.balance) throw new Error('Insufficient balance');
            if (amount < 10) throw new Error('Minimum withdrawal amount is $10');
            if (!state.bankName || !state.accountNumber || !state.accountName) {
                throw new Error('Please fill in all bank details');
            }

            const { error: txError } = await supabase
                .from('wallet_transaction')
                .insert({
                    uid: state.user.id,
                    transaction_type: 'withdraw',
                    amount: amount,
                    status: 'pending',
                    description: `Withdrawal to ${state.bankName} - ${state.accountNumber}`,
                    created_at: new Date().toISOString()
                });

            if (txError) throw txError;

            const { error: deductError } = await supabase
                .from('profile')
                .update({ wallet_balance: state.balance - amount })
                .eq('id', state.user.id);

            if (deductError) throw deductError;

            updateState({
                success: 'Withdrawal request submitted successfully! Processing time: 1-3 business days',
                withdrawAmount: '',
                bankName: '',
                accountNumber: '',
                accountName: '',
                withdrawLoading: false
            });

            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            updateState({ error: err.message, withdrawLoading: false });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-white">My Wallet</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">×</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    {['balance', 'topup', 'withdraw'].map(t => (
                        <button
                            key={t}
                            onClick={() => updateState({ tab: t })}
                            className={`flex-1 px-6 py-3 font-semibold transition ${
                                state.tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            {t === 'balance' ? 'Balance' : t === 'topup' ? 'Top Up' : 'Withdraw'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6">
                    {state.error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                            {state.error}
                        </div>
                    )}

                    {state.success && (
                        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
                            {state.success}
                        </div>
                    )}

                    {state.tab === 'balance' && (
                        <div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <p className="text-gray-400 text-sm mb-1">Available Balance</p>
                                    <p className="text-2xl font-bold text-green-400">${state.balance.toFixed(2)}</p>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <p className="text-gray-400 text-sm mb-1">Held (Active Bids)</p>
                                    <p className="text-2xl font-bold text-yellow-400">${state.held.toFixed(2)}</p>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-3 text-white">Recent Transactions</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {state.transactions.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">No transactions yet</p>
                                ) : (
                                    state.transactions.map(tx => (
                                        <div key={tx.tid} className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-white">{tx.description}</p>
                                                <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${
                                                    tx.transaction_type === 'topup' || tx.transaction_type === 'release' ? 'text-green-400' : 'text-red-400'
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

                    {state.tab === 'topup' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-white">Top Up Your Wallet</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                {quickAmounts.map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => handleTopUp(amt)}
                                        disabled={state.topUpLoading}
                                        className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition disabled:opacity-50 text-white"
                                    >
                                        ${amt}
                                    </button>
                                ))}
                            </div>

                            <InputControl
                                labelText="Custom Amount"
                                formName="topUpAmount"
                                type="number"
                                value={state.topUpAmount}
                                onChange={(e) => updateState({ topUpAmount: e.target.value })}
                                placeholder="Enter amount"
                                isRequired={false}
                            />

                            <button
                                onClick={() => handleTopUp(parseFloat(state.topUpAmount))}
                                disabled={state.topUpLoading || !state.topUpAmount || parseFloat(state.topUpAmount) <= 0}
                                className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition disabled:opacity-50 text-white"
                            >
                                {state.topUpLoading ? 'Processing...' : 'Top Up'}
                            </button>
                        </div>
                    )}

                    {state.tab === 'withdraw' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-white">Withdraw Funds</h3>
                            <p className="text-gray-400 mb-4">Available: ${state.balance.toFixed(2)}</p>

                            <div className="space-y-4">
                                <InputControl
                                    labelText="Bank Name"
                                    formName="bankName"
                                    type="text"
                                    value={state.bankName}
                                    onChange={(e) => updateState({ bankName: e.target.value })}
                                    placeholder="Enter bank name"
                                    isRequired={true}
                                />

                                <InputControl
                                    labelText="Account Number"
                                    formName="accountNumber"
                                    type="text"
                                    value={state.accountNumber}
                                    onChange={(e) => updateState({ accountNumber: e.target.value })}
                                    placeholder="Enter account number"
                                    isRequired={true}
                                />

                                <InputControl
                                    labelText="Account Name"
                                    formName="accountName"
                                    type="text"
                                    value={state.accountName}
                                    onChange={(e) => updateState({ accountName: e.target.value })}
                                    placeholder="Enter account name"
                                    isRequired={true}
                                />

                                <InputControl
                                    labelText="Withdrawal Amount (Min $10)"
                                    formName="withdrawAmount"
                                    type="number"
                                    value={state.withdrawAmount}
                                    onChange={(e) => updateState({ withdrawAmount: e.target.value })}
                                    placeholder="Enter amount"
                                    isRequired={true}
                                />

                                <button
                                    onClick={handleWithdraw}
                                    disabled={state.withdrawLoading}
                                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition disabled:opacity-50 text-white"
                                >
                                    {state.withdrawLoading ? 'Processing...' : 'Request Withdrawal'}
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 mt-4">* Withdrawals are processed within 1-3 business days</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
