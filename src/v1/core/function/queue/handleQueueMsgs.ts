import { DriverBookingLog } from "../../models/driverBookingLog";
import { sendToSingleToken, sendBatchNotifications } from "../../../../common/services/firebase/appNotify";
import {
    createDriverNotification,
    createCustomerNotification,
    createVendorNotification
} from "../notificationCreate";
import dayjs from "../../../../utils/dayjs";
import { sendWhatsAppMessage } from "../../../../common/services/whatsApp/wachat";

// Driver Notification Handler
export const handleDriverNotification = async (msg: any, target: string) => {
    try {
        if (!msg.fcmToken || !msg.payload) {
            // console.log("❌ Missing required FCM fields for driver", { target });
            return;
        }

        console.log("✅ Driver FCM Message received", { msg: msg.payload.ids, target });

        switch (msg.type) {
            case "new-booking":

                const requestSentTime = dayjs().toDate();

                const driverNotification = await createDriverNotification({
                    title: msg.payload.title || "New Booking",
                    imageUrl: msg.payload.imageUrl,
                    message: msg.payload.message || `Mr ${msg.payload.driverName}, you have received a new booking.`,
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        driverId: msg.payload.ids.driverId,
                    },
                    type: "booking",
                });

                if (driverNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.ids.adminId,
                            bookingId: msg.payload.ids.bookingId,
                            driverId: msg.payload.ids.driverId,
                        },
                        data: {
                            title: "🚗 1 Trip Available",
                            message: `₹${msg.payload.booking?.estimatedAmount || msg.payload.booking?.finalAmount || '0'} - ${msg.payload.booking?.pickup || 'Pickup'} → ${msg.payload.booking?.drop || 'Drop'}`,
                            type: "new-booking",
                            channelKey: "booking_channel",
                            bookingId: String(msg.payload.ids.bookingId),
                            adminId: String(msg.payload.ids.adminId),
                            // Trip details for overlay popup
                            pickup: String(msg.payload.booking?.pickup || 'Pickup Location'),
                            drop: String(msg.payload.booking?.drop || 'Drop Location'),
                            fare: String(msg.payload.booking?.estimatedAmount || msg.payload.booking?.finalAmount || '0'),
                            estimatedPrice: String(msg.payload.booking?.estimatedAmount || msg.payload.booking?.finalAmount || '0'),
                            customerName: String(msg.payload.booking?.name || msg.payload.booking?.customerName || 'Customer'),
                            customerPhone: String(msg.payload.booking?.phone || ''),
                            pickupDateTime: String(msg.payload.booking?.pickupDateTime || ''),
                            serviceType: String(msg.payload.booking?.serviceType || ''),
                            click_action: "FLUTTER_NOTIFICATION_CLICK",
                            fullScreenIntent: "true",
                        },
                        priority: "high"
                    });
                    console.log("✅ Driver FCM sent", { fcmResult, target, driverId: msg.payload.ids.driverId });
                }

                // Log activity
                await DriverBookingLog.upsert({
                    adminId: msg.payload.ids.adminId,
                    driverId: msg.payload.ids.driverId,
                    bookingId: msg.payload.ids.bookingId,
                    requestSendTime: requestSentTime,
                }).catch((err) => console.error(`⚠️ Failed to log for ${msg.payload.ids.driverId}:`, err));
                break;

            case "payment":
                const paymentNotification = await createDriverNotification({
                    title: "Payment Received",
                    message: `Mr ${msg.payload.driverName}, you have received a payment.`,
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        driverId: msg.payload.ids.driverId,
                    },
                    type: "payment",
                });

                if (paymentNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.adminId,
                            driverId: msg.payload.driverId,
                        },
                        data: {
                            title: "Payment Received",
                            message: `Mr ${msg.payload.driverName}, you have received a payment`,
                            type: "payment",
                            channelKey: "payment_channel",
                        },
                    });
                    console.log("✅ Payment FCM sent", { fcmResult, target });
                }
                break;
            case "custom":
                const customNotification = await createDriverNotification({
                    title: msg.payload.title,
                    imageUrl: msg.payload.imageUrl,
                    message: msg.payload.message,
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        driverId: msg.payload.ids.driverId,
                        templateId: msg.payload.ids.templateId,
                    },
                    type: "custom",
                });

                if (customNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.adminId,
                            driverId: msg.payload.driverId,
                            templateId: msg.payload.templateId,
                        },
                        data: {
                            imageUrl: msg.payload.imageUrl || "",
                            title: msg.payload.title || "",
                            message: msg.payload.message || "",
                            type: "custom",
                            channelKey: "others_channel",
                        },
                    });
                    console.log("✅ Custom FCM sent", { fcmResult, target, driverId: msg.payload.driverId });
                }
                break;

            default:
                const fallbackNotification = await createDriverNotification({
                    title: msg.payload.title || "Notification",
                    message: msg.payload.message || "You have a new notification.",
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        driverId: msg.payload.ids.driverId,
                    },
                    type: msg.type || "general",
                });

                if (fallbackNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, msg.payload);
                    console.log(`✅ Fallback FCM sent for type=${msg.type}`, { fcmResult, target });
                }
        }
    } catch (error) {
        console.log("❌ Driver notification error", { error, msg, target });
    }
};

