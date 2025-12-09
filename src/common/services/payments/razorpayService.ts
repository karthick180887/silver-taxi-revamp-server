import initRazorpay from '../../../common/configs/razorpay';
import crypto from 'crypto';
import { debugLogger as debug } from '../../../utils/logger';


interface CreateOrderParams {
    amount: number; // in INR
    currency?: string;
    receipt?: string;
    notes?: Record<string, any>;
}


interface CreatePaymentLinkParams {
    amount: number; // in INR
    description?: string;
    customer: {
        name: string;
        email: string;
        contact: string;
    };
    notes?: Record<string, any>;
    callbackUrl?: string;
    callbackMethod?: 'get' | 'post';
}

/**
 * Create a Razorpay order
 */
export const createRazorpayOrder = async ({
    amount,
    currency = 'INR',
    receipt,
    notes,
}: CreateOrderParams) => {
    const razorpay = await initRazorpay()
    const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // amount in paise
        currency,
        receipt: receipt ?? `receipt_${Date.now()}`,
        notes,
    });

    return order;
};

/**
 * Generate a Razorpay Payment Link
 */
/**
 * Generate a Razorpay Payment Link
 */
export const createRazorpayPaymentLink = async ({
    amount,
    description = 'Payment',
    customer,
    notes,
    callbackUrl,
    callbackMethod = 'post',
}: CreatePaymentLinkParams) => {
    const razorpay = await initRazorpay()
    const paymentLink = await razorpay.paymentLink.create({
        amount: Math.round(amount * 100), // amount in paise
        currency: 'INR',
        accept_partial: false,
        description,
        customer,
        notify: {
            sms: true,
            // email: true,
        },
        reminder_enable: true,
        notes,
        // callback_url: callbackUrl ?? 'https://api.silver.thereciprocalsolutions.com/payment/success',
        // callback_method: callbackMethod,
    });

    debug.info(`Razorpay Payment Link >> ${JSON.stringify(paymentLink, null, 2)}`);

    return paymentLink;
};



/**
 * Verify payment signature
 */
export const verifyRazorpaySignature = ({
    orderId,
    paymentId,
    razorpaySignature,
}: {
    orderId: string;
    paymentId: string;
    razorpaySignature: string;
}) => {
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return generatedSignature === razorpaySignature;
};

/**
 * Capture a payment manually (only if not auto-captured)
 */
export const captureRazorpayPayment = async ({
    paymentId,
    amount,
    currency = 'INR',
}: {
    paymentId: string;
    amount: number;
    currency?: string;
}) => {
    const razorpay = await initRazorpay()
    return await razorpay.payments.capture(paymentId, Math.round(amount * 100), currency);
};

/**
 * Refund a payment (full or partial)
 */
export const refundRazorpayPayment = async ({
    paymentId,
    amount,
    notes,
}: {
    paymentId: string;
    amount?: number; // optional (paise)
    notes?: Record<string, any>;
}) => {
    const razorpay = await initRazorpay()
    return await razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined,
        notes,
    });
};

/**
 * Fetch an order by ID
 */
export const fetchRazorpayOrder = async (orderId: string) => {
    const razorpay = await initRazorpay()
    return await razorpay.orders.fetch(orderId);
};

/**
 * Fetch a payment by ID
 */
export const fetchRazorpayPayment = async (paymentId: string) => {
    const razorpay = await initRazorpay()
    return await razorpay.payments.fetch(paymentId);
};

/**
 * Fetch a payment link by ID
 */
export const fetchRazorpayPaymentLink = async (paymentLinkId: string) => {
    const razorpay = await initRazorpay()
    return await razorpay.paymentLink.fetch(paymentLinkId);
};
