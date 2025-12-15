import { Request, Response } from "express";
import {
    Booking, Customer, Service,
    DriverWallet, Driver, Vehicle,
    DriverBookingLog, CustomerTransaction,
    CompanyProfile, Vendor
} from "../../../../v1/core/models/index";
import { tripStartedSchema, tripEndSchema } from "../../../../common/validations/tripSchema";
import { createRazorpayOrder, verifyRazorpaySignature, createRazorpayPaymentLink } from "../../../../common/services/payments/razorpayService";
import { commissionCalculation, generateId, generateTransactionId } from "../../../core/function/commissionCalculation";
import SMSService from "../../../../common/services/sms/sms";
import { sendWhatsAppMessage } from "../../../../common/services/whatsApp/wachat"
import { bookingConfirm, driverAssigned, tripCancelled, emailTripCompleted } from "../../../../common/services/mail/mail";
import dayjs from "../../../../utils/dayjs"
import { infoLogger as log, debugLogger as debug } from "../../../../utils/logger";
import { odoCalculation } from "../../../core/function/odoCalculation";
import { createInvoice, InvoiceResponse } from "../../../core/function/createFn/invoiceCreate";
import { sumSingleObject } from "../../../core/function/objectArrays";
import { createCustomerNotification, createNotification } from "../../../core/function/notificationCreate";
import { sendToSingleToken } from "../../../../common/services/firebase/appNotify";
import { sendNotification, emitTripUpdateToCustomer } from "../../../../common/services/socket/websocket";
import { publishNotification } from "../../../../common/services/rabbitmq/publisher";
import { toLocalTime } from "../../../core/function/dataFn";



const sms = SMSService();