// Batch Driver Notification Handler
export const handleBatchDriverNotification = async (msg: any, target: string) => {
    try {
        if ((!msg.fcmTokens || msg.fcmTokens.length === 0) || !msg.payload) {
            // console.log("❌ Missing required FCM fields for batch driver notification", { target });
            return;
        }

        console.log(`✅ Batch Driver FCM Message received for ${msg.fcmTokens.length} tokens`, { target });

        const fcmResult = await sendBatchNotifications(msg.fcmTokens, {
            ids: msg.payload.ids || {},
            data: msg.payload.data || {},
            title: msg.payload.title,
            message: msg.payload.message,
            image: msg.payload.imageUrl
        });

        console.log("✅ Batch Driver FCM processed", {
            success: fcmResult.successCount,
            failure: fcmResult.failureCount,
            target
        });

    } catch (error) {
        console.log("❌ Batch driver notification error", { error, msg, target });
    }
};

// Customer Notification Handler
export const handleCustomerNotification = async (msg: any, target: string) => {
    try {
        if (!msg.fcmToken || !msg.payload) {
            // console.log("❌ Missing required FCM fields for customer", { target });
            return;
        }

        console.log("✅ Customer FCM Message received", { msg: msg.type, target });

        switch (msg.type) {
            case "booking-confirmed":
                const bookingNotification = await createCustomerNotification({
                    title: "Booking Confirmed",
                    message: `Your booking has been confirmed. Driver will arrive shortly.`,
                    ids: {
                        adminId: msg.payload.adminId,
                        customerId: msg.payload.customerId,
                    },
                    type: "booking",
                });

                if (bookingNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.adminId,
                            customerId: msg.payload.customerId,
                            bookingId: msg.payload.bookingId,
                        },
                        data: {
                            title: "Booking Confirmed",
                            message: "Your booking has been confirmed. Driver will arrive shortly",
                            type: "booking-confirmed",
                            channelKey: "booking_channel",
                        },
                    });
                    console.log("✅ Customer booking FCM sent", { fcmResult, target });
                }
                break;

            case "driver-arrived":
                const arrivalNotification = await createCustomerNotification({
                    title: "Driver Arrived",
                    message: `Your driver has arrived at the pickup location.`,
                    ids: {
                        adminId: msg.payload.adminId,
                        bookingId: msg.payload.bookingId,
                        customerId: msg.payload.customerId,
                    },
                    type: "trip",
                });

                if (arrivalNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.adminId,
                            customerId: msg.payload.customerId,
                            bookingId: msg.payload.bookingId,
                        },
                        data: {
                            title: "Driver Arrived",
                            message: "Your driver has arrived at the pickup location",
                            type: "driver-arrived",
                            channelKey: "trip_channel",
                        },
                    });
                    console.log("✅ Customer arrival FCM sent", { fcmResult, target });
                }
                break;
            case "custom":
                const customNotification = await createCustomerNotification({
                    imageUrl: msg.payload.imageUrl,
                    title: msg.payload.title || "Notification",
                    message: msg.payload.message || "You have a new notification.",
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        customerId: msg.payload.ids.customerId,
                        templateId: msg.payload.ids.templateId,
                    },
                    type: "custom",
                });

                if (customNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.ids.adminId,
                            customerId: msg.payload.ids.customerId,
                            templateId: msg.payload.ids.templateId,
                        },
                        data: {
                            imageUrl: msg.payload.imageUrl || "",
                            title: msg.payload.title || "Notification",
                            message: msg.payload.message || "You have a new notification.",
                            type: "custom",
                            channelKey: "others_channel", // Changed from trip_channel to match others
                        },
                    });
                    console.log("✅ Customer custom FCM sent", { fcmResult, target, customerId: msg.payload.ids.customerId });
                }
                break;

            case "payment":
                const paymentNotification = await createCustomerNotification({
                    title: "Payment Processed",
                    message: `Your payment has been processed successfully.`,
                    ids: {
                        adminId: msg.payload.adminId,
                        customerId: msg.payload.customerId,
                    },
                    type: "payment",
                });

                if (paymentNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.ids.adminId,
                            customerId: msg.payload.ids.customerId,
                        },
                        data: {
                            title: "Payment Processed",
                            message: "Your payment has been processed successfully",
                            type: "payment",
                            channelKey: "payment_channel",
                        },
                    });
                    console.log("✅ Customer payment FCM sent", { fcmResult, target, customerId: msg.payload.ids.customerId });
                }
                break;

            default:
                const fallbackNotification = await createCustomerNotification({
                    title: msg.payload.title || "Notification",
                    message: msg.payload.message || "You have a new notification.",
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        customerId: msg.payload.ids.customerId,
                    },
                    type: msg.type || "general",
                });

                if (fallbackNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, msg.payload);
                    console.log(`✅ Fallback FCM sent for type=${msg.type}`, { fcmResult, target });
                }
        }
    } catch (error) {
        console.log("❌ Customer notification error", { error, msg, target });
    }
};

