// utils/priceUpdateTask.ts
import { sendNotification } from "../../../common/services/socket/websocket";
import dayjs from "../../../utils/dayjs";
import { AllPriceChanges, Booking, Driver, Tariff, Vehicle } from "../models" // Adjust path as needed
import { Op } from 'sequelize';
import { createNotification } from "./notificationCreate";
import { infoLogger as log, debugLogger as debug } from "../../../utils/logger";
import { sendToSingleToken } from "../../../common/services/firebase/appNotify";
import { getDriverFcmToken } from "../../../utils/redis.configs";

export const handlePriceUpdate = async () => {
    const now = new Date();

    log.info("⏰ Running Price Update Check...");
    try {

        // 1. Apply price if fromDate is reached and not applied yet
        const toApply = await AllPriceChanges.findAll({
            where: {
                fromDate: { [Op.lte]: now },
            },
        });

        for (const change of toApply) {
            const tariffs = await Tariff.findAll({ where: { serviceId: change.serviceId } });

            for (const tariff of tariffs) {
                await tariff.update({ increasedPrice: change.price });
            }

            await change.update({
                applied: true
            });
        }

        // 2. Revert price if toDate passed and already applied
        const toRevert = await AllPriceChanges.findAll({
            where: {
                toDate: { [Op.lte]: now },
                applied: true,
            },
        });

        for (const change of toRevert) {
            const tariffs = await Tariff.findAll({ where: { serviceId: change.serviceId } });

            for (const tariff of tariffs) {
                await tariff.update({ increasedPrice: 0 });
            }
            await change.update({
                status: false,
                applied: false
            });
            await change.save();
            await change.destroy({ force: true });
        }
    } catch (error) {
        debug.error(`Error in handlePriceUpdate: ${JSON.stringify(error, null, 2)}`);
    }
};


export const notifyPendingDriverAcceptance = async () => {

    const now = dayjs();
    log.info("⏰ Running Driver Acceptance Check...");
    try {
        const bookings = await Booking.findAll({
            where: {
                driverId: { [Op.not]: null },
                driverAccepted: "pending",
                requestSentTime: {
                    [Op.lte]: now.subtract(10, "minute").toDate(),
                },
                [Op.or]: [
                    { lastAdminNotifyTime: null },
                    { lastAdminNotifyTime: { [Op.lte]: now.subtract(10, "minute").toDate() } }
                ]
            } as any,
        });


        const assignAllDriverBookings = await Booking.findAll({
            where: {
                assignAllDriver: true,
                driverAccepted: "pending",
                requestSentTime: {
                    [Op.lte]: now.subtract(10, "minute").toDate(),
                },
                [Op.or]: [
                    { lastAdminNotifyTime: null },
                    { lastAdminNotifyTime: { [Op.lte]: now.subtract(10, "minute").toDate() } }
                ]
            } as any,
        });

        if (assignAllDriverBookings.length > 0) {
            for (const booking of assignAllDriverBookings) {

                const timeStr = new Intl.DateTimeFormat("en-IN", {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                    timeZone: "Asia/Kolkata",
                }).format(new Date());

                const adminNotification = {
                    adminId: booking.adminId,
                    vendorId: null,
                    title: `Driver Still Pending – Bookoking #${booking.bookingId}`,
                    description: `Driver has not accepted Booking since ${dayjs(
                        booking.requestSentTime
                    ).format("hh:mm A")}. From: ${booking.pickup}. To: ${booking.drop ?? 'N/A'}`,
                    type: "booking",
                    read: false,
                    date: new Date(),
                    time: timeStr,
                };

                const adminNotificationResponse = await createNotification(adminNotification as any);
                if (adminNotificationResponse.success) {

                    await booking.update({
                        lastAdminNotifyTime: new Date(),
                    });
                    await booking.save();

                    sendNotification(booking.adminId, {
                        notificationId: adminNotificationResponse.notificationId ?? undefined,
                        title: adminNotification.title,
                        description: adminNotification.description,
                        type: "booking",
                        read: false,
                        date: new Date(),
                        time: timeStr,
                    });
                    log.info(`📢 Sent pending-driver notification for booking ${booking.bookingId}`);
                }
            }
        }

        if (bookings.length > 0) {
            for (const booking of bookings) {
                const timeStr = new Intl.DateTimeFormat("en-IN", {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                    timeZone: "Asia/Kolkata",
                }).format(new Date());

                const adminNotification = {
                    adminId: booking.adminId,
                    vendorId: null,
                    title: `Driver Still Pending – Booking #${booking.bookingId}`,
                    description: `Driver has not accepted Booking since ${dayjs(
                        booking.requestSentTime
                    ).format("hh:mm A")}. From: ${booking.pickup}. To: ${booking.drop ?? 'N/A'}`,
                    type: "booking",
                    read: false,
                    date: new Date(),
                    time: timeStr,
                };

                const adminNotificationResponse = await createNotification(adminNotification as any);
                if (adminNotificationResponse.success) {

                    await booking.update({
                        lastAdminNotifyTime: new Date(),
                    });
                    await booking.save();

                    sendNotification(booking.adminId, {
                        notificationId: adminNotificationResponse.notificationId ?? undefined,
                        title: adminNotification.title,
                        description: adminNotification.description,
                        type: "booking",
                        read: false,
                        date: new Date(),
                        time: timeStr,
                    });
                    log.info(`📢 Sent pending-driver notification for booking ${booking.bookingId}`);
                }
            }
        }
        log.info("⏰ Driver Acceptance Check Completed...");
        return;
    } catch (error) {
        debug.error(`Error in notifyPendingDriverAcceptance: ${JSON.stringify(error, null, 2)}`);
    }
}


