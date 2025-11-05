import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabase/server';

export async function POST(request) {
    try {
        const { payment_ref, amount, userId } = await request.json();

        if (!payment_ref || !amount || !userId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const supabase = await supabaseServer();

        // Check if this payment has already been processed
        const { data: existingTx } = await supabase
            .from('wallet_transaction')
            .select('tid')
            .eq('uid', userId)
            .eq('description', `Wallet top-up via HitPay`)
            .eq('amount', parseFloat(amount))
            .eq('transaction_type', 'topup')
            .eq('status', 'completed')
            .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Within last 5 minutes
            .maybeSingle();

        if (existingTx) {
            console.log('Payment already processed:', payment_ref);
            return NextResponse.json({ message: 'Payment already processed', alreadyProcessed: true }, { status: 200 });
        }

        // Create transaction record
        const { error: txError } = await supabase
            .from('wallet_transaction')
            .insert({
                uid: userId,
                transaction_type: 'topup',
                amount: parseFloat(amount),
                status: 'completed',
                reference_id: payment_ref,
                description: `Wallet top-up via HitPay`,
                completed_at: new Date().toISOString()
            });

        if (txError) {
            console.error('Transaction creation error:', txError);
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        // Get current wallet balance
        const { data: profileData, error: profileError } = await supabase
            .from('profile')
            .select('wallet_balance')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
        }

        const currentBalance = Number(profileData?.wallet_balance ?? 0);
        const newBalance = currentBalance + parseFloat(amount);

        // Update wallet balance
        const { error: updateError } = await supabase
            .from('profile')
            .update({ wallet_balance: newBalance })
            .eq('id', userId);

        if (updateError) {
            console.error('Wallet update error:', updateError);
            return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
        }

        console.log(`✅ Wallet topped up via redirect: User ${userId}, Amount ${amount}, New Balance: ${newBalance}`);

        return NextResponse.json({
            message: 'Wallet updated successfully',
            newBalance,
            success: true
        }, { status: 200 });

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
