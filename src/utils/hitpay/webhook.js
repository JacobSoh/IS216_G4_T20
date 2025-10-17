import crypto from 'crypto';

const HITPAY_SALT = process.env.HITPAY_SALT;

// Validate webhook signature
export function validateWebhook(payload, receivedHmac) {
    // Remove hmac from payload
    const { hmac, ...dataToSign } = payload;

    // Sort keys and concatenate
    const sortedKeys = Object.keys(dataToSign).sort();
    const signatureString = sortedKeys
        .map(key => `${key}${dataToSign[key]}`)
        .join('');

    // Generate HMAC
    const calculatedHmac = crypto
        .createHmac('sha256', HITPAY_SALT)
        .update(signatureString)
        .digest('hex');

    return calculatedHmac === receivedHmac;
}