export const getTripSummary = async (req: Request, res: Response) => {
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
            where: {
                bookingId: id,
            }
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "booking not found"
            });
            return;
        }


        const service = await Service.findOne({
            where: { serviceId: booking.serviceId, adminId },
        });

        const wallet = await DriverWallet.findOne({
            where: { adminId, driverId },
        })



        const tripDetails = {
            bookingId: booking.bookingId,
            pickup: booking.pickup,
            drop: booking.drop,
            pickupDateTime: booking.pickupDateTime,
            dropDate: booking.dropDate,
            enquiryId: booking.enquiryId || null,
            serviceType: booking.serviceType,
            tariffId: booking.tariffId,
            serviceId: booking.serviceId,
            vehicleId: booking.vehicleId,
            distance: booking.tripCompletedDistance,
            estimatedAmount: booking.tripCompletedEstimatedAmount,
            discountAmount: booking.discountAmount ?? 0,
            finalAmount: booking.tripCompletedFinalAmount,
            advanceAmount: booking.advanceAmount ?? 0,
            // upPaidAmount: booking.upPaidAmount ?? 0,
            days: booking.days ?? 1,
            packageId: booking.packageId ?? null,
            offerId: booking.offerId ?? null,
            tripStartedTime: booking.tripStartedTime,
            tripCompletedTime: booking.tripCompletedTime,
            vehicleType: booking.vehicleType ?? null,
            paymentMethod: booking.paymentMethod || "Cash",
            paymentStatus: booking.paymentStatus || "Pending",
            createdBy: booking.createdBy,
            extraToll: booking.extraToll ?? null,
            extraHill: booking.extraHill ?? null,
            extraPermitCharge: booking.extraPermitCharge ?? null,
            pricePerKm: booking.pricePerKm ?? null,
            taxPercentage: booking.taxPercentage ?? null,
            taxAmount: booking.taxAmount ?? null,
            driverBeta: booking.tripCompletedDriverBeta ?? booking.driverBeta ?? null,
            duration: booking.tripCompletedDuration ?? null,
            stops: booking.stops ?? null,
            startOdometerValue: booking.startOdometerValue ?? null,
            endOdometerValue: booking.endOdometerValue ?? null,
            startOdometerImage: booking.startOdometerImage ?? null,
            endOdometerImage: booking.endOdometerImage ?? null,
            adminContact: booking.adminContact ?? null,
        }

        const customerDetails = {
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
        }

        let totalCalculation: number;
        const finalCalculation = () => {

            const driverCharges = sumSingleObject(booking.driverCharges);
            console.log('Total charges:', driverCharges);

            const finalAmount = Number(booking?.tripCompletedFinalAmount) || 0;
            console.log('Final amount:', finalAmount);

            const result = finalAmount - (driverCharges + Number(booking.normalFare.driverBeta));
            console.log('Final calculation result:', result);

            return result;
        };


        console.log("Booking driver charges: >> ", booking.driverCharges);


        totalCalculation = finalCalculation();

        const additionalCharges = {
            ...booking.driverCharges,
            ...booking.extraCharges,
        }

        const pricePerKm =
            (booking.serviceType === "Hourly Packages" && booking.createdBy === "Vendor") ?
                (booking.modifiedFare.extraPricePerKm || 0) :
                booking.pricePerKm + (booking.extraPricePerKm || 0);
        const tripSummary = {
            totalKm: booking.tripCompletedDistance,
            minKm: booking.minKm,
            pricePerKm: pricePerKm,
            baseFare: booking.tripCompletedEstimatedAmount,
            driverBeta: booking.tripCompletedDriverBeta || (booking.driverBeta + booking.extraDriverBeta) || 0,
            discountAmount: booking.discountAmount,
            gstPercentage: booking.taxPercentage || 0,
            gstAmount: booking.tripCompletedTaxAmount || 0,
            totalAmount: booking.tripCompletedTaxAmount + booking.tripCompletedEstimatedAmount + booking.tripCompletedDriverBeta + booking.convenienceFee,
            additionalCharges: additionalCharges || {},
            advanceAmount: booking.advanceAmount || 0,
            convenienceFee: booking.convenienceFee || 0,
            finalAmount: booking.tripCompletedFinalAmount || 0,
        }

        let vendorCommission: any = {};
        let commissionDetails: any = {};

        if (booking.status === "Completed") {

            if (booking.createdBy === "Vendor") {
                vendorCommission = {
                    ...booking.normalFare
                }
            }

            const extraPerKmCharge = (booking.serviceType === "Hourly Packages" && booking.createdBy === "Vendor") ?
                booking.driverCommissionBreakup.additionalExtraKmCharge :
                booking.driverCommissionBreakup.extraPerKmCharge
            const extraPricePerKm = (booking.serviceType === "Hourly Packages" && booking.createdBy === "Vendor") ?
                booking.normalFare.additionalExtraPricePerKm :
                booking.extraPricePerKm
            commissionDetails = {
                pricePerKm: booking.pricePerKm,
                kmPrice: booking.driverCommissionBreakup.commissionAmount,
                extraPerKm: extraPricePerKm,
                commissionPercentage: booking.driverCommissionBreakup.commissionPercentage,
                extraPerKmCharge: extraPerKmCharge,
                extraDriverBeta: booking.driverCommissionBreakup.extraDriverBeta,
                extraHill: booking.driverCommissionBreakup.extraHill,
                extraPermitCharge: booking.driverCommissionBreakup.extraPermitCharge,
                extraToll: booking.driverCommissionBreakup.extraToll,
                taxPercentage: booking.taxPercentage,
                taxAmount: booking.tripCompletedTaxAmount,
                additionalCharges: booking.extraCharges,
                commissionTaxPercentage: booking.commissionTaxPercentage,
                commissionTax: booking.driverCommissionBreakup.commissionTax,
                totalCommissionCharge: booking.driverDeductionAmount,
                finalCommissionCharge: booking.driverDeductionAmount - (booking.discountAmount || 0),
            }
        }


        // const tripDeduction = {
        //     gstAmount: booking.tripCompletedTaxAmount,
        //     adminCommissionAmount: booking.adminCommission,
        //     adminCommissionTaxPercentage: booking.commissionTaxPercentage,
        //     adminCommissionTaxAmount: booking,
        //     totalAmountDeduction: gst + adminCommission + commissionTax,
        //     totalEarned: booking.tripCompletedFinalAmount - deductionAmount,
        // };

        // console.log("Trip Deduction", deductionAmount);

        const walletDetails = {
            walletId: wallet?.walletId,
            balance: wallet?.balance || 0 + Number(booking.discountAmount),
            deductionAmount: booking.driverDeductionAmount || 0,
            discountAmount: booking.discountAmount,
            deductionAfterBalance: (wallet?.balance || 0) - (booking.driverDeductionAmount || 0),
            totalEarnings: totalCalculation - (booking.driverDeductionAmount || 0),
        }


        const activityLog = await DriverBookingLog.findOne({
            where: {
                bookingId: id,
                driverId,
                adminId,
            },
            attributes: [
                "id",
                "endTripValue",
                "netEarnings",
                "traveledDistance",
                "deductionAmount",
                "additionalCharges",

            ]
        });

        const driverChargesTotal = Object.values(booking?.driverCharges || {})
            .map(Number)
            .reduce((sum, amount) => sum + amount, 0);

        const netEarnings = Number(totalCalculation) - Number(booking.driverDeductionAmount) - driverChargesTotal || 0;



        await activityLog?.update({
            endTripValue: totalCalculation || 0,
            deductionAmount: booking.driverDeductionAmount || 0,
            netEarnings: netEarnings || 0,
            traveledDistance: booking.distance || 0,
            additionalCharges: booking.driverCharges || 0,
            driverBetta: Number(booking.tripCompletedDriverBeta) || Number(booking.driverBeta) || 0,
        })

        console.log(" endTripValue:", totalCalculation,
            "deductionAmount:", booking.driverDeductionAmount,
            "netEarnings:", netEarnings,
            "traveledDistance:", booking.distance,
            "additionalCharges: ", booking.driverCharges,
            "driverBetta: ", Number(booking.tripCompletedDriverBeta) || Number(booking.driverBeta) || 0);

        await activityLog?.save();

        res.status(200).json({
            success: true,
            message: "Trip summary fetched successfully",
            data: {
                tripDetails,
                customerDetails,
                tripSummary,
                // tripDeduction,
                walletDetails,
                vendorCommission,
                commissionDetails
            },
        });
        return;
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
        return;
    }
}

