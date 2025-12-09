import {
    Booking, CompanyProfile, Customer, Driver,
    DriverBookingLog, DriverWallet, Service, Vehicle,
    VehicleTypes
} from "../../../core/models";
import { Response, Request } from "express";
import { driverAcceptedSchema } from "../../../../common/validations/bookingSchema";
import { sendWhatsAppMessage } from "../../../../common/services/whatsApp/wachat";
import { createCustomerNotification, createNotification } from "../../../core/function/notificationCreate";
import { driverAssigned } from "../../../../common/services/mail/mail";
import dayjs from "../../../../utils/dayjs";
import { sendToSingleToken } from "../../../../common/services/firebase/appNotify";
import { infoLogger as info, debugLogger as debug } from "../../../../utils/logger";
import { sendNotification } from "../../../../common/services/socket/websocket";
import { Op } from "sequelize";
import SMSService from "../../../../common/services/sms/sms";
import { publishNotification } from "../../../../common/services/rabbitmq/publisher";
import { toLocalTime } from "../../../core/function/dataFn";
import { maskBookingPhones } from "../../../core/function/maskPhoneNumber";

const sms = SMSService()


export const getAllBooking = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    console.log("adminId >> ", adminId);
    console.log("driverId >> ", driverId);

    try {

        if (!driverId) {
            res.status(401).json({
                success: false,
                message: "Driver id is required",
            });
            return;
        }

        let bookings: Booking[] | any;

        const allBookings = await Booking.findAll({
            where: {
                driverId: null,
                adminId,
                assignAllDriver: true,
                status: "Booking Confirmed",
                driverAccepted: "pending"
            },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });
        // console.log("allBookings >> ", allBookings);

        const individualBookings = await Booking.findAll({
            where: {
                driverId: driverId, adminId, [Op.or]: [
                    { status: "Booking Confirmed" },
                    { driverAccepted: "pending" }
                ]
            },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });
        // console.log("individualBookings >> ", individualBookings);

        if (allBookings.length > 0 && individualBookings.length > 0) {
            bookings = [...allBookings, ...individualBookings];
        } else if (allBookings.length > 0) {
            bookings = allBookings;
        } else if (individualBookings.length > 0) {
            bookings = individualBookings;
        } else {
            bookings = [];
        }
        bookings.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const maskedBookings = maskBookingPhones(bookings);

        res.status(200).json({
            success: true,
            message: "Booking fetched successfully",
            data: maskedBookings,
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}



export const getSingleBooking = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { id } = req.params;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        const booking = await Booking.findOne({
            where: { bookingId: id, adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }

        const vehicle = await Vehicle.findOne({
            where: { vehicleId: booking?.vehicleId, adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });

        console.log("driverId", driverId, "booking.driverId", booking.driverId, "booking.status", booking.status, (booking.driverId && booking.driverId !== driverId) || (!booking.driverId && booking.status === "Not-Started"));
        if ((booking.driverId && booking.driverId !== driverId) || (!booking.driverId && booking.status === "Not-Started")) {
            res.status(404).json({
                success: false,
                message: "Booking is not assigned to you",
            });
            return;
        }


        let vendorCommission: any = {};
        let commissionDetails: any = {};

        if (booking.status === "Completed") {

            if (booking.createdBy === "Vendor") {
                vendorCommission = {
                    ...booking.normalFare
                }
            }
            commissionDetails = {
                pricePerKm: booking.pricePerKm,
                kmPrice: booking.driverCommissionBreakup.commissionAmount,
                extraPerKm: booking.extraPricePerKm,
                extraPerKmCharge: booking.driverCommissionBreakup.extraPerKmCharge,
                extraDriverBeta: booking.driverCommissionBreakup.extraDriverBeta,
                extraHill: booking.driverCommissionBreakup.extraHill,
                extraPermitCharge: booking.driverCommissionBreakup.extraPermitCharge,
                extraToll: booking.driverCommissionBreakup.extraToll,
                totalCommissionCharge: booking.driverDeductionAmount
            }
        }

        const jsonBooking: any = booking.toJSON();
        jsonBooking.vehicles = vehicle ? { ...vehicle } : null;

        const data = {
            ...jsonBooking,
            vendorCommission,
            commissionDetails,
        };

        res.status(200).json({
            success: true,
            message: "Booking fetched successfully",
            data: [data],
        });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};


export const specificBooking = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const status = req.query.status ?? req.body.status;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {

        console.log("status >> ", status);

        let bookings: Booking[] | any;
        switch (status.toLowerCase().trim()) {
            case "booking-confirmed":
                bookings = await Booking.findAll({
                    where: {
                        driverId: driverId,
                        adminId,
                        status: "Booking Confirmed",

                        driverAccepted: "pending"
                    },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                });
                res.status(200).json({
                    success: true,
                    message: "Confirmed bookings fetched successfully",
                    data: bookings,
                });
                break;
            case "not-started":
                bookings = await Booking.findAll({
                    where: { driverId: driverId, adminId, status: "Not-Started", driverAccepted: "accepted" },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                });
                res.status(200).json({
                    success: true,
                    message: "Not Started Booking fetched successfully",
                    data: bookings,
                });
                break;
            case "started":
                bookings = await Booking.findAll({
                    where: { driverId: driverId, adminId, status: "Started", driverAccepted: "accepted" },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                });
                res.status(200).json({
                    success: true,
                    message: "Started Booking fetched successfully",
                    data: bookings,
                });
                break;
            case "completed":
                bookings = await Booking.findAll({
                    where: { driverId: driverId, adminId, status: "Completed", driverAccepted: "accepted" },
                    attributes: {
                        exclude: [
                            'id', 'updatedAt', 'deletedAt'
                        ]
                    },
                    order: [['updatedAt', 'DESC']]
                });

                res.status(200).json({
                    success: true,
                    message: "Completed Booking fetched successfully",
                    data: bookings,
                });
                break;
            case "cancelled":

                const driverBookingLog = await DriverBookingLog.findAll({
                    where: { driverId: driverId, adminId, tripStatus: "Cancelled" },
                });

                const bookingIds = driverBookingLog.map((log: any) => log.bookingId);

                bookings = await Booking.findAll({
                    where: {
                        driverId: driverId,
                        adminId,
                        status: "Cancelled",
                        driverAccepted: "accepted",
                    },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                });


                const driverBookingLogBookings = await Booking.findAll({
                    where: { bookingId: { [Op.in]: bookingIds } },
                });

                //old code :
                // const finalBookings = [...bookings, ...driverBookingLogBookings];

                //new code :
                /* now no driver cancelled booking so remove the driverBookingLogBookings like driver cancelled bookings */
                const finalBookings = [...bookings];

                res.status(200).json({
                    success: true,
                    message: "Cancelled Booking fetched successfully",
                    data: finalBookings,
                });
                break;
            default:
                bookings = await Booking.findAll({
                    where: { driverId: driverId, adminId, status: "Not-Started", driverAccepted: "accepted" },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                });

                res.status(200).json({
                    success: true,
                    message: "Booking fetched successfully",
                    data: bookings,
                });
                break;
        }
    } catch (error) {
        console.error("Error fetching specific bookings:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
        return;
    }
}


export const specificBookingCount = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        const counts: Record<string, number> = {};

        // booking-confirmed
        counts["new-bookings"] = await Booking.count({
            where: {
                adminId,
                [Op.or]: [
                    // all bookings (assignAllDriver true and no driver assigned)
                    {
                        driverId: null,
                        assignAllDriver: true,
                        status: "Booking Confirmed",
                        driverAccepted: "pending"
                    },
                    // individual bookings (specific driver assigned)
                    {
                        driverId: driverId,
                        status: "Booking Confirmed",
                        driverAccepted: "pending"
                    }
                ]
            }
        });


        // not-started
        counts["not-started"] = await Booking.count({
            where: {
                driverId,
                adminId,
                status: "Not-Started",
                driverAccepted: "accepted"
            }
        });

        // started
        counts["started"] = await Booking.count({
            where: {
                driverId,
                adminId,
                status: "Started",
                driverAccepted: "accepted"
            }
        });

        // completed
        counts["completed"] = await Booking.count({
            where: {
                driverId,
                adminId,
                status: "Completed",
                driverAccepted: "accepted"
            }
        });


        counts["cancelled"] = await Booking.count({
            where: {
                driverId,
                adminId,
                status: "Cancelled",
                // driverAccepted: "accepted"
            }
        });

        res.status(200).json({
            success: true,
            message: "Booking counts fetched successfully",
            data: counts,
        });

    } catch (error) {
        console.error("Error fetching specific booking counts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

/**
 * @api {post} /driver/booking/accept-or-reject/:id Accept or Reject a booking
 * @apiName AcceptOrRejectBooking
 * @apiGroup Booking
 * @apiParam {String} driverId Driver ID
 * @apiParam {String} id Booking ID
 * @apiParam {String} action 'accept' or 'reject'
 * @apiSuccess {Boolean} success Success status
 * @apiSuccess {String} message Success message
 * @apiSuccess {Object} data Booking object
 * @apiError {Boolean} success Success status
 * @apiError {String} message Error message
 * @apiErrorExample {json} Error response
 *    HTTP/1.1 400 Bad Request
 *    {
 *      "success": false,
 *      "message": "Driver ID is required"
 *    }
 */


export const acceptOrRejectBooking = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { id } = req.params; // bookingId
    const acceptTime = dayjs().toDate();

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver ID is required",
        });
        return;
    }

    // Action is optional - default to "accept" if not provided or not "reject"
    const { action } = req.body;
    const finalAction = action === "reject" ? "reject" : "accept";

    try {
        // const validData = driverAcceptedSchema.safeParse(req.body); // Validate action using Zod schema
        // if (!validData.success) {
        //     const formattedErrors = validData.error.errors.map((err) => ({
        //         field: err.path.join("."),
        //         message: err.message,
        //     }));

        //     res.status(400).json({
        //         success: false,
        //         message: "Validation error",
        //         errors: formattedErrors,
        //     });
        //     return;
        // }

        // const { action } = validData.data;
        // const { action } = req.body;

        console.log("Action", finalAction);

        // ***** CRITICAL SECTION: Start transaction early to prevent race conditions *****
        const sequelizeInstance = Booking.sequelize;

        if (!sequelizeInstance) {
            throw new Error("Sequelize instance not available on Booking model");
        }

        let booking: any;
        let driver: any;
        let vehicle: any;
        let activityLog: any;
        let tripCommissionAmount = 0;
        let isCustomerAvailable = false;

        try {
            await sequelizeInstance.transaction(async (transaction) => {
                // Lock the booking row FIRST so only one driver can process it at a time
                const lockedBooking = await Booking.findOne({
                    where: {
                        bookingId: id,
                        adminId,
                    },
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });

                if (!lockedBooking) {
                    throw new Error("BOOKING_NOT_FOUND");
                }

                // Check booking status while locked
                if (lockedBooking.driverAccepted !== "pending") {
                    throw new Error("ALREADY_PROCESSED");
                }

                if (lockedBooking.status !== "Booking Confirmed") {
                    if (lockedBooking.status === "Cancelled") {
                        throw new Error("BOOKING_CANCELLED");
                    }
                    throw new Error("INVALID_BOOKING_STATUS");
                }

                // Lock the driver row FIRST without include (PostgreSQL doesn't allow FOR UPDATE with LEFT JOIN)
                const lockedDriver = await Driver.findOne({
                    where: { driverId: driverId },
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });

                if (!lockedDriver) {
                    throw new Error("DRIVER_NOT_FOUND");
                }

                // Check if driver is already assigned (while locked)
                if (lockedDriver.assigned) {
                    throw new Error("DRIVER_ALREADY_ASSIGNED");
                }

                // Get vehicle (no need to lock, just check)
                const foundVehicle = await Vehicle.findOne({
                    where: { driverId: driverId, isActive: true },
                    transaction,
                });

                if (!foundVehicle) {
                    throw new Error("VEHICLE_NOT_FOUND");
                }

                // Get service for commission calculation
                const service = await Service.findOne({
                    where: {
                        adminId,
                        serviceId: lockedBooking.serviceId,
                    },
                    transaction,
                });

                // Calculate trip commission amount
                tripCommissionAmount = (lockedBooking.estimatedAmount * 10) / 100;

                if (service) {
                    const driverCommissionRate = service.driverCommission;
                    let gst = lockedBooking.taxAmount || 0;
                    let convenienceFee = lockedBooking.convenienceFee || 0;
                    let extraChargeCommission = 0;
                    let commissionAmount = Math.ceil(
                        (lockedBooking.estimatedAmount * driverCommissionRate) / 100
                    );
                    if (lockedBooking.createdBy === "Vendor") {
                        extraChargeCommission =
                            lockedBooking.extraHill +
                            lockedBooking.extraDriverBeta +
                            lockedBooking.extraPermitCharge +
                            lockedBooking.extraPricePerKm * lockedBooking.distance || 0;
                    }
                    tripCommissionAmount =
                        commissionAmount + gst + convenienceFee + extraChargeCommission;
                }

                // Handle reject action - skip balance check and acceptance logic
                if (finalAction === "reject") {
                    lockedBooking.driverAccepted = "rejected";
                    await lockedBooking.save({ transaction });
                    booking = lockedBooking;
                    return;
                }

                // action === "accept" - Process acceptance
                // Get driver wallet separately (after locking driver) to check balance
                const driverWallet = await DriverWallet.findOne({
                    where: { driverId: driverId },
                    transaction,
                });

                // Check driver balance (while locked)
                const driverBalance = driverWallet?.balance ?? 0;

                if (driverBalance < tripCommissionAmount) {
                    debug.info(
                        `Driver balance >> ${driverBalance}, definedWalletAmount >> ${tripCommissionAmount}`
                    );
                    throw new Error("INSUFFICIENT_BALANCE");
                }
                // Double-check booking is still available (defensive check)
                if (lockedBooking.driverAccepted !== "pending" || lockedBooking.status !== "Booking Confirmed") {
                    throw new Error("ALREADY_PROCESSED");
                }

                // Update booking
                lockedBooking.driverId = driverId;
                lockedBooking.driverAccepted = "accepted";
                lockedBooking.acceptTime = acceptTime;
                lockedBooking.status = "Not-Started";
                lockedBooking.vehicleId = foundVehicle.vehicleId;

                // Update driver
                lockedDriver.assigned = true;
                lockedDriver.vehicleId = foundVehicle.vehicleId;

                // Get or create activity log (inside transaction)
                let existingLog = await DriverBookingLog.findOne({
                    where: {
                        bookingId: id,
                        adminId,
                        driverId: driverId,
                    },
                    transaction,
                    attributes: ["id", "acceptTime", "tripStatus"],
                });

                if (!existingLog) {
                    existingLog = await DriverBookingLog.create({
                        adminId,
                        driverId,
                        bookingId: id,
                        acceptTime,
                        tripStatus: "Driver Accepted",
                    }, { transaction });
                } else {
                    existingLog.acceptTime = acceptTime;
                    existingLog.tripStatus = "Driver Accepted";
                }

                // Save all changes atomically
                await lockedBooking.save({ transaction });
                await lockedDriver.save({ transaction });
                await existingLog.save({ transaction });

                // Load wallet relationship for use outside transaction
                await lockedDriver.reload({
                    include: [{ model: DriverWallet, as: "wallet" }],
                    transaction,
                });

                // Store references for use outside transaction
                booking = lockedBooking;
                driver = lockedDriver;
                vehicle = foundVehicle;
                activityLog = existingLog;
            });
        } catch (err: any) {
            const errorMessage = err?.message;

            if (errorMessage === "ALREADY_PROCESSED") {
                res.status(400).json({
                    success: false,
                    message: "Booking was already processed by another driver",
                });
                return;
            }

            if (errorMessage === "BOOKING_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Booking not found",
                });
                return;
            }

            if (errorMessage === "BOOKING_CANCELLED") {
                res.status(400).json({
                    success: false,
                    message: "Booking was already cancelled kindly refresh page",
                });
                return;
            }

            if (errorMessage === "INVALID_BOOKING_STATUS") {
                res.status(400).json({
                    success: false,
                    message: "Booking is not in a valid state to be accepted",
                });
                return;
            }

            if (errorMessage === "DRIVER_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Driver not found",
                });
                return;
            }

            if (errorMessage === "DRIVER_ALREADY_ASSIGNED") {
                res.status(400).json({
                    success: false,
                    message: "Driver is already assigned to another booking",
                });
                return;
            }

            if (errorMessage === "VEHICLE_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Vehicle not found or not active",
                });
                return;
            }

            if (errorMessage === "INSUFFICIENT_BALANCE") {
                res.status(400).json({
                    success: false,
                    message: `You don't have enough balance to accept this booking. The trip charge is ${tripCommissionAmount}. Please recharge your wallet and try again.`,
                    recharge: true,
                });
                return;
            }

            // Unexpected error inside transaction
            console.error("Transaction error while processing booking:", err);
            res.status(500).json({
                success: false,
                message: "Failed to process booking due to concurrency issue",
                error: process.env.NODE_ENV === "development" ? err.message : undefined,
            });
            return;
        }

        // ***** NON-CRITICAL: Notifications, metrics, cleanup, etc *****

        // Handle reject action - return early
        if (finalAction === "reject") {
            res.status(200).json({
                success: true,
                message: "Booking rejected successfully",
                data: booking,
            });
            return;
        }

        // action === "accept" - Continue with acceptance logic
        if (!booking || !driver || !vehicle || !activityLog) {
            res.status(500).json({
                success: false,
                message: "Failed to process booking acceptance",
            });
            return;
        }

        const requestTime = dayjs(booking.requestSentTime);
        const acceptTimeObj = dayjs(acceptTime);

        const diffInSeconds = acceptTimeObj.diff(requestTime, "second", true);

        let formattedAcceptTime;

        if (diffInSeconds >= 60) {
            formattedAcceptTime = `${Math.floor(diffInSeconds / 60)} min`;
        } else {
            formattedAcceptTime = `${diffInSeconds.toFixed(2)} sec`;
        }

        console.log("Driver Accept Time:", formattedAcceptTime);

        // Update activity log with avgAcceptTime (non-critical, can fail without affecting booking)
        try {
            activityLog.avgAcceptTime = diffInSeconds;
            await activityLog.save();
        } catch (err: any) {
            console.error("Failed to update activity log avgAcceptTime:", err);
            // Don't fail the request if this update fails
        }

        const customer = await Customer.findOne({
            where: {
                customerId: booking.customerId,
            },
        });

        const customerCleanedPhone = booking.phone.replace(/^\+?91|\D/g, "");
        const driverCleanedPhone = driver.phone.replace(/^\+?91|\D/g, "");

        if (customer) {
            let customerName = customer ? customer.name : "Customer";

            const customerNotification = await createCustomerNotification({
                title: "Driver has been assigned to your booking!",
                message: `Hi ${customerName}, Driver ${driver.name} has been assigned to your ride. They will contact you shortly and are on their way.`,
                ids: {
                    adminId: booking.adminId,
                    bookingId: booking.bookingId,
                    customerId: booking.customerId,
                },
                type: "booking",
            });

            try {
                if (customerNotification) {
                    const tokenResponse = await sendToSingleToken(
                        customer.fcmToken,
                        {
                            // title: 'New Booking Arrived',
                            // message: `Mr ${driver.name} You have received a new booking`,
                            ids: {
                                adminId: booking.adminId,
                                bookingId: booking.bookingId,
                                customerId: booking.customerId,
                            },
                            data: {
                                title: "Driver has been assigned to your booking!",
                                message: `Hi ${customerName}, Driver ${driver.name} has been assigned to your ride. They will contact you shortly and are on their way.`,
                                type: "customer-driver-assigned",
                                channelKey: "customer_info",
                            },
                        }
                    );
                    debug.info(
                        `FCM Notification Response: ${tokenResponse}`
                    );
                } else {
                    debug.info(
                        "driver assigned notification to customer is false"
                    );
                }
            } catch (err: any) {
                debug.info(
                    `FCM Notification Error - driver assigned notification to customer: ${err}`
                );
            }

            isCustomerAvailable = true;
        }

        // Send notification to admin panel and vendor panel
        const time = new Intl.DateTimeFormat("en-IN", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            timeZone: "Asia/Kolkata",
        }).format(new Date());
        const notification = {
            adminId,
            vendorId:
                booking.createdBy === "Vendor" ? booking.vendorId : null,
            title: `Driver Accepted Booking – Trip #${booking.bookingId}`,
            description: `Driver has accepted the booking for Trip #${booking.bookingId}.`,
            type: "booking",
            read: false,
            date: new Date(),
            time: time,
        };

        const adminNotification = {
            adminId,
            vendorId: null,
            title: `Driver Accepted Booking – Trip #${booking.bookingId}`,
            description: `Driver ${driver.name} has accepted the booking for Trip #${booking.bookingId}.`,
            type: "booking",
            read: false,
            date: new Date(),
            time: time,
        };

        const adminNotificationResponse =
            await createNotification(adminNotification as any);

        if (booking.createdBy === "Vendor") {
            const notificationResponse =
                await createNotification(notification as any);
            if (notificationResponse.success) {
                sendNotification(booking.vendorId, {
                    notificationId:
                        notificationResponse.notificationId ?? undefined,
                    title: `Driver Accepted Booking – Trip #${booking.bookingId}`,
                    description: `Driver has accepted the booking for Trip #${booking.bookingId}.`,
                    type: "booking",
                    read: false,
                    date: new Date(),
                    time: time,
                });
            }
        }

        if (adminNotificationResponse.success) {
            sendNotification(adminId, {
                notificationId:
                    adminNotificationResponse.notificationId ?? undefined,
                title: `Driver Accepted Booking – Trip #${booking.bookingId}`,
                description: `Driver has accepted the booking for Trip #${booking.bookingId}.`,
                type: "booking",
                read: false,
                date: new Date(),
                time: time,
            });
        }

        // Send email to customer
        /* try {
                const emailData = {
                    bookingId: booking.bookingId,
                    name: booking.name,
                    email: booking.email,
                    pickup: booking.pickup,
                    drop: booking.drop ?? null,
                    pickupDate: new Date(
                        booking.pickupDateTime
                    ).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }),
                    pickupTime: new Date(
                        booking.pickupDateTime
                    ).toLocaleString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    dropDate: booking.dropDate
                        ? new Date(booking.dropDate).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })
                        : null,
                    driverName: driver.name,
                    driverPhone: driver.phone,
                };

                // console.log("emailData ---> ", emailData);
                const emailResponse = await driverAssigned(emailData);
                // console.log("emailResponse ---> ", emailResponse);
                if (emailResponse.status === 200) {
                    console.log(
                        `Email sent successfully to ${emailResponse.sentTo}`
                    );
                } else {
                    console.log("Email not sent");
                }
            } catch (error) {
                console.error("Error sending email:", error);
            }

        /* SMS Send
        try {
            const cleanedPhone = booking.phone.replace(/^\+?91|\D/g, '');
            const companyProfile = await CompanyProfile.findOne({ where: { adminId } });
            const smsResponse = await sms.sendTemplateMessage({
                mobile: Number(cleanedPhone),
                template: "driver_assigned",
                data: {
                    name: booking.name,
                    driverName: driver.name,
                    driverPhone: driver.phone,
                    vehicleNumber: vehicle.vehicleNumber,
                    contactNumber: companyProfile?.phone[0] ?? "9876543210",
                    website: companyProfile?.website ?? "https://silvercalltaxi.in/",
                }
            })
            if (smsResponse) {
                debug.info("Driver assigned SMS sent successfully");
            } else {
                debug.info("Driver assigned SMS not sent");
            }
        } catch (error) {
            debug.info(`Error sending Driver assigned SMS: ${error}`);
         } */


        // whatsapp assigned message
        /*try {
            // send notification to driver
            const waDriverPayload = {
                phone: driverCleanedPhone,
                variables: [
                    { type: "text", text: `${booking.pickup} to ${booking.drop}` },
                    {
                        type: "text", text: new Date(toLocalTime(booking.pickupDateTime)).toLocaleString('en-IN', {
                            timeZone: "Asia/Kolkata",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                        })
                    },
                    { type: "text", text: customerCleanedPhone },
                ],
                templateName: "driverTripAccepted"
            }

            publishNotification("notification.whatsapp", waDriverPayload)
                .catch((err) => console.log("❌ Failed to publish Whatsapp notification", waDriverPayload.templateName, err));


            // send notification to customer
            const waCustomerPayload = {
                phone: customerCleanedPhone,
                variables: [
                    { type: "text", text: driver.name },
                    { type: "text", text: driverCleanedPhone },
                    { type: "text", text: vehicle.vehicleNumber },
                    { type: "text", text: booking.adminContact ?? "9876543210" },
                ],
                templateName: "driverDetails"
            }

            publishNotification("notification.whatsapp", waCustomerPayload)
                .catch((err) => console.log("❌ Failed to publish Whatsapp notification", waCustomerPayload.templateName, err));
        } catch (error) {
            console.error("Error sending whatsapp driver assigned:", error);
        } */

        // Cleanup other drivers' logs in the background ONLY when accepted
        // This ensures only the accepted driver's log remains
        if (finalAction === "accept") {
            DriverBookingLog.destroy({
                where: {
                    bookingId: id,
                    adminId,
                    driverId: { [Op.ne]: driverId },
                },
                force: true,
            }).catch((err: any) => {
                console.error(
                    `Failed to cleanup other drivers for booking ${id}:`,
                    err.message
                );
            });
        }

        res.status(200).json({
            success: true,
            message: isCustomerAvailable
                ? `Booking ${finalAction}ed successfully`
                : `Booking ${finalAction}ed successfully, customer data not found for this booking so notification may not be delivered to customer`,
            data: booking,
        });
        return;
    } catch (error) {
        console.error("Error accepting or rejecting booking:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
};



