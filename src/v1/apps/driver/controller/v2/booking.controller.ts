import {
    Booking,
    DriverBookingLog, Vehicle
} from "../../../../core/models";
import { Response, Request } from "express";
import { Op } from "sequelize";
import { maskBookingPhones } from "../../../../core/function/maskPhoneNumber";
import { QueryParams } from "common/types/global.types";
import { infoLogger as info, debugLogger as debug } from "../../../../../utils/logger";

export const getAllBooking = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const {
        page = 1,
        limit = 25,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
    }: QueryParams = req.query;

    const offset = (page - 1) * limit;

    const whereClause: any = {
        adminId,
    };

    const searchConditions: any[] = [];
    if (search) {
        searchConditions.push(
            { bookingId: { [Op.iLike]: `%${search}%` } },
            { bookingNo: { [Op.iLike]: `%${search}%` } },
            { name: { [Op.iLike]: `%${search}%` } },
            { phone: { [Op.iLike]: `%${search}%` } },
            { customerId: { [Op.iLike]: `%${search}%` } },
            { driverId: { [Op.iLike]: `%${search}%` } },
            { vendorId: { [Op.iLike]: `%${search}%` } },
            { enquiryId: { [Op.iLike]: `%${search}%` } },
            { serviceId: { [Op.iLike]: `%${search}%` } },
            { vehicleId: { [Op.iLike]: `%${search}%` } },
            { pickup: { [Op.iLike]: `%${search}%` } },
            { drop: { [Op.iLike]: `%${search}%` } },
            { driverName: { [Op.iLike]: `%${search}%` } },
            { driverPhone: { [Op.iLike]: `%${search}%` } },
            { driverId: { [Op.iLike]: `%${search}%` } },
            // Numeric fields - convert to number if search is numeric
            ...(isNaN(Number(search)) ? [] : [
                { distance: Number(search) },
                { estimatedAmount: Number(search) },
                { finalAmount: Number(search) },
                { tripCompletedDistance: Number(search) },
                { tripCompletedEstimatedAmount: Number(search) },
                { tripCompletedFinalAmount: Number(search) },
                { tripCompletedTaxAmount: Number(search) },
            ])
        );
    }

    if (searchConditions.length > 0) {
        whereClause[Op.or] = searchConditions;
    }

    const order: any[] = [];
    order.push([sortBy, sortOrder]);

    try {

        if (!driverId) {
            res.status(401).json({
                success: false,
                message: "Driver id is required",
            });
            return;
        }

        let bookings: Booking[] | any;


        const [allBookings, individualBookings] = await Promise.allSettled([
            Booking.findAll({
                where: {
                    driverId: null,
                    adminId,
                    assignAllDriver: true,
                    status: "Booking Confirmed",
                    driverAccepted: "pending"
                },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                order,
                limit: Number(limit),
                offset: Number(offset)
            }),
            Booking.findAll({
                where: {
                    driverId: driverId, adminId, [Op.or]: [
                        { status: "Booking Confirmed" },
                        { driverAccepted: "pending" }
                    ]
                },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                order,
                limit: Number(limit),
                offset: Number(offset)
            })
        ]);

        // Extract booking arrays from settled promises
        const allBookingsData = allBookings.status === "fulfilled" ? allBookings.value ?? [] : [];
        const individualBookingsData = individualBookings.status === "fulfilled" ? individualBookings.value ?? [] : [];

        // Combine bookings
        bookings = [...allBookingsData, ...individualBookingsData];

        // Calculate total count
        const totalCount = allBookingsData.length + individualBookingsData.length;

        // Mask phone numbers in bookings
        const maskedBookings = maskBookingPhones(bookings);

        res.status(200).json({
            success: true,
            message: "Booking fetched successfully",
            data: {
                bookings: maskedBookings,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount: totalCount,
                    hasNext: page < Math.ceil(totalCount / limit),
                    hasPrev: page > 1,
                    limit: limit
                }
            },
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



/**
 * Helper function to fetch bookings with pagination
 */
const fetchBookingsWithCount = async (
    whereClause: any,
    order: any[],
    limit: number,
    offset: number
) => {
    const [bookings, totalCount] = await Promise.all([
        Booking.findAll({
            where: whereClause,
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            order,
            limit: Number(limit),
            offset: Number(offset)
        }),
        Booking.count({ where: whereClause })
    ]);

    return { bookings, totalCount };
};

export const specificBooking = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const status = req.query.status ?? req.body.status;
    const {
        page = 1,
        limit = 25,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
    }: QueryParams = req.query;

    const offset = (page - 1) * limit;
    const order: any[] = [[sortBy, sortOrder]];

    try {
        // Validation
        if (!driverId) {
            res.status(401).json({
                success: false,
                message: "Driver id is required",
            });
            return;
        }

        // Default to "not-started" if status is not provided
        const normalizedStatus = status ? status.toLowerCase().trim() : "not-started";
        debug.info(`Fetching bookings for driver: ${driverId}, status: ${normalizedStatus}`);

        let bookings: Booking[] | any;
        let totalCount: number;
        let message: string;

        switch (normalizedStatus) {
            case "booking-confirmed": {
                const result = await fetchBookingsWithCount(
                    {
                        driverId,
                        adminId,
                        status: "Booking Confirmed",
                        driverAccepted: "pending"
                    },
                    order,
                    limit,
                    offset
                );
                bookings = result.bookings;
                totalCount = result.totalCount;
                message = "Confirmed bookings fetched successfully";
                break;
            }

            case "not-started": {
                const result = await fetchBookingsWithCount(
                    {
                        driverId,
                        adminId,
                        status: "Not-Started",
                        driverAccepted: "accepted"
                    },
                    order,
                    limit,
                    offset
                );
                bookings = result.bookings;
                totalCount = result.totalCount;
                message = "Not Started Booking fetched successfully";
                break;
            }

            case "started": {
                const result = await fetchBookingsWithCount(
                    {
                        driverId,
                        adminId,
                        status: "Started",
                        driverAccepted: "accepted"
                    },
                    order,
                    limit,
                    offset
                );
                bookings = result.bookings;
                totalCount = result.totalCount;
                message = "Started Booking fetched successfully";
                break;
            }

            case "completed": {
                const result = await fetchBookingsWithCount(
                    {
                        driverId,
                        adminId,
                        status: "Completed",
                        driverAccepted: "accepted"
                    },
                    order,
                    limit,
                    offset
                );
                bookings = result.bookings;
                totalCount = result.totalCount;
                message = "Completed Booking fetched successfully";
                break;
            }

            case "cancelled": {
                // Optimize cancelled case with parallel queries
                const [driverBookingLog, cancelledBookingsResult] = await Promise.all([
                    DriverBookingLog.findAll({
                        where: { driverId, adminId, tripStatus: "Cancelled" },
                        attributes: ['bookingId']
                    }),
                    fetchBookingsWithCount(
                        {
                            driverId,
                            adminId,
                            status: "Cancelled",
                            driverAccepted: "accepted"
                        },
                        order,
                        limit,
                        offset
                    )
                ]);

                const bookingIds = driverBookingLog.map((log: any) => log.bookingId);
                const cancelledBookings = cancelledBookingsResult.bookings;

                // Fetch driver booking log bookings if there are any booking IDs
                let driverBookingLogBookings: Booking[] = [];
                if (bookingIds.length > 0) {
                    driverBookingLogBookings = await Booking.findAll({
                        where: { bookingId: { [Op.in]: bookingIds } },
                        attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                        order,
                        limit: Number(limit),
                        offset: Number(offset)
                    });
                }

                // Combine and deduplicate bookings by bookingId
                const bookingsMap = new Map<string, any>();
                [...cancelledBookings, ...driverBookingLogBookings].forEach((booking: any) => {
                    const bookingId = booking.bookingId || booking.id?.toString();
                    if (bookingId && !bookingsMap.has(bookingId)) {
                        bookingsMap.set(bookingId, booking);
                    }
                });
                bookings = Array.from(bookingsMap.values());

                // Calculate accurate total count - get unique booking IDs from both sources
                const [cancelledBookingIds, logBookingIds] = await Promise.all([
                    Booking.findAll({
                        where: {
                            driverId,
                            adminId,
                            status: "Cancelled",
                            driverAccepted: "accepted"
                        },
                        attributes: ['bookingId']
                    }),
                    bookingIds.length > 0
                        ? Booking.findAll({
                            where: { bookingId: { [Op.in]: bookingIds } },
                            attributes: ['bookingId']
                        })
                        : Promise.resolve([])
                ]);

                // Deduplicate count by combining unique booking IDs
                const uniqueBookingIdsSet = new Set<string>([
                    ...cancelledBookingIds.map((b: any) => b.bookingId?.toString()).filter(Boolean),
                    ...logBookingIds.map((b: any) => b.bookingId?.toString()).filter(Boolean)
                ]);
                totalCount = uniqueBookingIdsSet.size;

                message = "Cancelled Booking fetched successfully";
                break;
            }

            default: {
                // Default to "not-started"
                const result = await fetchBookingsWithCount(
                    {
                        driverId,
                        adminId,
                        status: "Not-Started",
                        driverAccepted: "accepted"
                    },
                    order,
                    limit,
                    offset
                );
                bookings = result.bookings;
                totalCount = result.totalCount;
                message = "Booking fetched successfully";
                break;
            }
        }

        // Mask phone numbers in bookings
        const maskedBookings = maskBookingPhones(bookings);

        res.status(200).json({
            success: true,
            message,
            data: {
                bookings: maskedBookings,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount: totalCount,
                    hasNext: page < Math.ceil(totalCount / limit),
                    hasPrev: page > 1,
                    limit: limit
                }
            },
        });

    } catch (error) {
        debug.error("Error fetching specific bookings:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