export const tripOtpSend = async (req: Request, res: Response) => {
    const tenantId = req.body.tenantId ?? req.query.tenantId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { type, id, endOdometerValue } = req.params;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    if (!['start', 'end'].includes(type)) {
        res.status(400).json({
            success: false,
            message: "Invalid type parameter",
        });
        return;
    }

    try {
        const booking = await Booking.findOne({
            where: { bookingId: id, driverAccepted: "accepted" }
        });


        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }

        if (booking.status === "Cancelled") {
            res.status(400).json({
                success: false,
                message: "Booking is already cancelled",
            });
            return;
        }

        if (type === "start") {

            const phoneNumber = Number(booking?.phone.replace(/^\+?91|\D/g, ""));;

            if (!phoneNumber) {
                res.status(404).json({
                    success: false,
                    message: "booking phone number not found",
                });
                return;
            }

            const msgResponse = await sms.sendTemplateMessage({
                mobile: phoneNumber,
                template: "customer_trip_otp",
                data: {
                    startOtp: booking.startOtp,
                    endOtp: booking.endOtp
                }
            })

            // send trip otp via whatsapp
            const waCustomerPayload = {
                phone: phoneNumber,
                variables: [
                    { type: "text", text: booking.startOtp },
                    { type: "text", text: booking.endOtp },
                ],
                templateName: "tripOtp"
            }

            publishNotification("notification.whatsapp", waCustomerPayload)
                .catch((err) => console.log("❌ Failed to publish Whatsapp notification", err));

            // const msgResponse = true;
            if (msgResponse) {
                res.status(200).json({
                    success: true,
                    message: "OTP sent to the customer successfully",
                    data: {
                        phoneNumber: phoneNumber,
                    }
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: "Failed to send OTP",
                error: msgResponse,
            });
            return;

        } else if (type === "end") {

            if (!endOdometerValue || typeof endOdometerValue !== "number") {
                res.status(400).json({
                    success: false,
                    message: "End odometer value is required and should be a number",
                })
                return;
            }

            if (Number(booking?.startOdometerValue) >= Number(endOdometerValue)) {
                res.status(400).json({
                    success: false,
                    message: "End odometer value should be greater than start odometer value",
                })
                return;
            }

            const phoneNumber = Number(booking?.phone.replace(/^\+?91|\D/g, ""));

            if (!phoneNumber) {
                res.status(404).json({
                    success: false,
                    message: "booking phone number not found",
                });
                return;
            }

            const token = await sms.sendOtp({
                mobile: phoneNumber,
                isOTPSend: true,
                websiteName: null,
                sendOtp: booking.endOtp,
                id: booking?.customerId
            });
            //   const token = await sms.sendOtp(Number(phoneNumber), "end_ride",booking.endOtp, customer?.customerId);
            if (typeof token === "string") {
                res.status(200).json({
                    success: true,
                    message: "OTP sent to the customer successfully",
                    data: {
                        phoneNumber: phoneNumber,
                    }
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: "Failed to send OTP",
                error: token,
            });
            return;;
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
        return;
    }
}




export const tripStarted = async (req: Request, res: Response) => {
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
            where: {
                bookingId: id,
                adminId,
                status: "Not-Started",
                driverAccepted: "accepted"
            }
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }

        const activityLog = await DriverBookingLog.findOne({
            where: {
                bookingId: id,
                adminId,
                driverId
            }
        })

        if (!activityLog) {
            await DriverBookingLog.create({
                driverId,
                adminId,
                bookingId: id,
                tripStartedTime: dayjs().toDate()

            });
            return;
        }
        else {
            await activityLog.update({
                tripStartedTime: dayjs().toDate(),
            });
            await activityLog.save()
        }



        const validateData = tripStartedSchema.safeParse(req.body);

        if (!validateData.success) {
            res.status(400).json({
                success: false,
                message: validateData.error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }

        const { startOdometerImage, startOdometerValue, startOtp } = validateData.data;

        if (booking.startOtp !== startOtp) {
            res.status(400).json({
                success: false,
                message: "Invalid start OTP",
            });
            return;
        }


        await booking.update({
            status: "Started",
            startOdometerImage: startOdometerImage || null,
            startOdometerValue,
            tripStartedTime: new Date(),
        });

        await booking.save();

        // Send notification to admin panel and vendor panel
        const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
        const notification = {
            adminId,
            vendorId: booking.createdBy === "Vendor" ? booking.vendorId : null,
            title: `Trip Started – Trip #${booking.bookingId}`,
            description: `Driver has started the journey for Trip #${booking.bookingId}.`,
            type: "booking",
            read: false,
            date: new Date(),
            time: time,
        };

        const adminNotification = {
            adminId,
            vendorId: null,
            title: `Trip Started – Trip #${booking.bookingId}`,
            description: `Driver has started the journey for Trip #${booking.bookingId}.`,
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
                    title: `Trip Started – Trip #${booking.bookingId}`,
                    description: `Driver has started the journey for Trip #${booking.bookingId}.`,
                    type: "booking",
                    read: false,
                    date: new Date(),
                    time: time,
                });
            }
        }

        if (adminNotificationResponse.success) {
            sendNotification(adminId, {
                notificationId: adminNotificationResponse.notificationId ?? undefined,
                title: `Trip Started – Trip #${booking.bookingId}`,
                description: `Driver has started the journey for Trip #${booking.bookingId}.`,
                type: "booking",
                read: false,
                date: new Date(),
                time: time,
            });
        }

        // Send FCM notification to customer
        const customer = await Customer.findOne({
            where: { customerId: booking.customerId, adminId },
        });

        if (customer && customer.fcmToken && customer.fcmToken.trim() !== '') {
            try {
                const customerFcmResponse = await sendToSingleToken(customer.fcmToken, {
                    ids: {
                        adminId: booking.adminId,
                        bookingId: booking.bookingId,
                        customerId: booking.customerId,
                    },
                    data: {
                        title: "Trip Started",
                        message: `Your trip has started! Driver is on the way to your pickup location.`,
                        type: "trip-started",
                        channelKey: "customer_info",
                    },
                });
                debug.info(`Customer FCM Notification Response: ${customerFcmResponse}`);
            } catch (fcmError) {
                debug.info(`FCM Notification Error - trip started notification to customer: ${fcmError}`);
            }
        } else {
            debug.info(`Customer FCM token not available for customerId: ${booking.customerId}`);
        }

        // 🟢 NEW: Emit Socket Event for Live Tracking
        emitTripUpdateToCustomer(booking.customerId, {
            bookingId: booking.bookingId,
            status: 'Started',
            tripStartedTime: booking.tripStartedTime,
            driverId: driverId,
            message: "Trip Started"
        });

        // Send FCM notification to vendor (if booking was created by vendor)
        if (booking.createdBy === "Vendor" && booking.vendorId) {
            const vendor = await Vendor.findOne({
                where: { vendorId: booking.vendorId, adminId },
                attributes: ["fcmToken"],
            });

            if (vendor && vendor.fcmToken && vendor.fcmToken.trim() !== '') {
                try {
                    const vendorFcmResponse = await sendToSingleToken(vendor.fcmToken, {
                        ids: {
                            adminId: booking.adminId,
                            bookingId: booking.bookingId,
                            vendorId: booking.vendorId,
                        },
                        data: {
                            title: "Trip Started",
                            message: `Trip #${booking.bookingId} has started. Driver is on the way.`,
                            type: "trip-started",
                            channelKey: "booking_channel",
                        },
                    });
                    debug.info(`Vendor FCM Notification Response: ${vendorFcmResponse}`);
                } catch (fcmError) {
                    debug.info(`FCM Notification Error - trip started notification to vendor: ${fcmError}`);
                }
            } else {
                debug.info(`Vendor FCM token not available for vendorId: ${booking.vendorId}`);
            }
        }


        res.status(200).json({
            success: true,
            message: "Trip started successfully",
        });
        return;

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
        return;
    }
}

