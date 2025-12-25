import {
    Booking, CompanyProfile, Customer, Driver,
    DriverBookingLog, DriverWallet, Service, Vehicle,
    VehicleTypes
} from "../../../core/models";
import { Response, Request } from "express";
import { driverAcceptedSchema } from "../../../../common/validations/bookingSchema";
import { sendWhatsAppMessage } from "../../../../common/services/whatsApp/wachat";
import { createCustomerNotification, createNotification, createDriverNotification } from "../../../core/function/notificationCreate";
import { driverAssigned } from "../../../../common/services/mail/mail";
import dayjs from "../../../../utils/dayjs";
import { sendToSingleToken } from "../../../../common/services/firebase/appNotify";
import { infoLogger as info, debugLogger as debug } from "../../../../utils/logger";
import { sendNotification, emitTripAcceptedToDriver } from "../../../../common/services/socket/websocket";
import { Op } from "sequelize";
import SMSService from "../../../../common/services/sms/sms";
import { publishNotification } from "../../../../common/services/rabbitmq/publisher";
import { toLocalTime } from "../../../core/function/dataFn";


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
                pickupDateTime: { [Op.gte]: new Date() },
                status: { [Op.or]: ["Booking Confirmed", "Reassign"] },
                driverAccepted: "pending"
            },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });
        // console.log("allBookings >> ", allBookings);

        const individualBookings = await Booking.findAll({
            where: {
                driverId: driverId, adminId, [Op.or]: [
                    { status: "Booking Confirmed" },
                    { status: "Reassign" },
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
        bookings.sort((a: any, b: any) => new Date(b.pickupDateTime).getTime() - new Date(a.pickupDateTime).getTime());

        res.status(200).json({
            success: true,
            message: "Booking fetched successfully",
            data: bookings,
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

        const vehicle = await Vehicle.findOne({
            where: { vehicleId: booking?.vehicleId, adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
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


// specificBooking Endpoint// specificBooking Endpoint
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
            case "booking confirmed":
            case "booking-confirmed":
                bookings = await Booking.findAll({
                    where: {
                        adminId,
                        pickupDateTime: { [Op.gte]: new Date() },
                        [Op.or]: [
                            // individual bookings (specific driver assigned)
                            {
                                driverId: driverId,
                                [Op.or]: [
                                    { status: "Booking Confirmed" },
                                    { status: "Reassign" },
                                    { driverAccepted: "pending" }
                                ]
                            },
                            // all bookings (assignAllDriver true and no driver assigned)
                            {
                                driverId: null,
                                assignAllDriver: true,
                                status: { [Op.or]: ["Booking Confirmed", "Reassign"] },
                                driverAccepted: "pending"
                            }
                        ]
                    },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    order: [['pickupDateTime', 'DESC']]
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
                    where: { driverId, adminId, tripStatus: "Cancelled" },
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

                const finalBookings = [...bookings, ...driverBookingLogBookings];

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
        const newBookingsCount = await Booking.count({
            where: {
                adminId,
                pickupDateTime: { [Op.gte]: new Date() },
                [Op.or]: [
                    // all bookings (assignAllDriver true and no driver assigned)
                    {
                        driverId: null,
                        assignAllDriver: true,
                        status: { [Op.or]: ["Booking Confirmed", "Reassign"] },
                        driverAccepted: "pending"
                    },
                    // individual bookings (specific driver assigned)
                    {
                        driverId: driverId,
                        [Op.or]: [
                            { status: "Booking Confirmed" },
                            { status: "Reassign" },
                            { driverAccepted: "pending" }
                        ]
                    }
                ]
            }
        });
        counts["new-bookings"] = newBookingsCount;


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

    console.log("========================================");
    console.log("[ACCEPT] 🎯 Accept/Reject Booking Request");
    console.log("[ACCEPT] bookingId:", id);
    console.log("[ACCEPT] driverId:", driverId);
    console.log("[ACCEPT] adminId:", adminId);
    console.log("[ACCEPT] action:", req.body.action);
    console.log("========================================");

    if (!driverId) {
        console.log("[ACCEPT] ❌ Driver ID is missing!");
        res.status(401).json({
            success: false,
            message: "Driver ID is required",
        });
        return;
    }

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
        const { action } = req.body;

        // First, check if booking exists at all
        const anyBooking = await Booking.findOne({
            where: { bookingId: id, adminId },
        });

        console.log("[ACCEPT] 📋 Booking lookup (any status):");
        console.log("[ACCEPT]   - Found:", !!anyBooking);
        if (anyBooking) {
            console.log("[ACCEPT]   - Current status:", anyBooking.status);
            console.log("[ACCEPT]   - driverAccepted:", anyBooking.driverAccepted);
            console.log("[ACCEPT]   - driverId on booking:", anyBooking.driverId);
            console.log("[ACCEPT]   - assignAllDriver:", anyBooking.assignAllDriver);
        }

        const booking = await Booking.findOne({
            where: {
                bookingId: id,
                adminId,
                status: "Booking Confirmed",
                driverAccepted: "pending"
            },
        });


        if (!booking) {
            console.log("[ACCEPT] ❌ Booking not found with status='Booking Confirmed' AND driverAccepted='pending'");
            res.status(404).json({
                success: false,
                message: "Booking not found or already processed",
            });
            return;
        }

        console.log("[ACCEPT] ✅ Booking found with correct status");


        const driver = await Driver.findOne({
            where: { driverId: driverId },
            include: [{ model: DriverWallet, as: 'wallet' }],
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        if (driver.assigned) {
            res.status(400).json({
                success: false,
                message: "Driver is already assigned to another booking",
            });
            return;
        }

        // ROBUST CHECK: Query database directly for any active trips (Not-Started or Started)
        // This ensures only 1 active trip per driver at a time, regardless of assigned flag
        const activeBooking = await Booking.findOne({
            where: {
                driverId: driverId,
                adminId,
                status: { [Op.in]: ["Not-Started", "Started"] },
                driverAccepted: "accepted"
            },
            attributes: ["bookingId", "status"]
        });

        if (activeBooking) {
            console.log(`[ACCEPT] ❌ Driver already has active trip: ${activeBooking.bookingId} (status: ${activeBooking.status})`);
            res.status(400).json({
                success: false,
                message: `You already have an active trip (${activeBooking.bookingId}). Please complete or cancel your current trip before accepting a new one.`,
                activeBookingId: activeBooking.bookingId,
                activeStatus: activeBooking.status
            });
            return;
        }

        const vehicle = await Vehicle.findOne({
            where: { driverId: driverId, isActive: true },
        })

        if (!vehicle) {
            res.status(404).json({
                success: false,
                message: "Vehicle not found or not active",
            });
            return;
        }

        if (booking.assignAllDriver && booking.driverAccepted === "accepted") {
            res.status(400).json({
                success: false,
                message: "Booking was already someone accepted",
            });
            return;
        }

        console.log("Action", action);


        let activityLog;
        activityLog = await DriverBookingLog.findOne({
            where: {
                bookingId: id,
                adminId,
                driverId: driverId,
            },
            attributes: [
                "id",
                "acceptTime",
                "tripStatus"
            ]

        });

        if (!activityLog) {
            activityLog = await DriverBookingLog.create({
                adminId,
                driverId,
                bookingId: id,
                acceptTime,
                tripStatus: "Driver Accepted"
            })
        }


        debug.info(`Booking vehicle type: ${booking.vehicleType}`);
        // const vehicleType = await VehicleTypes.findOne({
        //     where: {
        //         name: booking.vehicleType.toLowerCase(),
        //     },
        // })

        // if (!vehicleType) {
        //     res.status(404).json({
        //         success: false,
        //         message: "Vehicle type not found",
        //     });
        //     return;
        // }

        // debug.info(`Vehicle type >> ${vehicleType.acceptedVehicleTypes} , vehicle.type >> ${vehicle.type}`);

        // if (!vehicleType.acceptedVehicleTypes.includes(vehicle.type.toLowerCase())) {
        //     res.status(400).json({
        //         success: false,
        //         message: `You can't accept this booking with ${booking.vehicleType} vehicle`,
        //     });
        //     return;
        // }

        // Commission is always 11% of the estimated trip amount
        const COMMISSION_RATE = 11; // 11%
        const tripCommissionAmount = Math.ceil((booking.estimatedAmount * COMMISSION_RATE) / 100);

        console.log(`[ACCEPT] 💰 Commission Check:`);
        console.log(`[ACCEPT]   - Estimated Amount: ₹${booking.estimatedAmount}`);
        console.log(`[ACCEPT]   - Commission Rate: ${COMMISSION_RATE}%`);
        console.log(`[ACCEPT]   - Required Balance: ₹${tripCommissionAmount}`);

        const driverBalance = JSON.parse(JSON.stringify(driver)).wallet?.balance ?? 0;
        console.log(`[ACCEPT]   - Driver Balance: ₹${driverBalance}`);

        if (driverBalance < tripCommissionAmount) {
            console.log(`[ACCEPT] ❌ Insufficient balance!`);
            res.status(400).json({
                success: false,
                message: `Insufficient wallet balance. You need ₹${tripCommissionAmount} (11% of ₹${booking.estimatedAmount}) but have only ₹${driverBalance}. Please add ₹${tripCommissionAmount - driverBalance} to your wallet.`,
                recharge: true,
                required: tripCommissionAmount,
                available: driverBalance,
                shortfall: tripCommissionAmount - driverBalance
            });
            return
        }
        console.log(`[ACCEPT] ✅ Sufficient balance for commission`);

        let isCustomerAvailable = false;

        // ✅ Accept or Reject logic
        if (action === "reject") {
            booking.driverAccepted = "rejected";

        } else {
            booking.driverId = driverId;
            booking.driverAccepted = "accepted";
            booking.acceptTime = acceptTime;
            booking.status = "Not-Started";
            booking.vehicleId = vehicle.vehicleId;
            driver.assigned = true;
            driver.vehicleId = booking.vehicleId;
            activityLog.acceptTime = acceptTime;
            activityLog.tripStatus = "Driver Accepted"


            const requestTime = dayjs(booking.requestSentTime);
            const acceptTimeObj = dayjs(acceptTime);

            const diffInSeconds = acceptTimeObj.diff(requestTime, 'second', true);

            let formattedAcceptTime;


            if (diffInSeconds >= 60) {
                formattedAcceptTime = `${Math.floor(diffInSeconds / 60)} min`;
            } else {
                formattedAcceptTime = `${diffInSeconds.toFixed(2)} sec`;
            }

            console.log("Driver Accept Time:", formattedAcceptTime);

            activityLog.avgAcceptTime = diffInSeconds;

            const customer = await Customer.findOne({
                where: {
                    customerId: booking.customerId,
                },
            })

            const customerCleanedPhone = booking.phone.replace(/^\+?91|\D/g, '');
            const driverCleanedPhone = driver.phone.replace(/^\+?91|\D/g, '');

            if (customer) {
                let customerName = customer ? customer.name : "Customer";

                const customerNotification = await createCustomerNotification({
                    title: "Driver has been assigned to your booking!",
                    message: `Hi ${customerName}, Driver ${driver.name} has been assigned to your ride. They will contact you shortly and are on their way.`,
                    ids: {
                        adminId: booking.adminId,
                        bookingId: booking.bookingId,
                        customerId: booking.customerId
                    },
                    type: "booking"
                });


                try {
                    if (customerNotification) {
                        const tokenResponse = await sendToSingleToken(customer.fcmToken, {
                            // title: 'New Booking Arrived',
                            // message: `Mr ${driver.name} You have received a new booking`,
                            ids: {
                                adminId: booking.adminId,
                                bookingId: booking.bookingId,
                                customerId: booking.customerId
                            },
                            data: {
                                title: 'Driver has been assigned to your booking!',
                                message: `Hi ${customerName}, Driver ${driver.name} has been assigned to your ride. They will contact you shortly and are on their way.`,
                                type: "customer-driver-assigned",
                                channelKey: "customer_info",
                            }
                        });
                        debug.info(`FCM Notification Response: ${tokenResponse}`);
                    } else {
                        debug.info("driver assigned notification to customer is false");
                    }
                } catch (err: any) {
                    debug.info(`FCM Notification Error - driver assigned notification to customer: ${err}`);
                }

                isCustomerAvailable = true

            }


            // Send notification to admin panel and vendor panel
            const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
            const notification = {
                adminId,
                vendorId: booking.createdBy === "Vendor" ? booking.vendorId : null,
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
            }

            const adminNotificationResponse = await createNotification(adminNotification as any);

            if (booking.createdBy === "Vendor") {
                const notificationResponse = await createNotification(notification as any);
                if (notificationResponse.success) {
                    sendNotification(booking.vendorId, {
                        notificationId: notificationResponse.notificationId ?? undefined,
                        title: `Driver Accepted Booking – Trip #${booking.bookingId}`,
                        description: `Driver has accepted the booking for Trip #${booking.bookingId}.`,
                        type: "booking",
                        read: false,
                        date: new Date(),
                        time: time,
                    });
                }
            }

            // 🟢 Persist "Trip Accepted" Notification for Driver (So it shows in their list)
            await createDriverNotification({
                title: "✅ Trip Accepted",
                message: `You have accepted Trip #${booking.bookingId}. Pickup: ${booking.pickup}`,
                ids: {
                    adminId: adminId,
                    driverId: driverId,
                    bookingId: booking.bookingId
                },
                type: "TRIP_ACCEPTED",
            });

            if (adminNotificationResponse.success) {
                sendNotification(adminId, {
                    notificationId: adminNotificationResponse.notificationId ?? undefined,
                    title: `Driver Accepted Booking – Trip #${booking.bookingId}`,
                    description: `Driver has accepted the booking for Trip #${booking.bookingId}.`,
                    type: "booking",
                    read: false,
                    date: new Date(),
                    time: time,
                });
            }

            // Send email to customer
            try {
                const emailData = {
                    bookingId: booking.bookingId,
                    name: booking.name,
                    email: booking.email,
                    pickup: booking.pickup,
                    drop: booking.drop ?? null,
                    pickupDate: new Date(booking.pickupDateTime).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    pickupTime: new Date(booking.pickupDateTime).toLocaleString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    dropDate: booking.dropDate ? new Date(booking.dropDate).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : null,
                    driverName: driver.name,
                    driverPhone: driver.phone
                };

                // console.log("emailData ---> ", emailData);
                const emailResponse = await driverAssigned(emailData);
                // console.log("emailResponse ---> ", emailResponse);
                if (emailResponse.status === 200) {
                    console.log(`Email sent successfully to ${emailResponse.sentTo}`);
                } else {
                    console.log("Email not sent");
                }

            } catch (error) {
                console.error("Error sending email:", error);
            }

            // SMS Send
            // try {
            //     const cleanedPhone = booking.phone.replace(/^\+?91|\D/g, '');
            //     const companyProfile = await CompanyProfile.findOne({ where: { adminId } });
            //     const smsResponse = await sms.sendTemplateMessage({
            //         mobile: Number(cleanedPhone),
            //         template: "driver_assigned",
            //         data: {
            //             name: booking.name,
            //             driverName: driver.name,
            //             driverPhone: driver.phone,
            //             vehicleNumber: vehicle.vehicleNumber,
            //             contactNumber: companyProfile?.phone[0] ?? "9876543210",
            //             website: companyProfile?.website ?? "https://silvercalltaxi.in/",
            //         }
            //     })
            //     if (smsResponse) {
            //         debug.info("Driver assigned SMS sent successfully");
            //     } else {
            //         debug.info("Driver assigned SMS not sent");
            //     }
            // } catch (error) {
            //     debug.info(`Error sending Driver assigned SMS: ${error}`);
            // }


            // whatsapp assigned message
            try {
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
            }

        }

        await booking.save();
        await driver.save();
        await activityLog.save();

        // Emit TRIP_ACCEPTED socket event to driver for auto-refresh
        try {
            emitTripAcceptedToDriver(driverId, {
                bookingId: id,
                pickup: booking.pickup,
                drop: booking.drop,
                estimatedAmount: booking.estimatedAmount,
                status: booking.status,
            });
            console.log(`[ACCEPT] ✅ TRIP_ACCEPTED socket event emitted to driver: ${driverId}`);
        } catch (socketError) {
            console.error("[ACCEPT] ⚠️ Failed to emit TRIP_ACCEPTED socket event:", socketError);
            // Don't fail the entire request if socket emission fails
        }

        res.status(200).json({
            success: true,
            message: isCustomerAvailable ? `Booking ${action}ed successfully` : `Booking ${action}ed successfully, customer data not found for this booking so notification may not be delivered to customer`,
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





