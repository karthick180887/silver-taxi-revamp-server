import { Request, Response } from "express";
// Force Rebuild Trigger
import {
    Tariff,
    Service, DayPackage,
    HourlyPackage,
    Customer,
    Driver,
    Offers,
    CompanyProfile,
    OfferUsage,
    Vehicle,
    Vendor,
} from '../../../core/models/index'
import { PromoCodeUsage } from "../../../core/models/promoCodeUsage";
import { Booking } from "../../../core/models/booking";
import { createNotification } from "../../../core/function/notificationCreate";
import { sendNotification } from "../../../../common/services/socket/websocket";
import { bookingConfirm } from "../../../../common/services/mail/mail";
import { CustomerWallet } from "../../../core/models/customerWallets";
import dayjs from "../../../../utils/dayjs";
import { debugLog, infoLog } from "../../../../utils/logger";
import { createRazorpayOrder } from "../../../../common/services/payments/razorpayService";
import { CustomerTransaction } from "../../../core/models/customerTransactions";
import { generateTransactionId } from "../../../core/function/commissionCalculation";
import { createCustomerNotification, createDriverNotification } from "../../../core/function/notificationCreate";
import { sendToSingleToken } from "../../../../common/services/firebase/appNotify";
import { debugLogger as debug, infoLogger as log } from "../../../../utils/logger";
import { applyOffer, applyPromoCode, sendBookingEmail, sendBookingNotifications, deductWallet } from "../../../core/function/postBookingCreation";
import SMSService from "../../../../common/services/sms/sms";
import { Op } from "sequelize";
import { publishNotification } from "../../../../common/services/rabbitmq/publisher";
import { toLocalTime } from "../../../core/function/dataFn";



const sms = SMSService()