export const tripEnd = async (req: Request, res: Response) => {
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
            where: { bookingId: id, adminId, status: "Started" }
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }

        const validateData = tripEndSchema.safeParse(req.body);

        if (!validateData.success) {
            res.status(400).json({
                success: false,
                message: validateData.error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }

        const { endOdometerImage, endOdometerValue, endOtp, driverCharges } = validateData.data;

        if (booking.startOdometerValue >= endOdometerValue) {
            res.status(400).json({
                success: false,
                message: "End odometer value should be greater than start odometer value",
            })
            return;
        }


        console.log("driverCharges >> ", driverCharges)

        if (booking.endOtp !== endOtp) {
            res.status(400).json({
                success: false,
                message: "Invalid end OTP",
            });
            return;
        }


        await booking.update({
            endOdometerImage: endOdometerImage || null,
            endOdometerValue,
            endOtp,
            tripCompletedTime: new Date(),
            driverCharges: driverCharges || null,
        });

        await booking.save();

        const odoCalRes: any = await odoCalculation(id);
        console.warn("Response from odoCalculation in tripend", odoCalRes);

        res.status(200).json({
            success: true,
            message: "Trip ended successfully",
        });
        return;

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
        return;
    }
}

export const tripCompleted = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { id } = req.params;
    const { paymentMethod } = req.body;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: 'Driver id is required',
        });
        return;
    }

    const validPaymentMethods = ["Cash", "Link", "UPI"] as const;

    console.log("Method", paymentMethod);

    if (!validPaymentMethods.includes(paymentMethod)) {
        res.status(400).json({
            success: false,
            message: 'Invalid payment method',
        });
        return;
    }


    try {
        const booking = await Booking.findOne({
            where: { bookingId: id, adminId, status: 'Started' },
        });


        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        const driver = await Driver.findOne({
            where: { driverId, adminId }
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
            return;
        }

        const customer = await Customer.findOne({
            where: { customerId: booking.customerId, adminId }
        });

        if (customer) {
            customer.totalAmount = (customer.totalAmount || 0) + (booking.tripCompletedFinalAmount || 0);
            customer.bookingCount = (customer.bookingCount || 0) + 1;
            await customer.save();
        }

        const now = dayjs();


        const activityLog = await DriverBookingLog.findOne({
            where: {
                bookingId: id,
                adminId,
                driverId
            },
            attributes: ["id", "tripStartedTime", "tripCompletedTime", "adminId", "driverId", "bookingId"]
        });

        if (activityLog) {
            const tripStartedTime = dayjs(activityLog.tripStartedTime);
            const activeDrivingMinutes = now.diff(tripStartedTime, "minute");

            await activityLog.update({
                tripCompletedTime: now.toDate(),
                activeDrivingMinutes: isNaN(activeDrivingMinutes) ? 0 : activeDrivingMinutes,
                tripStatus: "Completed"
            });

        }


        let vehicle: any = null;
        if (booking?.vehicleId) {
            vehicle = await Vehicle.findOne({
                where: { vehicleId: booking?.vehicleId, adminId }
            });
        }


        let isCustomerAvailable = false;
        // 🟢 If payment method is cash, mark as completed & paid
        // if (booking.paymentMethod === 'Cash') {
        if (paymentMethod === 'Link') {

            //generate razorpay order id
            const orderId = `order_${await generateId(14)}`
            const razorpayOrder = await createRazorpayPaymentLink({
                amount: booking.tripCompletedFinalAmount,
                customer: {
                    name: booking.name,
                    email: booking.email,
                    contact: booking.phone.slice(-10)
                },
                notes: {
                    type: "Trip-Completed",
                    bookingId: booking.bookingId,
                    driverId: driverId,
                    vendorId: booking.vendorId,
                    customerId: booking.customerId,
                    orderId: orderId
                }
            });

            const transactionId = await generateTransactionId();
            const transaction = await CustomerTransaction.create({
                adminId,
                transactionId: transactionId,
                amount: Number(razorpayOrder.amount),
                type: "Booking",
                date: dayjs().toDate(),
                description: "Booking payment",
                customerId: booking.customerId,
                tnxOrderId: orderId,
                tnxPaymentStatus: "Pending",
                isShow: false
            });

            await transaction.save();
            booking.bookingOrderId = orderId;
            await booking.save();


            res.status(200).json({
                success: true,
                message: 'Generated Razorpay payment link successfully',
                data: {
                    transactionId: transactionId,
                }
            });
            return;

        } else {
            await booking.update({
                status: 'Completed',
                paymentStatus: 'Paid',
                tripCompletedPaymentMethod: paymentMethod,
                upPaidAmount: 0,
            });
            driver.assigned = false;
            driver.bookingCount += 1;
            driver.totalEarnings = String(Number(driver.totalEarnings) + (Number(booking.tripCompletedFinalAmount) - Number(booking.driverDeductionAmount)));
            await driver.save();

            const excludeKeys = ["Toll", "Hill", "Permit Charge"];
            const extraChargesSum = sumSingleObject(booking.extraCharges, excludeKeys);
            const extraChargesValue = Number(extraChargesSum)

            const driverDeductionFinalAmount = booking.driverDeductionAmount + extraChargesValue
            console.log("From and to", booking.pickup, booking.drop, "driverDeductionFinalAmount", driverDeductionFinalAmount);
            const driverCommission = await commissionCalculation({
                debitedId: driverId,
                amount: driverDeductionFinalAmount,
                serviceId: booking.serviceId,
                debitedBy: "Driver",
                bookingId: booking.bookingId,
                pickup: booking.pickup,
                drop: booking.drop,
                earnedAmount: booking.tripCompletedFinalAmount - driverDeductionFinalAmount,
                creditAmount: booking.discountAmount || 0,
                driverFareBreakup: booking.driverCommissionBreakup,

            });

            if (booking.createdBy === "Vendor") {
                const vendorCommission = await commissionCalculation({
                    debitedId: booking.vendorId,
                    amount: booking.vendorDeductionAmount,
                    serviceId: booking.serviceId,
                    debitedBy: "Vendor",
                    bookingId: booking.bookingId,
                    creditAmount: booking.vendorCommission,
                    pickup: booking.pickup,
                    drop: booking.drop,
                    booking: booking
                });

                console.log("vendorCommission >> ", vendorCommission);
            }


            if (activityLog) {
                const tripStartedTime = dayjs(activityLog.tripStartedTime);
                const activeDrivingMinutes = now.diff(tripStartedTime, "minute");

                await activityLog.update({
                    tripCompletedTime: now.toDate(),
                    activeDrivingMinutes,
                    tripStatus: "Completed"
                });

            }


            const customer = await Customer.findOne({
                where: {
                    customerId: booking.customerId,
                },
            })


            // Send notification to customer
            if (customer) {
                let customerName = customer ? customer.name : "Customer";

                const customerNotification = await createCustomerNotification({
                    title: "Your trip has been completed!",
                    message: `Thank you, ${customerName}, for riding with us. Your trip with Driver ${driver.name} has been successfully completed. We hope you had a great experience!`,
                    ids: {
                        adminId: booking.adminId,
                        bookingId: booking.bookingId,
                        customerId: booking.customerId
                    },
                    type: "booking"
                });


                try {
                    if (customerNotification && customer.fcmToken && customer.fcmToken.trim() !== '') {
                        const tokenResponse = await sendToSingleToken(customer.fcmToken, {
                            ids: {
                                adminId: booking.adminId,
                                bookingId: booking.bookingId,
                                customerId: booking.customerId
                            },
                            data: {
                                title: 'Your trip has been completed!',
                                message: `Thank you, ${customerName}, for riding with us. Your trip with Driver ${driver.name} has been successfully completed. We hope you had a great experience!`,
                                type: "customer-trip-completed",
                                channelKey: "customer_info",
                            }
                        });
                        debug.info(`FCM Notification Response: ${tokenResponse}`);
                    } else {
                        debug.info("Customer FCM token not available or notification failed");
                    }
                } catch (err: any) {
                    debug.info(`FCM Notification Error - trip completed notification to customer: ${err}`);
                }

                isCustomerAvailable = true

            }

            // 🟢 NEW: Emit Socket Event for Trip Completion
            emitTripUpdateToCustomer(booking.customerId, {
                bookingId: booking.bookingId,
                status: 'Completed',
                tripCompletedTime: new Date(),
                finalAmount: booking.tripCompletedFinalAmount,
                message: "Trip Completed"
            });

            // Send FCM notification to vendor (if booking was created by vendor)
            if (booking.createdBy === "Vendor" && booking.vendorId) {
                const vendor = await Vendor.findOne({
                    where: { vendorId: booking.vendorId, adminId },
                    attributes: ["fcmToken"],
                });

                if (vendor && vendor.fcmToken && vendor.fcmToken.trim() !== '') {
                    try {
                        const vendorFcmResponse = await sendToSingleToken(vendor.fcmToken, {
                            ids: {
                                adminId: booking.adminId,
                                bookingId: booking.bookingId,
                                vendorId: booking.vendorId,
                            },
                            data: {
                                title: "Trip Completed",
                                message: `Trip #${booking.bookingId} has been successfully completed.`,
                                type: "trip-completed",
                                channelKey: "booking_channel",
                            },
                        });
                        debug.info(`Vendor FCM Notification Response: ${vendorFcmResponse}`);
                    } catch (fcmError) {
                        debug.info(`FCM Notification Error - trip completed notification to vendor: ${fcmError}`);
                    }
                } else {
                    debug.info(`Vendor FCM token not available for vendorId: ${booking.vendorId}`);
                }
            }

            const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
            const notification = {
                adminId,
                vendorId: booking.createdBy === "Vendor" ? booking.vendorId : null,
                title: `Trip Completed – Trip #${booking.bookingId}`,
                description: `Driver has successfully completed Trip #${booking.bookingId}.`,
                read: false,
                date: new Date(),
                time: time,
            };

            const notificationResponse = await createNotification(notification as any);
            const adminNotification = {
                adminId,
                vendorId: null,
                title: `Trip Completed – Trip #${booking.bookingId}`,
                description: `Driver has successfully completed Trip #${booking.bookingId}.`,
                read: false,
                date: new Date(),
                time: time,
            }

            const adminNotificationResponse = await createNotification(adminNotification as any);

            if (notificationResponse.success) {
                if (booking.createdBy === "Vendor") {
                    sendNotification(booking.vendorId, {
                        notificationId: notificationResponse.notificationId ?? undefined,
                        title: `Trip Completed – Trip #${booking.bookingId}`,
                        description: `Driver has successfully completed Trip #${booking.bookingId}.`,
                        read: false,
                        date: new Date(),
                        time: time,
                    });
                }

                if (adminNotificationResponse.success) {
                    sendNotification(adminId, {
                        notificationId: adminNotificationResponse.notificationId ?? undefined,
                        title: `Trip Completed – Trip #${booking.bookingId}`,
                        description: `Driver has successfully completed Trip #${booking.bookingId}.`,
                        read: false,
                        date: new Date(),
                        time: time,
                    });
                }
            }

            const customerCleanedPhone = booking.phone.replace(/^\+?91|\D/g, '');
            const driverCleanedPhone = driver.phone.replace(/^\+?91|\D/g, '');


            // Send email to customer
            try {
                // Check if customer email exists
                if (!booking.email || booking.email.trim() === '') {
                    debug.info("Customer email not available, skipping email notification");
                } else {
                    const emailData = {
                        bookingId: booking.bookingId,
                        bookingDate: new Date(booking.createdAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        name: booking.name,
                        phone: booking.phone,
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
                        carType: vehicle?.type || 'N/A',
                        serviceType: booking.serviceType,
                        finalAmount: booking.finalAmount,
                        advanceAmount: booking.advanceAmount,
                        upPaidAmount: booking.upPaidAmount,
                    };

                    // console.log("emailData ---> ", emailData);
                    const emailResponse = await emailTripCompleted(emailData);
                    // console.log("emailResponse ---> ", emailResponse);
                    if (emailResponse && emailResponse.status === 200) {
                        console.log(`Email sent successfully to ${emailResponse.sentTo}`);
                    } else {
                        console.log("Email not sent");
                    }
                }

            } catch (error) {
                debug.info("Error sending email:", error);
            }

            const companyProfile = await CompanyProfile.findOne({ where: { adminId } });

            let vendor: Vendor | null = null;
            if (booking.createdBy === "Vendor") {
                vendor = await Vendor.findOne({ where: { adminId, vendorId: booking.vendorId } });
            }
            // SMS Send
            // try {
            //     const smsResponse = await sms.sendTemplateMessage({
            //         mobile: Number(cleanedPhone),
            //         template: "trip_completed",
            //         data: {
            //             contactNumber: companyProfile?.phone[0] ?? "9876543210",
            //             website: companyProfile?.website ?? "https://silvercalltaxi.in/",
            //         }
            //     })
            //     if (smsResponse) {
            //         debug.info("Trip completed SMS sent successfully");
            //     } else {
            //         debug.info("Trip completed SMS not sent");
            //     }
            // } catch (error) {
            //     debug.info(`Error sending Trip completed SMS: ${error}`);
            // }

            let invoice: InvoiceResponse | null = null;
            try {
                invoice = await createInvoice({
                    adminId: booking.adminId,
                    vendorId: booking.vendorId,
                    bookingId: booking.bookingId,
                    name: booking.name,
                    phone: booking.phone,
                    email: booking.email,
                    serviceType: booking.serviceType,
                    vehicleType: vehicle?.type || null,
                    totalKm: booking.tripCompletedDistance,
                    pickup: booking.pickup,
                    drop: booking.drop,
                    pricePerKm: booking.pricePerKm,
                    estimatedAmount: booking.tripCompletedEstimatedAmount || 0,
                    advanceAmount: booking.advanceAmount,
                    travelTime: booking.tripCompletedDuration,
                    otherCharges: {
                        "CGST & SGST": booking.taxAmount,
                        "Driver beta": booking.tripCompletedDriverBeta || booking.driverBeta || 0,
                        ...booking.driverCharges,
                        ...booking.extraCharges
                    },
                    totalAmount: booking.tripCompletedFinalAmount,
                    createdBy: booking.createdBy,
                    status: booking.paymentStatus,
                    paymentMethod: booking.paymentMethod,
                    paymentDetails: booking.paymentMethod,
                    note: "This invoice is auto-generated and does not require a signature.",
                })

                debug.info("invoice response >> ", invoice.success);
            } catch (error) {
                debug.info("Error in invoice creation >> ", error);
            }

            // Send whatsapp message
            try {
                // send driver trip completed whatsapp message
                const waDriverPayload = {
                    phone: driverCleanedPhone,
                    variables: [
                        { type: "text", text: `${booking.pickup} to ${booking.drop}` },
                        {
                            type: "text", text: `${new Date(booking.tripCompletedTime).toLocaleString('en-IN', {
                                timeZone: "Asia/Kolkata",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                            })}`
                        },
                    ],
                    templateName: "driverTripCompleted"
                }

                publishNotification("notification.whatsapp", waDriverPayload)
                    .catch((err) => console.log("❌ Failed to publish Whatsapp notification", err));

                // send customer trip completed whatsapp message
                const waCustomerPayload = {
                    phone: customerCleanedPhone,
                    variables: [
                        { type: "text", text: `${booking.createdBy == "Vendor" ? vendor?.name : (companyProfile?.name ?? "silvercalltaxi.in")}` },
                        { type: "text", text: booking.adminContact },
                        { type: "text", text: `${companyProfile?.website ?? "silvercalltaxi.in"}booking/invoice/${invoice?.data?.invoiceNo}` },
                    ],
                    templateName: "tripCompleted"
                }

                publishNotification("notification.whatsapp", waCustomerPayload)
                    .catch((err) => console.log("❌ Failed to publish Whatsapp notification", err));
            } catch (error) {
                console.error("Error sending whatsapp trip completed :", error);
            }

            debug.info("driverCommission >> ", driverCommission)

            // Determine response message based on customer availability and email status
            let responseMessage = "Trip completed successfully";

            if (!isCustomerAvailable) {
                responseMessage += ", customer data not found for this booking so notification may not be delivered to customer";
            }

            if (!booking.email || booking.email.trim() === '') {
                responseMessage += ", email not available so email notification was not sent";
            }

            res.status(200).json({
                success: true,
                message: responseMessage,
                data: booking,
            });
            return;
        }

    } catch (error) {
        debug.info(`Trip complete error: ${JSON.stringify(error, null, 2)}`);
        console.error('Trip complete error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error,
        });
        return;
    }
};

