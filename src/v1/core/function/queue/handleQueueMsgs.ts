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
            console.log("❌ Missing required FCM fields for driver", { msg, target });
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
                            title: msg.payload.data.title,
                            message: msg.payload.data.message,
                            type: msg.payload.data.type,
                            channelKey: msg.payload.data.channelKey,
                        },
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
                            title: msg.payload.data.title,
                            message: msg.payload.data.message,
                            type: msg.payload.data.type,
                            channelKey: msg.payload.data.channelKey,
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
                            imageUrl: msg.payload.imageUrl,
                            title: msg.payload.title,
                            message: msg.payload.message,
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

// Customer Notification Handler
export const handleCustomerNotification = async (msg: any, target: string) => {
    try {
        if (!msg.fcmToken || !msg.payload) {
            console.log("❌ Missing required FCM fields for customer", { msg, target });
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
                            imageUrl: msg.payload.imageUrl,
                            title: msg.payload.title,
                            message: msg.payload.message,
                            type: "custom-notification",
                            channelKey: "others_channel",
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
            console.log("❌ Missing required FCM fields for vendor", { msg, target });
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
                            imageUrl: msg.payload.imageUrl,
                            title: msg.payload.title || "Notification",
                            message: msg.payload.message || "You have a new notification.",
                            type: "custom",
                            channelKey: "other_channel",
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

// Batch Driver Notification Handler
export const handleBatchDriverNotification = async (msg: any, target: string) => {
    try {
        if (!msg.fcmTokens || !Array.isArray(msg.fcmTokens) || msg.fcmTokens.length === 0) {
            console.log("❌ Missing required FCM tokens for batch driver notification", { msg, target });
            return;
        }

        if (!msg.payload) {
            console.log("❌ Missing required payload for batch driver notification", { msg, target });
            return;
        }

        console.log(`✅ Batch Driver FCM Message received: ${msg.fcmTokens.length} tokens`, { target });

        // Create notifications for each driver if driver data is provided
        if (msg.driverData && Array.isArray(msg.driverData)) {
            for (const driver of msg.driverData) {
                if (driver.driverId && driver.adminId) {
                    await createDriverNotification({
                        title: msg.payload.title || "New Booking Arrived",
                        message: msg.payload.message || `Mr ${driver.name || 'Driver'}, you have received a new booking.`,
                        ids: {
                            adminId: driver.adminId,
                            driverId: driver.driverId,
                        },
                        type: msg.payload.type || "booking",
                    });

                    // Log activity if bookingId is provided
                    if (msg.payload.ids?.bookingId && driver.driverId && driver.adminId) {
                        await DriverBookingLog.upsert({
                            adminId: driver.adminId,
                            driverId: driver.driverId,
                            bookingId: msg.payload.ids.bookingId,
                            requestSendTime: msg.requestSentTime || dayjs().toDate(),
                        }).catch((err) => console.error(`⚠️ Failed to log for ${driver.driverId}:`, err));
                    }
                }
            }
        }

        // Batch send FCM notifications
        const batchResult = await sendBatchNotifications(msg.fcmTokens, {
            title: msg.payload.title,
            message: msg.payload.message,
            ids: msg.payload.ids || {},
            data: msg.payload.data || {},
            image: msg.payload.image,
        });

        console.log(`✅ Batch Driver FCM sent: ${batchResult.successCount} success, ${batchResult.failureCount} failed`, {
            target,
            invalidTokens: batchResult.invalidTokens?.length || 0,
        });

        if (batchResult.invalidTokens && batchResult.invalidTokens.length > 0) {
            console.log(`⚠️ Invalid tokens detected: ${batchResult.invalidTokens.length}`);
        }
    } catch (error) {
        console.log("❌ Batch driver notification error", { error, msg, target });
    }
};