export const specificBooking = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const customerId = req.body.customerId ?? req.query.customerId;
    const status = req.query.status ?? req.body.status;

    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Customer id is required",
        });
        return;
    }

    try {

        console.log("status >> ", status);

        let bookings: Booking[] | any;
        switch (status.toLowerCase().trim()) {
            case "recent":
                bookings = await Booking.findOne({
                    where: { customerId: customerId, adminId },
                    order: [['createdAt', 'DESC']], // ensures it's the latest booking
                    limit: 1,
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                })
                console.log(`[Recent] Found: ${bookings ? bookings.bookingId : 'None'}`);
                res.status(200).json({
                    success: true,
                    message: "Recent Booking fetched successfully",
                    data: bookings,
                });
                break;
            case "current":
                bookings = await Booking.findAll({
                    where: { customerId: customerId, adminId, status: "Started" },
                    order: [['createdAt', 'DESC']],
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                });
                res.status(200).json({
                    success: true,
                    message: "Current Booking fetched successfully",
                    data: bookings,
                });
                break;
            case "upcoming":
                bookings = await Booking.findAll({
                    where: {
                        customerId: customerId,
                        adminId,
                        [Op.or]: [{ status: "Booking Confirmed" }, { status: "Not-Started" }]
                    },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    order: [['createdAt', 'DESC']]
                });
                console.log(`[Upcoming] Query Status: Booking Confirmed/Not-Started, Found: ${bookings.length}`);
                if (bookings.length > 0) {
                    bookings.forEach((b: any) => console.log(`[Upcoming] Found: ${b.bookingId}, Status: ${b.status}`));
                } else {
                    console.log(`[Upcoming] No bookings found. Checking specific ID SLTB260102914...`);
                }

                res.status(200).json({
                    success: true,
                    message: "Upcoming Booking fetched successfully",
                    data: bookings,
                });
                break;
            case "completed":
                bookings = await Booking.findAll({
                    where: { customerId: customerId, adminId, status: "Completed" },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    order: [['updatedAt', 'DESC']]
                });
                res.status(200).json({
                    success: true,
                    message: "Completed Booking fetched successfully",
                    data: bookings,
                });
                break;
            case "cancelled":
                bookings = await Booking.findAll({
                    where: { customerId: customerId, adminId, status: "Cancelled" },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    order: [['updatedAt', 'DESC']]
                });
                console.log(`[Cancelled] Query Status: ${status}, Found: ${bookings.length}`);

                if (bookings.length > 0) {
                    console.log(`[Cancelled] Sample ID: ${bookings[0].bookingId}, Status: ${bookings[0].status}`);
                }
                res.status(200).json({
                    success: true,
                    message: "Cancelled Booking fetched successfully",
                    data: bookings.map((b: any) => {
                        const booking = b.toJSON();
                        try {
                            if (booking.pickup?.startsWith('{')) booking.pickup = JSON.parse(booking.pickup);
                            if (booking.drop?.startsWith('{')) booking.drop = JSON.parse(booking.drop);
                        } catch (_) { }
                        return booking;
                    }),
                });
                break;

            case "all":
                bookings = await Booking.findAll({
                    where: { customerId: customerId, adminId },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    order: [['createdAt', 'DESC']]
                });

                if (bookings.length == 0) {
                    res.status(200).json({
                        success: true,
                        message: "No bookings found",
                        data: bookings,
                    });
                    return;
                }


                const modifiedBookings = bookings.map((b: any) => {
                    const booking = b.toJSON();

                    if (booking.status === "Reassign") {
                        booking.status = "Booking Confirmed";
                    }

                    // Parse location JSON if stored as string
                    try {
                        if (booking.pickup && booking.pickup.startsWith('{')) {
                            booking.pickup = JSON.parse(booking.pickup);
                        }
                        if (booking.drop && booking.drop.startsWith('{')) {
                            booking.drop = JSON.parse(booking.drop);
                        }
                    } catch (e) { }

                    return booking;
                });

                res.status(200).json({
                    success: true,
                    message: "All Bookings fetched successfully",
                    data: modifiedBookings,
                });
                break;
            default:
                bookings = await Booking.findAll({
                    where: { customerId: customerId, adminId, status: "Not-Started" },
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

export const getSingleBooking = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const customerId = req.body.customerId ?? req.query.customerId;
    const { id } = req.params;

    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Customer id is required",
        });
        return;
    }

    try {
        const booking = await Booking.findOne({
            where: { bookingId: id, adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [
                {
                    model: Tariff,
                    as: 'tariff',
                    attributes: ['description'],
                }
            ]

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
        })


        const data: any = booking.toJSON();
        data.vehicle = vehicle ? vehicle.toJSON() : null;
        data.description = data?.tariff?.description || null;
        delete data.tariff;

        // Parse location JSON if stored as string
        try {
            if (data.pickup && data.pickup.startsWith('{')) {
                data.pickup = JSON.parse(data.pickup);
            }
            if (data.drop && data.drop.startsWith('{')) {
                data.drop = JSON.parse(data.drop);
            }
        } catch (e) { }



        res.status(200).json({
            success: true,
            message: "Booking fetched successfully",
            data
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

export const customerCreateBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const customerId = req.body.customerId ?? req.query.id;
        const {
            pickupDateTime,
            stops = [],
            dropDate, enquiryId,
            serviceType,
            offerId,
            type,
            tripType,
            paymentMethod,
            advanceAmount,
            discountAmount,
            estimatedAmount,
            finalAmount,
            distance,
            serviceId,
            upPaidAmount,
            packageId, packageType,
            paymentStatus, createdBy,
            toll,
            extraToll,
            hill,
            extraHill,
            permitCharge,
            extraPermitCharge,
            pricePerKm,
            extraPricePerKm,
            taxPercentage,
            extraCharges,
            taxAmount,
            driverBeta,
            extraDriverBeta,
            duration,
            vehicleType,
            codeId,
            promoCode,
            codeType,
            value,
            walletAmount,
        } = req.body;

        // Map frontend keys to backend keys
        // Map frontend keys to backend keys
        let pickup = req.body.pickup ?? req.body.pickupLocation;
        let drop = req.body.drop ?? req.body.dropLocation;
        // vehicleTypeId from frontend is actually a tariff ID (e.g. tar-19)
        // vehicleId refers to a specific vehicle instance (which is unknown at booking time)
        const tariffId = req.body.tariffId ?? req.body.vehicleTypeId;
        const vehicleId = undefined;

        // Helper function to clean phone number (remove all 91 prefixes and non-digits)
        const cleanPhone = (phone: string | undefined | null): string => {
            if (!phone) return '';
            // Remove all non-digit characters first
            let cleaned = phone.replace(/\D/g, '');
            // Remove leading 91 country code (can appear multiple times)
            while (cleaned.startsWith('91') && cleaned.length > 10) {
                cleaned = cleaned.substring(2);
            }
            return cleaned;
        };

        // Ensure pickup and drop are stringified JSON if they are objects to preserve lat/lng
        if (typeof pickup === 'object' && pickup !== null) {
            pickup = JSON.stringify(pickup);
        }
        if (typeof drop === 'object' && drop !== null) {
            drop = JSON.stringify(drop);
        }

        // MAP tripType to serviceType if missing
        let validServiceType = serviceType;
        if (!validServiceType) {
            const normalizedTripType = tripType?.toLowerCase();
            if (normalizedTripType === 'one_way' || tripType === 'One way') validServiceType = 'One way'; // Changed from 'Daily' to 'One way'
            else if (normalizedTripType === 'round_trip' || tripType === 'Round Trip' || tripType === 'Round trip') validServiceType = 'Round trip';
            else if (normalizedTripType === 'rental') validServiceType = 'Day Packages'; // Changed from 'Rental' to 'Day Packages'
        }

        if (!validServiceType) {
            console.warn("DEBUG: Missing validServiceType. tripType:", tripType, "serviceType:", serviceType);
            res.status(400).json({
                success: false,
                message: "Service Name (serviceType) is required (e.g. Daily, Round trip, Rental)",
            });
            return;
        }

        const today = dayjs().toDate();

        const usageId = `pu-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        console.log("req.body", req.body);

        let days = 1;


        if (validServiceType === "Round trip" && !dropDate) {
            console.warn("DEBUG: Missing dropDate for Round trip");
            res.status(400).json({
                success: false,
                message: "dropDate is required for Round trip",
            });
            return;
        }

        console.log("typeof pickupDateTime", typeof pickupDateTime);

        if (!pickupDateTime || typeof pickupDateTime !== 'string') {
            console.warn("DEBUG: Invalid pickupDateTime:", pickupDateTime, "Type:", typeof pickupDateTime);
            res.status(400).json({
                success: false,
                message: "pickupDateTime is required and must be a string",
            });
            return;
        }

        // Validate dates
        const pickupDateTimeObj = new Date(pickupDateTime);
        if (isNaN(pickupDateTimeObj.getTime())) {
            console.warn("DEBUG: Invalid pickupDateTime format:", pickupDateTime);
            res.status(400).json({
                success: false,
                message: "Invalid pickupDateTime format",
            });
            return;
        }

        let dropDateObj: Date | null = null;
        if (dropDate) {
            dropDateObj = new Date(dropDate);
            if (isNaN(dropDateObj.getTime())) {
                console.warn("DEBUG: Invalid dropDate format:", dropDate);
                res.status(400).json({
                    success: false,
                    message: "Invalid dropDate format",
                });
                return;
            }
        }


        const start = new Date(pickupDateTime);
        const end = new Date(dropDate);

        // Normalize to midnight
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        days = validServiceType === "Round trip"
            ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 1;


        const getService = await Service.findOne({
            where: { name: validServiceType, adminId },
        });

        if (!getService) {
            console.warn("DEBUG: Service not found for type:", validServiceType, "adminId:", adminId);
            res.status(400).json({
                success: false,
                message: "Invalid service type",
            });
            return;
        }

        let service = getService?.serviceId;

        let convertedDistance = Number(distance);
        if (isNaN(convertedDistance)) {
            convertedDistance = 0;
        }
        let convertedDuration = duration;



        const customerData = await Customer.findOne({
            where: { customerId },
        });

        if (!customerData) {
            res.status(404).json({
                success: false,
                message: "Customer not found",
            });
            return;
        }

        const wallet = await CustomerWallet.findOne({ where: { customerId } });

        if (!wallet) {
            res.status(404).json({
                success: false,
                message: "Wallet not found"
            });
            return;
        }


        const companyProfile = await CompanyProfile.findOne({
            where: { adminId },
        });

        const { customAlphabet } = await import("nanoid");
        const generateOtp = customAlphabet('1234567890', 6);  // 6 digits for MSG91 compatibility
        const startOtp = generateOtp();
        const endOtp = generateOtp();

        // DEBUG LOGS
        console.log("DEBUG: tripType:", tripType);
        console.log("DEBUG: validServiceType (before):", validServiceType);
        console.log("DEBUG: req.body.phone:", req.body.phone);
        console.log("DEBUG: customerId resolution - body:", req.body.customerId, "query.id:", req.query.id, "query.customerId:", req.query.customerId, "final:", customerId);
        console.log("DEBUG: createdBy:", createdBy);


        // Self-healing: Update customer profile if phone is missing
        if (!customerData?.phone && req.body.phone) {
            const cleanedInputPhone = cleanPhone(req.body.phone);
            const formattedPhone = `91 ${cleanedInputPhone}`;
            try {
                await Customer.update(
                    { phone: formattedPhone },
                    { where: { customerId: customerId } }
                );
                console.log("DEBUG: Updated customer phone to:", formattedPhone);
            } catch (e) {
                console.error("Error updating customer phone:", e);
            }
        }

        if (!validServiceType) {
            const normalizedTripType = tripType?.toLowerCase();
            if (normalizedTripType === 'one_way' || tripType === 'One way') validServiceType = 'One way';
            else if (normalizedTripType === 'round_trip' || tripType === 'Round Trip' || tripType === 'Round trip') validServiceType = 'Round trip';
            else if (normalizedTripType === 'rental') validServiceType = 'Day Packages';
        }
        console.log("DEBUG: validServiceType (after):", validServiceType);

        // Fetch tariff to get rate values as fallback when not provided in request body
        let tariff: Tariff | null = null;
        if (tariffId) {
            tariff = await Tariff.findOne({
                where: { tariffId, adminId }
            });
        }

        // Use tariff values as fallback when not provided in request body
        const effectivePricePerKm = pricePerKm ?? tariff?.price ?? 0;
        const effectiveExtraPricePerKm = extraPricePerKm ?? tariff?.extraPrice ?? 0;
        const effectiveDriverBeta = driverBeta ?? tariff?.driverBeta ?? 0;
        const effectiveExtraDriverBeta = extraDriverBeta ?? 0;


        const bookingData = {
            adminId,
            customerId: (createdBy === "User" || !createdBy) ? customerId : null,
            name: String(customerData?.name),
            email: customerData?.email,
            phone: req.body.phone ? `91 ${cleanPhone(req.body.phone)}` : customerData?.phone,
            pickup,
            drop,


            stops,
            pickupDateTime: pickupDateTimeObj,
            dropDate: dropDateObj,
            enquiryId: enquiryId ?? null,
            serviceType: validServiceType,
            tariffId: tariffId ?? null,
            serviceId: serviceId ?? service,
            vehicleId,
            // status: "Booking Confirmed" ,
            type: type || "App",
            minKm: getService?.minKm,
            distance: convertedDistance,
            estimatedAmount: estimatedAmount ?? 0,
            discountAmount: discountAmount ?? 0,
            finalAmount: finalAmount ?? 0,
            advanceAmount: advanceAmount ?? 0,
            upPaidAmount: upPaidAmount ?? 0,
            packageId: packageId ?? null,
            offerId: offerId ?? null,
            promoCodeId: codeId ?? null,
            paymentMethod,
            paymentStatus: paymentStatus || "Unpaid",
            createdBy: createdBy ?? "User",
            toll: toll ?? null,
            hill: hill ?? null,
            permitCharge: permitCharge ?? null,
            pricePerKm: effectivePricePerKm,
            extraPricePerKm: effectiveExtraPricePerKm,
            taxPercentage: taxPercentage ?? null,
            taxAmount: taxAmount ?? null,
            driverBeta: effectiveDriverBeta,
            duration: convertedDuration ?? null,
            startOtp,
            days: days.toString(),
            endOtp,
            extraCharges: {
                "Toll": 0,
                "Hill": 0,
                "Permit Charge": 0,
                "Parking Charge": 0,
                "Pet Charge": 0,
                "Waiting Charge": 0,
            },
            vehicleType: vehicleType ?? null,
            razorpayOrderId: null, // New field for Razorpay order ID
            razorpayPaymentLink: null, // New field for Razorpay payment link
            normalFare: {
                days: days,
                distance: convertedDistance,
                pricePerKm: effectivePricePerKm,
                extraPricePerKm: effectiveExtraPricePerKm,
                driverBeta: effectiveDriverBeta,
                extraDriverBeta: effectiveExtraDriverBeta,
                toll: toll,
                hill: hill,
                permitCharge: permitCharge,
                estimatedAmount: estimatedAmount,
                finalAmount: finalAmount,
            },
            modifiedFare: {
                days: days,
                distance: (convertedDistance ?? 0),
                pricePerKm: effectivePricePerKm,
                extraPricePerKm: effectiveExtraPricePerKm,
                driverBeta: effectiveDriverBeta + effectiveExtraDriverBeta,
                toll: (toll ?? 0) + (extraToll ?? 0),
                hill: (hill ?? 0) + (extraHill ?? 0),
                permitCharge: (permitCharge ?? 0) + (extraPermitCharge ?? 0),
                estimatedAmount: Number(estimatedAmount) + (distance * effectiveExtraPricePerKm),
                finalAmount: Number(finalAmount),
            },
            convenienceFee: companyProfile?.convenienceFee,
            adminContact: String(companyProfile?.phone[0]) ?? "9876543210"
        };

        const newBooking = await Booking.create(bookingData);
        let cleanedPhone = customerData.phone.replace(/^\+?91|\D/g, '');
        let phoneNumber = cleanedPhone.slice(5, 10);
        newBooking.bookingId = `SLTB${phoneNumber}${newBooking.id}`;
        await newBooking.save();


        const bookingTransactionId = await generateTransactionId();
        const walletTransactionId = await generateTransactionId();

        if (paymentMethod === 'Cash') {
            let remainingAmount = finalAmount;

            // Handle wallet portion if specified
            if (walletAmount && walletAmount > 0) {
                const availableWalletAmount = wallet?.balance ?? 0;
                const actualWalletDeduction = Math.min(walletAmount, availableWalletAmount, finalAmount);

                if (actualWalletDeduction > 0) {
                    // Deduct from wallet
                    wallet.balance -= actualWalletDeduction;
                    wallet.minusAmount += actualWalletDeduction;
                    await wallet.save();

                    // Create wallet transaction
                    await CustomerTransaction.create({
                        adminId,
                        transactionId: walletTransactionId,
                        customerId,
                        amount: actualWalletDeduction,
                        type: 'Wallet',
                        transactionType: 'Debit',
                        date: dayjs().toDate(),
                        source: 'App',
                        reason: 'Wallet Amount Deducted',
                        isShow: true,
                        description: `Wallet deduction for booking ${newBooking.bookingId}`
                    });

                    remainingAmount -= actualWalletDeduction;
                    newBooking.advanceAmount = actualWalletDeduction;
                }
            }

            // Set cash payment details
            newBooking.upPaidAmount = remainingAmount;

            // Create cash transaction for remaining amount (if any)
            if (remainingAmount > 0) {
                await CustomerTransaction.create({
                    adminId,
                    transactionId: bookingTransactionId,
                    customerId,
                    amount: remainingAmount,
                    type: 'Booking',
                    transactionType: 'Debit',
                    date: dayjs().toDate(),
                    source: 'App',
                    reason: 'Cash Payment',
                    isShow: true,
                    description: `Cash payment for booking ${newBooking.bookingId}`,
                    tnxPaymentStatus: 'Success' // Cash payments are immediately successful
                });
            }

            // Determine payment status
            if (remainingAmount === 0) {
                newBooking.paymentStatus = "Paid";
            } else if (remainingAmount < finalAmount) {
                newBooking.paymentStatus = "Partial Paid";
            } else {
                newBooking.paymentStatus = paymentStatus || 'Unpaid';
            }

            await newBooking.save();



            if (promoCode) {
                await applyPromoCode({
                    adminId,
                    codeId,
                    usageId,
                    promoCode,
                    codeType,
                    value,
                    discountAmount: discountAmount ?? 0,
                    customerId,
                    bookingId: newBooking.bookingId,
                    finalAmount: newBooking.finalAmount,
                });
            }

            if (offerId) {
                await applyOffer({
                    adminId,
                    offerId,
                    offerName: req.body.offerName, // Adjust based on where offerName comes from
                    customerId,
                    bookingId: newBooking.bookingId,
                    finalAmount: newBooking.finalAmount,
                    discountAmount: discountAmount ?? 0,
                });
            }



        } else if (paymentMethod === 'Wallet') {
            if (typeof walletAmount !== 'number' || walletAmount < 0) {
                await newBooking.destroy();
                res.status(400).json({
                    success: false,
                    message: 'Invalid or missing wallet amount',
                });
                return;
            }

            const actualWalletDeduction = await deductWallet({
                wallet,
                amount: walletAmount,
                adminId,
                customerId,
                bookingId: newBooking.bookingId,
                transactionId: walletTransactionId,
            });

            if (actualWalletDeduction === 0) {
                await newBooking.destroy();
                res.status(400).json({
                    success: false,
                    message: 'Insufficient wallet balance',
                });
                return;
            }

            const finalBookingAmount = finalAmount - (discountAmount ?? 0);
            if (actualWalletDeduction < finalBookingAmount) {
                newBooking.paymentStatus = 'Partial Paid';
                newBooking.upPaidAmount = finalBookingAmount - actualWalletDeduction;
                newBooking.advanceAmount = actualWalletDeduction;
            } else {
                newBooking.paymentStatus = 'Paid';
                newBooking.upPaidAmount = 0;
                newBooking.advanceAmount = actualWalletDeduction;
            }

            await newBooking.save();


            if (promoCode) {
                await applyPromoCode({
                    adminId,
                    codeId,
                    usageId,
                    promoCode,
                    codeType,
                    value,
                    discountAmount: discountAmount ?? 0,
                    customerId,
                    bookingId: newBooking.bookingId,
                    finalAmount: newBooking.finalAmount,
                });
            }

            if (offerId) {
                await applyOffer({
                    adminId,
                    offerId,
                    offerName: req.body.offerName,
                    customerId,
                    bookingId: newBooking.bookingId,
                    finalAmount: newBooking.finalAmount,
                    discountAmount: discountAmount ?? 0,
                });
            }

        } else if (paymentMethod === 'UPI') {
            let upiAmount = finalAmount;
            let plannedWalletAmount = 0;

            console.log("Final amount >>", finalAmount);
            console.log("Requested wallet amount >>", walletAmount);

            // Calculate planned wallet usage but don't deduct yet
            if (walletAmount && walletAmount > 0) {
                const availableWalletAmount = wallet?.balance ?? 0;
                plannedWalletAmount = Math.min(walletAmount, availableWalletAmount, finalAmount);

                if (plannedWalletAmount > 0) {
                    // Reduce UPI amount by planned wallet usage
                    upiAmount = finalAmount - plannedWalletAmount;

                    // Set booking fields for planned wallet usage
                    newBooking.advanceAmount = plannedWalletAmount; // Planned wallet amount

                    if (upiAmount === 0) {
                        newBooking.paymentStatus = "Unpaid"; // Will be "Paid" after wallet deduction in webhook
                        newBooking.upPaidAmount = 0;
                    } else {
                        newBooking.paymentStatus = "Unpaid"; // Will be "Paid" after both UPI and wallet
                        newBooking.upPaidAmount = upiAmount;
                    }
                } else {
                    // No wallet available or requested
                    newBooking.paymentStatus = "Unpaid";
                    newBooking.upPaidAmount = finalAmount;
                    newBooking.advanceAmount = 0;
                }
            } else {
                // Pure UPI payment (no wallet)
                newBooking.paymentStatus = "Unpaid";
                newBooking.upPaidAmount = finalAmount;
                newBooking.advanceAmount = 0;
            }

            console.log("UPI amount to be paid >>", upiAmount);
            console.log("Planned wallet deduction >>", plannedWalletAmount);

            // Create Razorpay order for UPI amount
            // Note: Razorpay requires minimum 1 rupee, so handle zero amount case
            const orderAmount = Math.max(upiAmount, 1); // Minimum 1 rupee for Razorpay

            // const order = await createRazorpayOrder({
            //     amount: orderAmount,
            //     receipt: bookingTransactionId,
            //     notes: {
            //         type: 'Booking',
            //         bookingId: newBooking.bookingId,
            //         customerId: customerId,
            //         adminId: adminId,
            //         plannedWalletAmount: plannedWalletAmount, // Pass planned wallet amount to webhook
            //         finalAmount: finalAmount,
            //         actualUpiAmount: upiAmount // Actual UPI amount (might be 0)
            //     },
            // });


            const order = await createRazorpayOrder({
                amount: orderAmount,
                receipt: bookingTransactionId,
                notes: {
                    type: 'Booking',
                    bookingId: newBooking.bookingId,
                    vehicleType: vehicleType ?? null,
                    customerId: customerId,
                    adminId: adminId,
                    plannedWalletAmount: plannedWalletAmount,
                    finalAmount: finalAmount,
                    actualUpiAmount: upiAmount,
                    promoCodeId: codeId || null,
                    promoCode: promoCode || null,
                    codeType: codeType || null,
                    promoValue: value || null,
                    discountAmount: discountAmount || 0,
                    offerId: offerId || null,
                    offerName: req.body.offerName || null,
                    walletTransactionId: walletTransactionId
                },
            });

            console.log("Razorpay Order >>", order);

            // Create pending UPI transaction
            const transaction = await CustomerTransaction.create({
                adminId,
                transactionId: bookingTransactionId,
                amount: upiAmount, // Store actual UPI amount
                type: "Booking",
                date: dayjs().toDate(),
                description: `Booking payment via UPI${plannedWalletAmount > 0 ? ' + Wallet' : ''}`,
                customerId,
                tnxOrderId: order.id,
                tnxPaymentStatus: "Pending",
                isShow: false,
                transactionType: "Debit",
                source: "App",
                reason: "Booking payment",
            });

            await transaction.save();

            // Save Razorpay order ID to booking
            newBooking.bookingOrderId = order.id;
            await newBooking.save();

            console.log("✅ UPI order created successfully");
            console.log("Order ID:", order.id);
            console.log("UPI Amount:", upiAmount);
            console.log("Planned Wallet Amount:", plannedWalletAmount);
        }

        const booking = await Booking.findAll({
            where: { customerId }
        });

        if (booking.length === 1) {
            // console.log("companyProfile", companyProfile)

            const receiverAmount = companyProfile?.customerReferral?.receiverAmount || 0;
            const senderAmount = companyProfile?.customerReferral?.senderAmount || 0;


            const senderCustomer = await Customer.findOne({
                where: {
                    customerId: customerData.referredBy
                }
            })


            if (!senderCustomer) {
                debug.info(`Sender customer not found >> ${customerData.referredBy}`);
                // return;
            }

            const senderWallet = await CustomerWallet.findOne({
                where: { adminId, customerId: senderCustomer?.customerId },
            });

            const receiverWallet = wallet; // already created above

            // Generate transaction IDs
            const senderTransactionId = await generateTransactionId();
            const receiverTransactionId = await generateTransactionId();

            // Credit sender (referrer)
            if (senderWallet && senderAmount > 0) {
                senderWallet.balance += Number(senderAmount);
                await senderWallet.save();

                await CustomerTransaction.create({
                    adminId,
                    transactionId: senderTransactionId,
                    customerId: senderCustomer?.customerId || "",
                    amount: senderAmount,
                    transactionType: "Credit",
                    type: "Referral",
                    source: "App",
                    date: today,
                    reason: "Referral Bonus",
                    description: `Referral bonus for referring ${senderCustomer?.phone}`,
                    walletId: senderWallet.walletId,
                    isShow: true
                });
            }

            // Credit receiver (new customer)
            if (receiverWallet && receiverAmount > 0) {
                receiverWallet.balance += receiverAmount;
                await receiverWallet.save();

                await CustomerTransaction.create({
                    adminId,
                    transactionId: receiverTransactionId,
                    customerId: customerData.customerId,
                    amount: receiverAmount,
                    transactionType: "Credit",
                    type: "Referral",
                    source: "App",
                    date: today,
                    reason: "Referral Reward",
                    description: `Reward for signing up with referral code`,
                    walletId: receiverWallet.walletId,
                    isShow: true
                });
            }
        }

        if (paymentMethod !== 'UPI') {
            await sendBookingNotifications({
                adminId,
                customerId: createdBy === 'User' ? customerId : null,
                createdBy,
                bookingId: newBooking.bookingId,
                customerName: customerData.name,
                customerPhone: customerData.phone,
                customerFcmToken: customerData.fcmToken,
                customerAdminId: customerData.adminId,
                from: pickup,
                to: drop,
            });
        }

        // Send email
        await sendBookingEmail({
            booking: newBooking,
            customer: customerData,
            vehicleType,
            pickupDateTime,
            dropDateObj,
            estimatedAmount,
            discountAmount: paymentMethod === 'UPI' ? 0 : (discountAmount ?? 0),
            taxAmount,
            toll,
            hill,
            permitCharge,
            finalAmount: paymentMethod === 'UPI' ? finalAmount : newBooking.finalAmount,
            paymentMethod,
        });

        const IST_OFFSET = 5.5 * 60 * 60 * 1000;
        // Send SMS to customer
        try {
            const smsResponse = await sms.sendTemplateMessage({
                mobile: Number(cleanedPhone),
                template: "customer_booking_acknowledgement",
                data: {
                    contact: `${(companyProfile?.name ?? "silvercalltaxi.in")}`,
                    location: `${pickup} ${stops.length > 0 ? ` → ${stops.join(" → ")} → ${drop}` : drop ? ` → ${drop}` : ""}`,
                    pickupDateTime: new Date(
                        new Date(pickupDateTime).getTime() - IST_OFFSET
                    ).toLocaleString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    }),
                    serviceType: `${newBooking.serviceType === "Round trip" ? `${newBooking.serviceType} day(s)${newBooking.days}` : newBooking.serviceType}`,
                    distance: newBooking.distance,
                    minKm: newBooking.minKm,
                    pricePerKm: newBooking.pricePerKm,
                    driverBeta: newBooking.driverBeta,
                    hill: (newBooking.extraCharges?.["Hill"] ?? 0).toString(),
                    permitCharges: (newBooking.extraCharges?.["Permit Charge"] ?? 0).toString(),
                    estimatedAmount: (newBooking.estimatedAmount ?? 0).toString(),
                    taxAmount: (newBooking.taxAmount ?? 0).toString(),
                    discountAmount: (newBooking.discountAmount ?? 0).toString(),
                    finalAmount: (newBooking.finalAmount ?? 0).toString(),
                    contactNumber: companyProfile?.phone?.[0] ?? "9876543210",
                    website: companyProfile?.website || "https://silvercalltaxi.in"
                }
            })
            if (smsResponse) {
                debug.info("SMS sent successfully to customer");
            } else {
                debug.info("SMS not sent to customer");
            }
        } catch (error) {
            debug.info(`Error sending SMS to customer: ${error}`);
        }

        // send wa notification to customer
        try {
            const waCustomerPayload = {
                phone: cleanedPhone,
                variables: [
                    { type: "text", text: `${(companyProfile?.name ?? "silvercalltaxi.in")}` },
                    {
                        type: "text", text: `${new Date(
                            new Date(pickupDateTime).getTime() - IST_OFFSET
                        ).toLocaleString('en-IN', {
                            timeZone: "Asia/Kolkata",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                        })}`
                    },
                    { type: "text", text: `${newBooking.pickup}${newBooking.stops.length > 0 ? ` → ${newBooking.stops.slice(0, 2).join(" → ")} → ${newBooking.drop}` : ""}${newBooking.drop ? `→ ${newBooking.drop}` : ""}` },
                    { type: "text", text: `${newBooking.serviceType === "Round trip" ? `${newBooking.serviceType} day(s)${newBooking.days}` : newBooking.serviceType}` },
                    { type: "text", text: newBooking.distance },
                    { type: "text", text: newBooking.minKm },
                    { type: "text", text: newBooking.pricePerKm },
                    { type: "text", text: newBooking.driverBeta },
                    // { type: "text", text: newBooking.extraCharges["Toll"].toString() ?? "0" },
                    { type: "text", text: (newBooking.extraCharges?.["Hill"] ?? 0).toString() },
                    { type: "text", text: (newBooking.extraCharges?.["Permit Charge"] ?? 0).toString() },
                    { type: "text", text: (newBooking.estimatedAmount ?? 0).toString() },
                    { type: "text", text: (newBooking.taxAmount ?? 0).toString() },
                    { type: "text", text: (newBooking.discountAmount ?? 0).toString() },
                    { type: "text", text: (newBooking.finalAmount ?? 0).toString() },
                    { type: "text", text: companyProfile?.phone?.[0] ?? "9876543210" },
                    { type: "text", text: companyProfile?.website ?? "https://silvertaxi.in" },
                ],
                templateName: "bookingConfirmedAcknowledgement"
            }

            publishNotification("notification.whatsapp", waCustomerPayload)
                .catch((err) => console.log("❌ Failed to publish Whatsapp notification", waCustomerPayload.templateName, err));

        } catch (error) {
            console.log("❌ Failed to publish create booking Whatsapp notification", error);
        }

        res.status(201).json({
            success: true,
            message: `${validServiceType} ${createdBy === "User" ? "User" : "Admin"} booking created successfully`,
            data: {
                ...newBooking.toJSON(),
            },
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
            error,
        });
    }
};


export const cancelBooking = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const customerId = req.body.customerId ?? req.query.customerId;
    const { id } = req.params;


    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Customer id is required",
        });
        return;
    }

    try {
        const customerData = await Customer.findOne({
            where: { customerId, adminId }
        });

        if (!customerData) {
            res.status(404).json({
                success: false,
                message: "Customer not found"
            });
            return;
        }

        const booking = await Booking.findOne({
            where: { bookingId: id, adminId, customerId }
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found"
            });
            return;
        }


        if (booking?.driverId) {
            const driver = await Driver.findOne({
                where: { driverId: booking.driverId }
            });

            if (!driver) {
                debug.info(`Driver not assigned to this bookingId ${booking.bookingId}`);
                return;
            }

            //Refund logic

            // const refundAmount = booking.tripCompletedFinalAmount === null ? (booking.advanceAmount + booking.finalAmount) : booking.tripCompletedFinalAmount;
            // const customerWallet = await CustomerWallet.findOne({
            //     where: { customerId, adminId }
            // });
            // if (customerWallet) {
            //     customerWallet.balance += refundAmount;
            //     await customerWallet.save();
            // }

            if (booking.status === "Started" || booking.status === "Completed") {
                res.status(400).json({
                    success: false,
                    message: `Cannot cancel a booking that has already ${booking.status}`
                })
                return;
            }

            driver.assigned = false;
            await driver.save();


            const bookingAssignNotification = await createDriverNotification({
                title: "Booking cancelled by Customer",
                message: `Mr ${driver.name}, Your booking has been cancelled by customer`,
                ids: {
                    adminId: booking.adminId,
                    driverId: driver.driverId,
                },
                type: "booking"
            });


            try {
                if (bookingAssignNotification) {
                    const tokenResponse = await sendToSingleToken(driver.fcmToken, {
                        // title: 'New Booking Arrived',
                        // message: `Mr ${driver.name} You have received a new booking`,
                        ids: {
                            adminId: booking.adminId,
                            bookingId: booking.bookingId,
                            driverId: driver.driverId,
                        },
                        data: {
                            title: 'Booking cancelled by Customer',
                            message: `Mr ${driver.name}, Your booking has been cancelled by customer`,
                            type: "customer-booking-cancel",
                            channelKey: "other_channel",
                        }
                    });
                    debug.info(`FCM Notification Response: ${tokenResponse}`);
                } else {
                    debug.info(`booking cancelled  by customer notification is false`);
                }
            } catch (err: any) {
                debug.info(`FCM Notification Error: ${err}`);
            }

        }

        booking.status = "Cancelled";
        await booking.save();


        const customerNotification = await createCustomerNotification({
            title: "Booking has been successfully cancelled",
            message: `Hi ${customerData.name}, your booking has been successfully cancelled.`,
            ids: {
                adminId: customerData.adminId,
                bookingId: booking.bookingId,
                customerId: customerData.customerId
            },
            type: "booking"
        });


        try {
            if (customerNotification) {
                const tokenResponse = await sendToSingleToken(customerData.fcmToken, {
                    ids: {
                        adminId: customerData.adminId,
                        bookingId: booking.bookingId,
                        customerId: customerData.customerId
                    },
                    data: {
                        title: 'Booking has been successfully cancelled',
                        message: `Hi ${customerData.name}, your booking has been successfully cancelled.`,
                        type: "customer-trip-cancelled",
                        channelKey: "booking_channel",
                    }
                });
                debug.info(`FCM Notification Response: ${tokenResponse}`);
            } else {
                debug.info(`trip cancelled notification to customer is false`);
            }
        } catch (err: any) {
            debug.info(`FCM Notification Error - trip cancelled notification to customer: ${err}`);
        }

        // SMS Send
        try {
            let cleanedPhone = customerData.phone.replace(/^\+?91|\D/g, '');
            const companyProfile = await CompanyProfile.findOne({ where: { adminId } });
            const smsResponse = await sms.sendTemplateMessage({
                mobile: Number(cleanedPhone),
                template: "trip_cancel",
                data: {
                    name: customerData.name,
                    bookingId: booking.bookingId,
                    contactNumber: companyProfile?.phone[0] ?? "9876543210",
                    website: companyProfile?.website ?? "https://silvercalltaxi.in/",
                }
            })
            if (smsResponse) {
                debug.info("SMS sent successfully to customer");
            } else {
                debug.info("SMS not sent to customer");
            }
        } catch (error) {
            debug.info(`Error sending SMS to customer: ${error}`);
        }



        res.status(200).json({
            success: true,
            message: "Your booking cancelled successfully"
        });
        return;
    }


    catch (err) {
        debug.info("Error cancelling booking", err);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Internal server error",
            error: err
        });
    }
}