export const notifyLateTripPickups = async () => {
    const now = dayjs();
    log.info("⏰ Running Late Trip Pickup Check...");       
    try {
        // Find bookings where pickup time is in the past and status is not "started"
        const bookings = await Booking.findAll({
            where: {
                status: { [Op.not]: "Started" },
                startOtp: { [Op.not]: null },
                driverId: { [Op.not]: null },
                pickupDateTime: {
                    [Op.lte]: now.toDate()
                }
            } as any,
        });

        for (const booking of bookings) {
            const pickupTime = dayjs(booking.pickupDateTime);
            const diffMinutes = now.diff(pickupTime, "minute");

            // Only notify every 30 mins (30, 60, 90...)
            if (diffMinutes > 0 && diffMinutes % 30 === 0) {
                log.info(`🔔 Booking ${booking.bookingId} is overdue by ${diffMinutes} mins, notifying admin...`);
                const timeStr = new Intl.DateTimeFormat("en-IN", {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                    timeZone: "Asia/Kolkata",
                }).format(new Date());

                const adminNotification = {
                    adminId: booking.adminId,
                    vendorId: null,
                    title: `Late Trip Pickup – Booking #${booking.bookingId}`,
                    description: `Trip pickup for Booking is overdue by ${diffMinutes} minutes. From: ${booking.pickup}. To: ${booking.drop ?? 'N/A'}`,
                    type: "booking",
                    read: false,
                    date: new Date(),
                    time: timeStr,
                };

                const adminNotificationResponse = await createNotification(adminNotification as any);
                if (adminNotificationResponse.success) {

                    await booking.update({
                        lastAdminNotifyTime: new Date(),
                    });
                    await booking.save();

                    sendNotification(booking.adminId, {
                        notificationId: adminNotificationResponse.notificationId ?? undefined,
                        title: adminNotification.title,
                        description: adminNotification.description,
                        type: "booking",
                        read: false,
                        date: new Date(),
                        time: timeStr,
                    });
                    log.info(`📢 Sent late trip pickup notification for booking ${booking.bookingId}`);
                }
            }
        }
        log.info("⏰ Late Trip Pickup Check Completed...");
    } catch (error) {
        debug.error(`Error in notifyLateTripPickups: ${JSON.stringify(error, null, 2)}`);
    }
}