export const verifyTripPayment = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { id } = req.params;
    if (!driverId) {
        res.status(401).json({
            success: false,
            message: 'Driver id is required',
        });
        return;
    }

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        console.log("req.body >> ", req.body);

        const isValid = verifyRazorpaySignature({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
        });

        console.log("Payment isValid >> ", isValid);

        if (!isValid) {
            res.status(400).json({
                success: false,
                message: 'Invalid Razorpay signature'
            });
            return;
        }

        const booking = await Booking.findOne({
            where: { bookingId: id, adminId, driverAccepted: 'accepted', driverId }
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
            return;
        }

        const driverCommission = await commissionCalculation({
            debitedId: driverId,
            amount: booking.driverDeductionAmount,
            serviceId: booking.serviceId,
            debitedBy: "Driver",
            bookingId: booking.bookingId
        });

        console.log("payment driverCommission >> ", driverCommission)

        await booking.update({
            paymentStatus: 'Paid',
            bookingPaymentId: razorpay_payment_id,
        });

        res.status(200).json({
            success: true,
            message: 'Payment verified and booking updated',
            booking,
        });
        return;
    } catch (error) {
        console.error('Trip complete error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error,
        });
        return;
    }
};

export const getOrCreateRazorpayOrder = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { id } = req.params; // bookingId

    try {
        const booking = await Booking.findOne({
            where: { bookingId: id, adminId, driverAccepted: 'accepted' },
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        // Reuse existing order if available
        if (booking.bookingOrderId) {
            res.status(200).json({
                success: true,
                message: 'Existing Razorpay order found',
                order: {
                    orderId: booking.bookingOrderId,
                    amount: (booking.finalAmount) * 100,
                    currency: 'INR',
                },
            });
            return;
        }

        // Create a new order
        const order = await createRazorpayOrder({
            amount: booking.finalAmount,
            receipt: `booking_${booking.bookingId}_retry`,
            notes: {
                bookingId: booking.bookingId,
                customerId: booking.customerId,
                driverId: booking.driverId,
                adminId,
            },
        });

        await booking.update({
            bookingOrderId: order.id,
        });

        res.status(200).json({
            success: true,
            message: 'New Razorpay order created',
            order: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
            },
        });
        return;
    } catch (error) {
        console.error('Order retry error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error,
        });
        return;
    }
};


