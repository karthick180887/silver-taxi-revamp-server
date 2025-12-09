import { Booking, Customer, CustomerTransaction, CustomerWallet, Offers, PromoCodeUsage, OfferUsage } from '../models';
// import { createNotification, sendNotification, createCustomerNotification, sendToSingleToken, bookingConfirm } from '../services';
import { createNotification, createCustomerNotification, createDriverNotification } from './notificationCreate';
import { sendNotification } from '../../../common/services/socket/websocket';
import { sendToSingleToken } from '../../../common/services/firebase/appNotify';
import { bookingConfirm } from "../../../common/services/mail/mail";


import dayjs from 'dayjs';
import { debugLogger as debug } from '../../../utils/logger'; // Adjust debug import

// Apply promo code and create usage entry
export const applyPromoCode = async ({
    adminId,
    promoCode,
    usageId,
    codeId,
    codeType,
    value,
    discountAmount,
    customerId,
    bookingId,
    finalAmount,
}: {
    adminId: string;
    usageId: string;
    promoCode: string;
    codeId: string;
    codeType: "Flat" | "Percentage";
    value: number;
    discountAmount: number;
    customerId: string;
    bookingId: string;
    finalAmount: number;
}) => {
    console.log("UsageId >>", usageId);
    const promoCodeUsageData = {
        adminId,
        codeId,
        promoCodeUsageId: usageId,
        promoCode,
        customerId,
        bookingAmount: finalAmount,
        discountAmount,
        finalAmount: finalAmount - discountAmount,
        bookingId,
        type: codeType,
        value,
    };
    await PromoCodeUsage.create(promoCodeUsageData);
};

// Apply offer and create usage entry
export const applyOffer = async ({
    adminId,
    offerId,
    offerName,
    customerId,
    bookingId,
    finalAmount,
    discountAmount,
}: {
    adminId: string;
    offerId: string;
    offerName?: string;
    customerId: string;
    bookingId: string;
    finalAmount: number;
    discountAmount: number;
}) => {
    const offer = await Offers.findOne({ where: { offerId }, attributes: ['type'] });
    if (offer) {
        const offerUsageData = {
            adminId,
            offerId,
            offerName: offerName || '',
            customerId,
            bookingId,
            bookingAmount: finalAmount,
            type: offer.type,
            value: discountAmount,
            discountAmount,
            finalAmount: finalAmount - discountAmount,
        };
        await OfferUsage.create(offerUsageData);
        return true;
    }
    debug.info(`Offer not found >> ${offerId}`);
    return false;
};

// Send admin and customer notifications
export const sendBookingNotifications = async ({
    adminId,
    customerId,
    createdBy,
    bookingId,
    customerName,
    customerPhone,
    customerFcmToken,
    customerAdminId,
    from,
    to,
}: {
    adminId: string;
    customerId: string | null;
    createdBy: string;
    bookingId: string;
    customerName: string;
    customerPhone: string;
    customerFcmToken: string;
    customerAdminId: string;
    from: string;
    to: string | null;
}) => {
    const creator =
        createdBy === "Vendor"
            ? "Vendor"
            : createdBy === "User"
                ? "User"
                : "Admin";

    const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
    const notification = {
        adminId,
        customerId: createdBy === 'User' ? customerId : null,
        title: `New ${creator} Booking created`,
        // description: `Booking Id: ${bookingId}, Customer Name: ${customerName}, Phone: ${customerPhone}`,
        description: `Booking #${bookingId} | Customer: ${customerName} | Phone: ${customerPhone} | From: ${from} | To: ${to ?? 'N/A'}`,
        read: false,
        date: new Date(),
        time,
    };

    const notificationResponse = await createNotification(notification as any);
    if (notificationResponse.success) {
        sendNotification(adminId, {
            notificationId: notificationResponse.notificationId ?? undefined,
            title: notification.title,
            description: notification.description,
            read: false,
            date: new Date(),
            time,
        });
    }

    const customerNotification = await createCustomerNotification({
        title: 'Booking has been successfully placed',
        message: `Hi ${customerName}, your booking has been successfully placed.`,
        ids: {
            adminId,
            customerId,
        },
        type: 'booking',
    });

    if (customerNotification) {
        const tokenResponse = await sendToSingleToken(customerFcmToken, {
            ids: {
                adminId: customerAdminId,
                bookingId,
                customerId: customerId as string,
            },
            data: {
                title: 'Booking has been successfully placed',
                message: `Hi ${customerName}, your booking has been successfully placed.`,
                type: 'customer-booking-created',
                channelKey: 'booking_channel',
            },
        });
        debug.info(`FCM Notification Response: ${tokenResponse}`);
    } else {
        debug.info('Customer notification creation failed');
    }
};

// Deduct wallet amount and create transaction
export const deductWallet = async ({
    wallet,
    amount,
    adminId,
    customerId,
    bookingId,
    transactionId,
}: {
    wallet: CustomerWallet;
    amount: number;
    adminId: string;
    customerId: string;
    bookingId: string;
    transactionId: string;
}) => {
    const availableWalletAmount = wallet.balance;
    const actualWalletDeduction = Math.min(amount, availableWalletAmount);
    if (actualWalletDeduction > 0) {
        wallet.balance -= actualWalletDeduction;
        wallet.minusAmount += actualWalletDeduction;
        await wallet.save();

        await CustomerTransaction.create({
            adminId,
            transactionId,
            customerId,
            amount: actualWalletDeduction,
            type: 'Wallet',
            transactionType: 'Debit',
            date: dayjs().toDate(),
            source: 'App',
            reason: 'Wallet deduction',
            isShow: true,
            description: `Wallet deduction for booking ${bookingId}`,
            tnxPaymentStatus: 'Success',
        });
        return actualWalletDeduction;
    }
    return 0;
};

// Send booking confirmation email
export const sendBookingEmail = async ({
    booking,
    customer,
    pickupDateTime,
    dropDateObj,
    estimatedAmount,
    discountAmount,
    taxAmount,
    toll,
    hill,
    vehicleType,
    permitCharge,
    finalAmount,
    paymentMethod,
}: {
    booking: Booking;
    customer: Customer;
    pickupDateTime: string;
    dropDateObj: Date | null;
    estimatedAmount: number;
    discountAmount: number;
    taxAmount: number | null;
    vehicleType: string;
    toll: number | null;
    hill: number | null;
    permitCharge: number | null;
    finalAmount: number;
    paymentMethod: string;
}) => {
    try {
        const emailData = {
            bookingId: booking.bookingId,
            bookingDate: new Date(booking.createdAt).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
            fullName: customer.name,
            mobileNo: customer.phone,
            email: customer.email,
            pickup: booking.pickup,
            drop: booking.drop ?? null,
            pickupDate: new Date(pickupDateTime).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            pickupTime: new Date(pickupDateTime).toLocaleString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            dropDate: dropDateObj
                ? new Date(dropDateObj).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })
                : null,
            vehicleType:  vehicleType,
            // vehicleName: tariff.vehicles.name,
            serviceType: booking.serviceType,
            estimatedAmount,
            discountAmount,
            taxAmount,
            toll,
            hill,
            permitCharge,
            finalAmount,
            advanceAmount: booking.advanceAmount,
            upPaidAmount: booking.upPaidAmount,
            paymentMethod,
        };

        const emailResponse = await bookingConfirm(emailData);
        if (emailResponse.status === 200) {
            console.log(`Email sent successfully to ${emailResponse.sentTo}`);
        } else {
            console.log('Email not sent');
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
};