// Vendor Notification Handler
export const handleVendorNotification = async (msg: any, target: string) => {
    try {
        if (!msg.fcmToken || !msg.payload) {
            // console.log("❌ Missing required FCM fields for vendor", { target });
            return;
        }

        console.log("✅ Vendor FCM Message received", { msg: msg.type, target });

        switch (msg.type) {
            case "new-booking":
                const bookingNotification = await createVendorNotification({
                    title: "New Booking Received",
                    message: `You have received a new booking request.`,
                    ids: {
                        adminId: msg.payload.adminId,
                        vendorId: msg.payload.vendorId,
                    },
                    type: "booking",
                });

                if (bookingNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.ids.adminId,
                            vendorId: msg.payload.ids.vendorId,
                            bookingId: msg.payload.ids.bookingId,
                        },
                        data: {
                            title: "New Booking Received",
                            message: "You have received a new booking request",
                            type: "new-booking",
                            channelKey: "booking_channel",
                        },
                    });
                    console.log("✅ Vendor booking FCM sent", { fcmResult, target, vendorId: msg.payload.ids.vendorId });
                }
                break;

            case "payment":
                const paymentNotification = await createVendorNotification({
                    title: "Payment Received",
                    message: `You have received a payment for your service.`,
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        vendorId: msg.payload.ids.vendorId,
                    },
                    type: "payment",
                });

                if (paymentNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.ids.adminId,
                            vendorId: msg.payload.ids.vendorId,
                        },
                        data: {
                            title: "Payment Received",
                            message: "You have received a payment for your service",
                            type: "payment",
                            channelKey: "payment_channel",
                        },
                    });
                    console.log("✅ Vendor payment FCM sent", { fcmResult, target, customerId: msg.payload.ids.customerId });
                }
                break;

            case "custom":
                const customNotification = await createVendorNotification({
                    imageUrl: msg.payload.imageUrl,
                    title: msg.payload.title || "Notification",
                    message: msg.payload.message || "You have a new notification.",
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        vendorId: msg.payload.ids.vendorId,
                        templateId: msg.payload.ids.templateId,
                    },
                    type: "custom",
                });

                if (customNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.ids.adminId,
                            vendorId: msg.payload.ids.vendorId,
                            templateId: msg.payload.ids.templateId,
                        },
                        data: {
                            imageUrl: msg.payload.imageUrl || "",
                            title: msg.payload.title || "Notification",
                            message: msg.payload.message || "You have a new notification.",
                            type: "custom",
                            channelKey: "others_channel", // corrected from other_channel for consistency if needed, but existing was other_channel. keeping it consistent with others might be better, let's use others_channel like driver/customer? The existing code used "other_channel" (singular). I'll stick to what was there or what seems standard. Driver used "others_channel". Customer (my fix) uses "others_channel". I will change this to "others_channel" for consistency.
                        },
                    });
                    console.log("✅ Vendor custom FCM sent", { fcmResult, target, vendorId: msg.payload.ids.vendorId });
                }
                break;


            case "commission":
                const commissionNotification = await createVendorNotification({
                    title: "Commission Update",
                    message: `Your commission has been updated.`,
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        vendorId: msg.payload.ids.vendorId,
                    },
                    type: "commission",
                });

                if (commissionNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, {
                        ids: {
                            adminId: msg.payload.ids.adminId,
                            vendorId: msg.payload.ids.vendorId,
                        },
                        data: {
                            title: "Commission Update",
                            message: "Your commission has been updated",
                            type: "commission",
                            channelKey: "commission_channel",
                        },
                    });
                    console.log("✅ Vendor commission FCM sent", { fcmResult, target, vendorId: msg.payload.ids.vendorId });
                }
                break;

            default:
                const fallbackNotification = await createVendorNotification({
                    title: msg.payload.ids.title || "Notification",
                    message: msg.payload.ids.message || "You have a new notification.",
                    ids: {
                        adminId: msg.payload.ids.adminId,
                        vendorId: msg.payload.ids.vendorId,
                    },
                    type: msg.type || "general",
                });

                if (fallbackNotification) {
                    const fcmResult = await sendToSingleToken(msg.fcmToken, msg.payload);
                    console.log(`✅ Fallback FCM sent for type=${msg.type}`, { fcmResult, target, vendorId: msg.payload.ids.vendorId });
                }
        }
    } catch (error) {
        console.log("❌ Vendor notification error", { error, msg, target });
    }
};


export const handleWhatsappNotification = async (msg: any) => {
    try {
        if (!msg.phone || !msg.variables || !msg.templateName) {
            console.log("❌ Missing", { msg });
            return;
        }

        console.log("✅ Template Message received", { msg: msg.templateName });
        sendWhatsAppMessage(msg.templateName, msg.phone, msg.variables);

        // Implement Whatsapp sending logic here
    } catch (error) {
        console.log("❌ Driver notification error", { error, msg });
    }
};