export const driverTripCancellation = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: 'Driver id is required',
        });
        return;
    }

    const driver = await Driver.findOne({
        where: { driverId, adminId },
    });

    if (!driver) {
        res.status(404).json({
            success: false,
            message: 'Driver not found',
        });
        return;
    }

    try {

        if (!reason) {
            res.status(400).json({
                success: false,
                message: 'Reason is required',
            });
            return;
        }

        console.log("id ---> ", id, "driverId ---> ", driverId, "adminId ---> ", adminId);

        const driverBookingLog = await DriverBookingLog.findOne({
            where: { bookingId: id, driverId, adminId },
        });

        console.log("driverBookingLog ---> ", driverBookingLog);
        if (!driverBookingLog) {
            res.status(404).json({
                success: false,
                message: 'Driver booking log not found',
            });
            return;
        }

        const booking = await Booking.findOne({
            where: { bookingId: id, adminId, driverAccepted: 'accepted' },
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        if (
            booking.status === 'Started'
            || booking.status === 'Completed'
            || booking.status === 'Cancelled'
        ) {
            res.status(400).json({
                success: false,
                message: `Trip already ${booking.status}`,
            });
            return;
        }

        await booking.update({
            status: 'Reassign',
            driverId: null,
            vehicleId: driver.vehicleId,
            driverAccepted: 'pending',
        });

        await driver.update({
            assigned: false,
            vehicleId: "null",
        });

        await driverBookingLog.update({
            tripStatus: 'Cancelled',
            reason: reason,
            endTripValue: 0,
        });


        await driverBookingLog.save();
        await driver.save();
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Trip cancelled successfully',
        });
        return;
    } catch (error) {
        console.error('Trip cancellation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error,
        });
        return;
    }
}


