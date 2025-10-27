'use server';

// Configuration
const CONFIG = {
    apiKey: process.env.HITPAY_API_KEY,
    apiUrl: process.env.HITPAY_API_URL || 'https://api.sandbox.hit-pay.com/v1',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    currency: 'SGD',
    paymentMethods: ['paynow_online', 'card']
};

// Helper to build form data
function buildPaymentFormData({ amount, email, userId }) {
    const formData = new URLSearchParams();

    formData.append('amount', amount.toString());
    formData.append('currency', CONFIG.currency);
    formData.append('email', email);
    formData.append('purpose', 'Wallet Top-Up');
    formData.append('reference_number', `TOPUP_${userId}_${Date.now()}`);
    formData.append('redirect_url', `${CONFIG.baseUrl}/profile`);
    formData.append('webhook', `${CONFIG.baseUrl}/api/hitpay/webhook`);

    CONFIG.paymentMethods.forEach(method => {
        formData.append('payment_methods[]', method);
    });

    return formData;
}

// Main payment creation function
export async function createTopUpPayment(amount, userId, email) {
    // Validate API key
    if (!CONFIG.apiKey) {
        return {
            success: false,
            error: 'HitPay API key is not configured. Please check your .env.local file.'
        };
    }

    // Validate inputs
    if (!amount || amount <= 0) {
        return {
            success: false,
            error: 'Invalid amount. Amount must be greater than 0.'
        };
    }

    if (!userId || !email) {
        return {
            success: false,
            error: 'User ID and email are required.'
        };
    }

    try {
        const formData = buildPaymentFormData({ amount, email, userId });

        console.log('Creating HitPay payment:', {
            amount,
            userId,
            email,
            reference: `TOPUP_${userId}_${Date.now()}`
        });

        const response = await fetch(`${CONFIG.apiUrl}/payment-requests`, {
            method: 'POST',
            headers: {
                'X-BUSINESS-API-KEY': CONFIG.apiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('HitPay API Error:', {
                status: response.status,
                data
            });
            throw new Error(data.message || data.error || 'Failed to create payment');
        }

        console.log('HitPay payment created successfully:', data.id);

        return {
            success: true,
            paymentRequestId: data.id,
            checkoutUrl: data.url,
            reference: formData.get('reference_number')
        };
    } catch (error) {
        console.error('HitPay payment creation error:', error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred'
        };
    }
}
