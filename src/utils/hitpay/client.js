'use server';

const HITPAY_API_KEY = process.env.HITPAY_API_KEY;
const HITPAY_API_URL = process.env.HITPAY_API_URL || 'https://api.sandbox.hit-pay.com/v1';

export async function createTopUpPayment(amount, userId, email) {
    console.log('=== HITPAY DEBUG ===');
    console.log('API Key exists:', !!HITPAY_API_KEY);
    console.log('API Key prefix:', HITPAY_API_KEY ? HITPAY_API_KEY.substring(0, 10) + '...' : 'MISSING');
    console.log('API URL:', HITPAY_API_URL);
    console.log('Amount:', amount);
    console.log('User ID:', userId);
    console.log('Email:', email);

    if (!HITPAY_API_KEY) {
        return {
            success: false,
            error: 'HitPay API key is not configured. Please check your .env.local file.'
        };
    }

    try {
        const formData = new URLSearchParams();
        formData.append('amount', amount.toString());
        formData.append('currency', 'SGD');
        formData.append('email', email);
        formData.append('purpose', 'Wallet Top-Up');
        formData.append('reference_number', `TOPUP_${userId}_${Date.now()}`);
        formData.append('redirect_url', `${process.env.NEXT_PUBLIC_BASE_URL}/profile_page`);

        // Add webhook URL (now that ngrok is working)
        formData.append('webhook', `${process.env.NEXT_PUBLIC_BASE_URL}/api/hitpay/webhook`);

        formData.append('payment_methods[]', 'paynow_online');
        formData.append('payment_methods[]', 'card');

        console.log('Request body:', formData.toString());

        const response = await fetch(`${HITPAY_API_URL}/payment-requests`, {
            method: 'POST',
            headers: {
                'X-BUSINESS-API-KEY': HITPAY_API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (!response.ok) {
            console.error('HitPay API Error:', data);
            throw new Error(data.message || data.error || 'Failed to create payment');
        }

        console.log('✅ Payment request created successfully!');
        console.log('Payment ID:', data.id);
        console.log('Checkout URL:', data.url);
        console.log('Webhook URL:', data.webhook);

        return {
            success: true,
            paymentRequestId: data.id,
            checkoutUrl: data.url
        };
    } catch (error) {
        console.error('HitPay payment creation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