export const checkDocumentExpiry = async () => {
    const now = new Date();
    log.info("⏰ Running Document Expiry Check...");
    
    try {
        // Get all active drivers
        const drivers = await Driver.findAll({
            where: { isActive: true },
            include: [{
                model: Vehicle,
                as: 'vehicle',
                where: { isActive: true },
                required: false
            }]
        });

        let totalNotificationsSent = 0;
        let totalNotificationsFailed = 0;

        for (const driver of drivers) {
            let hasExpiredDocuments = false;
            const expiredDocuments: string[] = [];

            // Check driver license expiry
            if (driver.licenseValidity) {
                const expiry = new Date(driver.licenseValidity);
                if (expiry < now) {
                    hasExpiredDocuments = true;
                    expiredDocuments.push("Driver License");
                }
            }

            // Check vehicle documents expiry
            if ((driver as any).vehicle && (driver as any).vehicle.length > 0) {
                for (const vehicle of (driver as any).vehicle) {
                    const vehicleIdentifier = vehicle.vehicleNumber || vehicle.vehicleId || vehicle.name;
                    
                    // Check RC Book expiry
                    if (vehicle.rcExpiryDate) {
                        const expiry = new Date(vehicle.rcExpiryDate);
                        if (expiry < now) {
                            hasExpiredDocuments = true;
                            expiredDocuments.push(`RC Book (${vehicleIdentifier})`);
                        }
                    }

                    // Check Insurance expiry
                    if (vehicle.insuranceExpiryDate) {
                        const expiry = new Date(vehicle.insuranceExpiryDate);
                        if (expiry < now) {
                            hasExpiredDocuments = true;
                            expiredDocuments.push(`Insurance (${vehicleIdentifier})`);
                        }
                    }

                    // Check Pollution Certificate expiry
                    if (vehicle.pollutionExpiryDate) {
                        const expiry = new Date(vehicle.pollutionExpiryDate);
                        if (expiry < now) {
                            hasExpiredDocuments = true;
                            expiredDocuments.push(`Pollution Certificate (${vehicleIdentifier})`);
                        }
                    }
                }
            }

            // Send FCM notification if any documents are expired
            if (hasExpiredDocuments) {
                const redisFcmToken = driver.adminId
                    ? await getDriverFcmToken(String(driver.adminId), String(driver.driverId))
                    : null;
                const targetFcmToken = redisFcmToken || driver.fcmToken;

                if (targetFcmToken) {
                    try {
                        const notificationTitle = "Document Expiry Alert";
                        const notificationMessage = `Dear ${driver.name}, the following documents have expired: ${expiredDocuments.join(', ')}. Please renew them immediately to continue your services.`;

                        await sendToSingleToken(targetFcmToken, {
                            ids: {
                                driverId: driver.driverId,
                                adminId: driver.adminId,
                            },
                            data: {
                                title: notificationTitle,
                                message: notificationMessage,
                                type: "document-expiry",
                                channelKey: "other_channel",
                            }
                        });

                        log.info(`📱 FCM notification sent to driver ${driver.driverId} for expired documents: ${expiredDocuments.join(', ')}`);
                        totalNotificationsSent++;
                    } catch (fcmError) {
                        debug.error(`FCM notification failed for driver ${driver.driverId}: ${fcmError}`);
                        totalNotificationsFailed++;
                    }
                } else {
                    debug.info(`Driver ${driver.driverId} has expired documents but no FCM token: ${expiredDocuments.join(', ')}`);
                }
            }
        }

        log.info(`⏰ Document Expiry Check Completed. Notifications sent to ${totalNotificationsSent} drivers, failed: ${totalNotificationsFailed} drivers.`);
    } catch (error) {
        debug.error(`Error in checkDocumentExpiry: ${JSON.stringify(error, null, 2)}`);
    }
}

// Test function to manually trigger document expiry check
export const testDocumentExpiry = async () => {
    console.log("🧪 Manual test of document expiry check triggered");
    await checkDocumentExpiry();
};