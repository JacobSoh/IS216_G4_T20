import { NextResponse } from 'next/server';
import { validateWebhook } from '@/utils/hitpay/webhook';
import { supabaseServer } from '@/utils/supabase/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const payload = Object.fromEntries(formData);

        console.log('=== WEBHOOK RECEIVED ===');
        console.log('Payload:', payload);

        // Validate webhook signature
        if (!validateWebhook(payload, payload.hmac)) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const { payment_id, reference_number, amount, currency, status } = payload;

        console.log('Payment Status:', status);

        if (status !== 'completed') {
            console.log('Payment not completed, skipping...');
            return NextResponse.json({ message: 'Payment not completed' }, { status: 200 });
        }

        // Extract user ID from reference_number (format: TOPUP_userId_timestamp)
        const parts = reference_number.split('_');
        if (parts[0] !== 'TOPUP' || !parts[1]) {
            console.error('Invalid reference format:', reference_number);
            return NextResponse.json({ error: 'Invalid reference' }, { status: 400 });
        }

        const userId = parts[1];
        const topupAmount = parseFloat(amount);

        console.log('Processing top-up:', { userId, amount: topupAmount });

        const supabase = await supabaseServer();

        // Create wallet transaction record
        const { error: txError } = await supabase
            .from('wallet_transaction')
            .insert({
                uid: userId,
                transaction_type: 'topup',
                amount: topupAmount,
                status: 'completed',
                reference_id: payment_id,
                description: `Wallet top-up via HitPay`,
                completed_at: new Date().toISOString()
            });

        if (txError) {
            console.error('Transaction creation error:', txError);
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        console.log('Transaction record created');

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
        const newBalance = currentBalance + topupAmount;

        // Update user wallet balance
        const { error: updateError } = await supabase
            .from('profile')
            .update({ wallet_balance: newBalance })
            .eq('id', userId);

        if (updateError) {
            console.error('Wallet update error:', updateError);
            return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
        }

        console.log(`✅ Wallet topped up: User ${userId}, Amount ${topupAmount}, New Balance: ${newBalance}`);

        return NextResponse.json({ message: 'Wallet updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
