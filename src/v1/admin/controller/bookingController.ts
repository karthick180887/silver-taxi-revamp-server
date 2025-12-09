import { Request, Response } from "express";
import { Booking } from "../../core/models/booking";
import {
    Tariff, Driver,
    Service, DayPackage,
    HourlyPackage,
    Customer,
    CompanyProfile,
    Vehicle,
    Enquiry,
    CustomerWallet,
    Vendor,
    DriverBookingLog,
    DriverNotification
} from '../../core/models/index'
import { bookingConfirm } from "../../../common/services/mail/mail";
import { commissionCalculation, customOTPGenerator } from "../../core/function/commissionCalculation";
import { sendNotification } from "../../../common/services/socket/websocket";
import { createNotification } from "../../core/function/notificationCreate";
import { createDriverNotification, createCustomerNotification } from '../../core/function/notificationCreate';
import { sendToSingleToken, sendToMultipleTokens, sendBatchNotifications } from "../../../common/services/firebase/appNotify";
import dayjs from "../../../utils/dayjs";
import { debugLogger as debug, infoLogger as log } from "../../../utils/logger";
import { sumSingleObject } from "../../core/function/objectArrays";
import { generateReferralCode } from "../../core/function/referCode";
import SMSService from "../../../common/services/sms/sms";
import { driverCommissionCalculation, odoCalculation } from "../../core/function/odoCalculation";
import { publishNotification } from "../../../common/services/rabbitmq/publisher";
import { Op, Sequelize } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { toLocalTime } from "../../core/function/dataFn";
import { ModifiedDualCalculationResult, modifiedDualFareCalculation } from "../../core/function/distancePriceCalculation";
import { getSegmentDistancesOptimized } from "../../../common/functions/distanceAndTime";
import { createInvoice, InvoiceResponse } from "../../core/function/createFn/invoiceCreate";
import { QueryParams } from "../../../common/types/global.types";
import { getBarChartMeta } from "../../core/function/dataBaseFn";
import { getAllRedisDrivers, getDriverFcmToken } from "../../../utils/redis.configs";

const sms = SMSService()

// Get all bookings

interface BookingFilterParams extends QueryParams {
    isContacted?: boolean;
    searchBy?: 'bookings' | 'drivers' | null;
}

export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            page = 1,
            limit = 30,
            search = '',
            status = 'Booking Confirmed',
            isContacted = false,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            searchBy = null,
        }: BookingFilterParams = req.query;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Bookings",
            });
            return;
        }
        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause: any = {
            adminId,
        };

        // Handle searchBy logic first to determine if status should be applied
        let shouldApplyStatusFilter = true;

        // If searching by drivers, use driverName and driverPhone directly from Booking table
        if (searchBy === 'drivers' && search) {
            // Search bookings by driverName and driverPhone directly (no need to query Driver table)
            whereClause[Op.or] = [
                { driverName: { [Op.iLike]: `%${search}%` } },
                { driverPhone: { [Op.iLike]: `%${search}%` } }
            ];
            // When searching by drivers, search across all statuses
            shouldApplyStatusFilter = false;
        }

        // Add status filter if provided and not searching by drivers/bookings
        if (shouldApplyStatusFilter && status && searchBy !== 'bookings') {
            if (status === 'Vendor') {
                whereClause.createdBy = 'Vendor';
                whereClause.status = { [Op.in]: ['Booking Confirmed', 'Reassign'] };
            } else if (status === 'Booking Confirmed') {
                whereClause.status = 'Booking Confirmed';
                whereClause.isContacted = isContacted;
                whereClause.createdBy = { [Op.ne]: 'Vendor' };
            } else {
                whereClause.status = status;
            }
        }

        // Build search conditions for bookings (only if not searching by drivers)
        // Note: ENUM columns (paymentMethod, paymentStatus, status, type) cannot use LIKE in PostgreSQL
        // They are excluded from search - use filters for exact ENUM matching
        const searchConditions: any[] = [];
        if (search && searchBy !== 'drivers') {
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

        // Add search conditions to where clause if they exist
        if (searchConditions.length > 0) {
            whereClause[Op.or] = searchConditions;
        }

        // Define sort order mapping
        const order: any[] = [];
        order.push([sortBy, sortOrder]);

        // Create base where clause without status for counts
        const baseWhereClause = { adminId };

        // Create count where clause that respects driver filter and search filters
        // but excludes status filters for accurate pagination
        const countWhereClause: any = { adminId };
        // Add driver search conditions to count if searching by drivers
        if (searchBy === 'drivers' && search) {
            countWhereClause[Op.or] = [
                { driverName: { [Op.iLike]: `%${search}%` } },
                { driverPhone: { [Op.iLike]: `%${search}%` } },
                { driverId: { [Op.iLike]: `%${search}%` } }
            ];
        }
        // Add search conditions to count if searching by bookings
        if (search && searchBy === 'bookings' && searchConditions.length > 0) {
            countWhereClause[Op.or] = searchConditions;
        }
        // Run critical queries (must succeed) and count queries (can fail gracefully) in parallel
        const [
            criticalResults,
            countResults
        ] = await Promise.all([
            // Critical queries - use Promise.all (fail fast if these fail)
            Promise.all([
                // Main bookings query
                Booking.findAll({
                    where: whereClause,
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    order,
                    limit: parseInt(limit as any),
                    offset: offset
                }),
                // Total count - use countWhereClause to respect filters for accurate pagination
                Booking.count({ where: countWhereClause })
            ]),
            // Count queries - use Promise.allSettled (resilient, won't fail if one fails)
            Promise.allSettled([
                // Booking confirmed count
                Booking.count({
                    where: {
                        ...baseWhereClause,
                        status: { [Op.in]: ['Booking Confirmed', 'Reassign'] },
                        createdBy: { [Op.ne]: 'Vendor' }
                    }
                }),
                // Not started count
                Booking.count({
                    where: {
                        ...baseWhereClause,
                        status: 'Not-Started'
                    }
                }),
                // Not contacted count
                Booking.count({
                    where: {
                        ...baseWhereClause,
                        isContacted: false,
                        status: 'Booking Confirmed',
                        createdBy: { [Op.ne]: 'Vendor' }
                    }
                }),
                // Contacted count
                Booking.count({
                    where: {
                        ...baseWhereClause,
                        isContacted: true,
                        status: 'Booking Confirmed',
                        createdBy: { [Op.ne]: 'Vendor' }
                    }
                }),
                // Started count
                Booking.count({
                    where: {
                        ...baseWhereClause,
                        status: 'Started',
                    }
                }),
                // Completed count
                Booking.count({
                    where: {
                        ...baseWhereClause,
                        status: { [Op.in]: ['Completed', 'Manual Completed'] }
                    }
                }),
                // Cancelled count
                Booking.count({
                    where: {
                        ...baseWhereClause,
                        status: 'Cancelled'
                    }
                }),
                // Vendor count
                Booking.count({
                    where: {
                        ...baseWhereClause,
                        createdBy: 'Vendor'
                    }
                }),
            ])
        ]);

        // Extract critical results
        const [bookings, totalCount] = criticalResults;



        // Extract count results with fallback to 0 if any fail
        const bookingsCount = {
            bookingConfirmed: countResults[0].status === 'fulfilled' ? countResults[0].value : 0,
            notStarted: countResults[1].status === 'fulfilled' ? countResults[1].value : 0,
            notContacted: countResults[2].status === 'fulfilled' ? countResults[2].value : 0,
            contacted: countResults[3].status === 'fulfilled' ? countResults[3].value : 0,
            started: countResults[4].status === 'fulfilled' ? countResults[4].value : 0,
            completed: countResults[5].status === 'fulfilled' ? countResults[5].value : 0,
            cancelled: countResults[6].status === 'fulfilled' ? countResults[6].value : 0,
            vendor: countResults[7].status === 'fulfilled' ? countResults[7].value : 0
        };
        // console.log("bookings-->", bookingsCount);
        const totalPages = Math.ceil(totalCount / parseInt(limit as any));
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: {
                bookings,
                bookingsCount,
                pagination: {
                    currentPage: parseInt(page as any),
                    totalPages,
                    totalCount,
                    hasNext,
                    hasPrev,
                    limit: parseInt(limit as any)
                }
            }
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
        });
    }
};

export const getRecentBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            page = 1,
            limit = 30,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        }: BookingFilterParams = req.query;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Bookings",
            });
            return;
        }
        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause: any = {
            adminId,
            createdBy: { [Op.ne]: 'Vendor' }
        };

        // Define sort order mapping
        const order: any[] = [];
        order.push([sortBy, sortOrder]);

        // Run critical queries (must succeed) and count queries (can fail gracefully) in parallel
        const [
            criticalResults,
            countResults
        ] = await Promise.all([
            // Critical queries - use Promise.all (fail fast if these fail)
            Promise.all([
                // Main bookings query
                Booking.findAll({
                    where: whereClause,
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    order,
                    limit: parseInt(limit as any),
                    offset: offset
                }),
                // Total count
                Booking.count({ where: whereClause })
            ]),
            // Count queries - use Promise.allSettled (resilient, won't fail if one fails)
            Promise.allSettled([
                // Vendor bookings count
                Booking.count({
                    where: {
                        ...whereClause,
                        createdBy: 'Vendor',
                    }
                }),
                // Website bookings count
                Booking.count({
                    where: {
                        ...whereClause,
                        type: 'Website',
                        createdBy: { [Op.ne]: 'Vendor' }
                    }
                }),
                // Manual bookings count
                Booking.count({
                    where: {
                        ...whereClause,
                        type: 'Manual',
                        createdBy: { [Op.ne]: 'Vendor' }
                    }
                })
            ])
        ]);

        // Extract critical results
        const [bookings, totalCount] = criticalResults;



        // Extract count results with fallback to 0 if any fail
        const bookingsCount = {
            vendor: countResults[0].status === 'fulfilled' ? countResults[0].value : 0,
            website: countResults[1].status === 'fulfilled' ? countResults[1].value : 0,
            manual: countResults[2].status === 'fulfilled' ? countResults[2].value : 0,
        };
        // console.log("bookings-->", bookingsCount);
        const totalPages = Math.ceil(totalCount / parseInt(limit as any));
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        res.status(200).json({
            success: true,
            message: "Recent bookings retrieved successfully",
            data: {
                bookings,
                bookingsCount,
                pagination: {
                    currentPage: parseInt(page as any),
                    totalPages,
                    totalCount,
                    hasNext,
                    hasPrev,
                    limit: parseInt(limit as any)
                }
            }
        });
    } catch (error) {
        console.error("Error fetching recent bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
        });
    }
};

export const getVendorBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;
        const {
            page = 1,
            limit = 30,
            search = '',
            status = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        }: QueryParams = req.query;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Bookings",
            });
            return;
        }

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "vendorId is required in Bookings",
            });
            return;
        }

        // Calculate offset for pagination
        const offset = (parseInt(page as any) - 1) * parseInt(limit as any);

        // Build where clause
        const whereClause: any = {
            adminId,
            vendorId,
        };

        // Add status filter if provided
        if (status) {
            whereClause.status = status;
        }

        // Build search conditions
        const searchConditions: any[] = [];
        if (search) {
            searchConditions.push(
                { bookingId: { [Op.iLike]: `%${search}%` } },
                { bookingNo: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
                { customerId: { [Op.iLike]: `%${search}%` } },
                { driverId: { [Op.iLike]: `%${search}%` } },
                { enquiryId: { [Op.iLike]: `%${search}%` } },
                { serviceId: { [Op.iLike]: `%${search}%` } },
                { vehicleId: { [Op.iLike]: `%${search}%` } },
                { pickup: { [Op.iLike]: `%${search}%` } },
                { drop: { [Op.iLike]: `%${search}%` } },
                // Numeric fields - convert to number if search is numeric
                ...(isNaN(Number(search)) ? [] : [
                    { distance: Number(search) },
                    { estimatedAmount: Number(search) },
                    { finalAmount: Number(search) }
                ])
            );
        }

        // Add search conditions to where clause if they exist
        if (searchConditions.length > 0) {
            whereClause[Op.or] = searchConditions;
        }

        // Define sort order
        const order: any[] = [];
        order.push([sortBy, sortOrder]);

        // Execute queries in parallel
        const [bookings, totalCount] = await Promise.all([
            Booking.findAll({
                where: whereClause,
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                order,
                limit: parseInt(limit as any),
                offset: offset
            }),
            Booking.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(totalCount / parseInt(limit as any));
        const hasNext = parseInt(page as any) < totalPages;
        const hasPrev = parseInt(page as any) > 1;

        res.status(200).json({
            success: true,
            message: "Vendor Bookings retrieved successfully",
            data: {
                bookings,
                pagination: {
                    currentPage: parseInt(page as any),
                    totalPages,
                    totalCount,
                    hasNext,
                    hasPrev,
                    limit: parseInt(limit as any)
                }
            },
        });
    } catch (error) {
        console.error("Error fetching vendor bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor bookings",
        });
    }
};

export const getVendorBookingsById = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const {
            page = 1,
            limit = 30,
            search = '',
            status = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        }: QueryParams = req.query;

        const offset = Number(page - 1) * Number(limit);

        const whereClause: any = {
            adminId,
            vendorId: id,
        };

        if (status) {
            whereClause.status = status;
        }

        if (search) {
            whereClause.bookingId = { [Op.iLike]: `%${search}%` };
        }

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Bookings",
            });
            return;
        }


        const [bookings, totalCount] = await Promise.all([
            Booking.findAll({
                where: whereClause,
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                order: [[sortBy, sortOrder]],
                limit: Number(limit),
                offset: offset
            }),
            Booking.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(totalCount / Number(limit));
        const hasNext = Number(page) < totalPages;
        const hasPrev = Number(page) > 1;

        res.status(200).json({
            success: true,
            message: "Vendor Bookings retrieved successfully",
            data: {
                bookings,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalCount,
                    hasNext,
                    hasPrev,
                    limit: Number(limit)
                }
            },
        });
    } catch (error) {
        console.error("Error fetching vendor bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor bookings",
        });
    }
};

export const getDriverBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const {
            page = 1,
            limit = 30,
            search = '',
            status = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        }: QueryParams = req.query;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Bookings",
            });
            return;
        }

        // Calculate offset for pagination
        const offset = Number(page - 1) * Number(limit);

        // Build where clause
        const whereClause: any = {
            adminId,
            driverId: id,
            driverAccepted: "accepted",
        };

        // Add status filter if provided
        if (status) {
            whereClause.status = status;
        }

        // Build search conditions
        const searchConditions: any[] = [];
        if (search) {
            searchConditions.push(
                { bookingId: { [Op.iLike]: `%${search}%` } },
                { bookingNo: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
                { customerId: { [Op.iLike]: `%${search}%` } },
                { enquiryId: { [Op.iLike]: `%${search}%` } },
                { serviceId: { [Op.iLike]: `%${search}%` } },
                { vehicleId: { [Op.iLike]: `%${search}%` } },
                { pickup: { [Op.iLike]: `%${search}%` } },
                { drop: { [Op.iLike]: `%${search}%` } },
                // Numeric fields - convert to number if search is numeric
                ...(isNaN(Number(search)) ? [] : [
                    { distance: Number(search) },
                    { estimatedAmount: Number(search) },
                    { finalAmount: Number(search) }
                ])
            );
        }

        // Add search conditions to where clause if they exist
        if (searchConditions.length > 0) {
            whereClause[Op.or] = searchConditions;
        }

        // Define sort order
        const order: any[] = [];
        order.push([sortBy, sortOrder]);

        // Execute queries in parallel
        const [bookings, totalCount] = await Promise.all([
            Booking.findAll({
                where: whereClause,
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                order,
                limit: Number(limit),
                offset: offset
            }),
            Booking.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(totalCount / Number(limit));
        const hasNext = Number(page) < totalPages;
        const hasPrev = parseInt(page as any) > 1;

        res.status(200).json({
            success: true,
            message: "Driver Bookings retrieved successfully",
            data: {
                bookings,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalCount,
                    hasNext,
                    hasPrev,
                    limit: Number(limit)
                }
            },
        });
    } catch (error) {
        console.error("Error fetching driver bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching driver bookings",
        });
    }
};

// Get a single booking by ID
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
    try {

        const adminId = req.body.adminId ?? req.query.adminId;

        const { id } = req.params;
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

        res.status(200).json({
            success: true,
            message: "Single Booking retrieved successfully",
            data: booking,
        });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching booking",
        });
    }
};

export const fairCalculation = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.query.adminId ?? req.body.adminId;

    const {
        // Person/route
        name,
        email,
        phone,
        pickup,
        stops = [],
        drop,
        pickupDateTime,
        dropDate,
        enquiryId,

        // Service/package
        serviceType,
        packageId,
        packageType,

        // Pricing inputs
        pricePerKm,
        extraPricePerKm,
        driverBeta,
        extraDriverBeta,
        hill,
        extraHill,
        permitCharge,
        extraPermitCharge,
        toll,
        extraToll,
        distance,

        // Vehicle/ids
        vehicleId,
        vehicleType,
        tariffId,
        offerId,

        // Payment/meta
        paymentMethod,
        paymentStatus,
        status,
        type,
        advanceAmount,
        discountAmount,
        // days,

        // Optional pre-supplied
        taxPercentage,
        taxAmount,

        noOfHours,
        hourlyPrice,
        additionalExtraPricePerKm,
    } = req.body;

    // console.log("Req body from enquiry data", req.body);

    // Basic validation
    if (!pickup) {
        res.status(400).json({
            success: false,
            message: "Pickup locations are required"
        });
        return;
    }

    if (serviceType !== "Hourly Packages" && (!pricePerKm || isNaN(Number(pricePerKm)) || Number(pricePerKm) <= 0)) {
        res.status(400).json({
            success: false,
            message: "Valid pricePerKm is required"
        });
        return;
    }




    if (serviceType === "Round trip") {
        const pickupDateTimeObj = new Date(pickupDateTime);
        const dropDateObj = new Date(dropDate);

        pickupDateTimeObj.setHours(0, 0, 0, 0);
        dropDateObj.setHours(0, 0, 0, 0);

        if (dropDateObj.getTime() < pickupDateTimeObj.getTime()) {
            res.status(400).json({
                success: false,
                message: "Drop date must be the same day or after pickup date for round trip",
            });
            return; // ✅ only return if validation fails
        }
    }


    try {
        let totalDistance: number = 0;
        let duration: string | number = "0 Hour 0 Minutes";
        let fareCalculations: ModifiedDualCalculationResult;
        // Hourly Packages branch
        let days = 1;
        let modifiedDriverBeta = driverBeta;
        let modifiedExtraDriverBeta = extraDriverBeta;
        const companyProfile = await CompanyProfile.findOne({
            where: { adminId },
        });

        const service = await Service.findOne({
            where: { name: serviceType, adminId },
        })

        if (serviceType === "Hourly Packages") {

            totalDistance = Number(distance) || 0;
            duration = `${noOfHours} ${noOfHours > 1 ? "Hours" : "Hour"}`;
            // Calculate both fares
            fareCalculations = modifiedDualFareCalculation({
                distance: Number(totalDistance) || 0,
                toll: Number(toll) || 0,
                hill: Number(hill) || 0,
                permitCharge: Number(permitCharge) || 0,
                pricePerKm: Number(pricePerKm) || 0,
                driverBeta: Number(driverBeta) || 0,
                extraToll: Number(extraToll) || 0,
                extraHill: Number(extraHill) || 0,
                extraPermitCharge: Number(extraPermitCharge) || 0,
                extraPricePerKm: Number(extraPricePerKm) || 0,
                extraDriverBeta: Number(extraDriverBeta) || 0,
                additionalExtraPricePerKm: Number(additionalExtraPricePerKm) || 0,
                isHourly: true,
                serviceType: serviceType,
                stops: stops || [],
                days: days || 1,
                hourlyPrice: Number(hourlyPrice) || 0,
                minKm: Number(service?.minKm) || 0
            });

        } else {
            // Calculate route
            // if (distance && !isNaN(distance) && Number(distance) > 0) {
            //     totalDistance = Number(distance);
            // } else {
            console.log("Route info from distance matrix >> ");
            const routeInfo = await getSegmentDistancesOptimized({
                pickupCity: pickup,
                stops: stops || [],
                dropCity: drop,
                serviceType,
            });

            const service = await Service.findOne({
                where: { adminId, name: serviceType }
            })

            console.log("Route info from distance matrix", routeInfo);

            if (typeof routeInfo === "string") {
                res.status(400).json({
                    success: false,
                    message: routeInfo
                });
                return;
            }

            const start = new Date(pickupDateTime);
            const end = new Date(dropDate);

            // Normalize to midnight
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            days = serviceType === "Round trip"
                ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                : 1;

            const minKm = service?.minKm || 0;
            totalDistance = routeInfo.distance;
            duration = routeInfo.duration;
        }

        modifiedDriverBeta = driverBeta * days;
        modifiedExtraDriverBeta = extraDriverBeta * days;

        fareCalculations = modifiedDualFareCalculation({
            distance: Number(totalDistance) || 0,
            toll: Number(toll) || 0,
            hill: Number(hill) || 0,
            permitCharge: Number(permitCharge) || 0,
            pricePerKm: Number(pricePerKm) || 0,
            driverBeta: Number(modifiedDriverBeta) || 0,
            extraToll: Number(extraToll) || 0,
            extraHill: Number(extraHill) || 0,
            extraPermitCharge: Number(extraPermitCharge) || 0,
            extraPricePerKm: Number(extraPricePerKm) || 0,
            serviceType: serviceType,
            days: days,
            stops: stops,
            extraDriverBeta: Number(modifiedExtraDriverBeta) || 0,
            isHourly: false,
            minKm: Number(service?.minKm) || 0
        });

        // }


        // Build complete booking payload expected by booking create
        const bookingPayload = {
            adminId,
            name: name ?? null,
            email: email ?? null,
            phone,
            pickup,
            stops: stops,
            drop,
            pickupDateTime: pickupDateTime,
            dropDate,
            enquiryId: enquiryId ?? null,
            serviceType,
            offerId: offerId ?? null,
            status: status || "Booking Confirmed",
            type: type || "Manual",
            paymentMethod: paymentMethod ?? "Cash",
            advanceAmount: Number(advanceAmount) || 0,
            discountAmount: Number(discountAmount) || 0,
            distance: stops.length > 0 ? totalDistance : serviceType === "Round trip" ? totalDistance * 2 : totalDistance,
            tariffId: tariffId ?? null,
            vehicleId: vehicleId ?? null,
            serviceId: service?.serviceId ?? null,
            paymentStatus: paymentStatus || "Unpaid",
            toll: toll || 0,
            extraToll: Number(extraToll) || 0,
            hill: hill || 0,
            extraHill: Number(extraHill) || 0,
            permitCharge: permitCharge || 0,
            extraPermitCharge: Number(extraPermitCharge) || 0,
            duration: duration,
            vehicleType: vehicleType ?? null,
            pricePerKm: Number(pricePerKm),
            extraPricePerKm: Number(extraPricePerKm) || 0,
            driverBeta: (driverBeta * days) || null,
            extraDriverBeta: Number(extraDriverBeta) * days || 0,
            estimatedAmount: fareCalculations.normalFare.estimatedAmount,
            finalAmount: fareCalculations.normalFare.finalAmount,
            upPaidAmount: Number(fareCalculations.normalFare.finalAmount - advanceAmount) || 0,
            days: days ?? null,
            minKm: service?.minKm || 0,
            taxPercentage: Number(service?.tax?.GST) || 0,
            taxAmount: Number(taxAmount) || 0,
            convenienceFee: companyProfile?.convenienceFee || 0,
            fareBreakdown: fareCalculations,
        };

        console.log("Booking payload for estimation", bookingPayload);

        res.status(200).json({
            success: true,
            message: "Fare estimation calculated successfully",
            data: bookingPayload,
        });
    } catch (error) {
        debug.info(`Estimation error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error calculating fare estimation",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

// Create a new booking
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;
        const {
            name,
            email,
            phone,
            pickup,
            stops,
            drop,
            pickupDateTime,
            dropDate,
            enquiryId,
            serviceType,
            offerId,
            status,
            type,
            paymentMethod,
            advanceAmount,
            discountAmount,
            distance,
            tariffId,
            vehicleId,
            serviceId,
            upPaidAmount,
            packageId,
            paymentStatus,
            toll,
            extraToll,
            hill,
            extraHill,
            permitCharge,
            extraPermitCharge,
            extraCharges,
            duration,
            vehicleType,
            pricePerKm,
            extraPricePerKm,
            driverBeta,
            extraDriverBeta,
            estimatedAmount,
            finalAmount,
            taxPercentage,
            taxAmount,
            fareBreakdown,
            convenienceFee,
            createdBy
        } = req.body;

        console.log("Vendor create booking with calculation (precomputed) request:", req.body);
        console.log("Vendor ID:", vendorId);

        // Basic validations
        const requiredFields = [
            "name",
            "phone",
            "pickup",
            "pickupDateTime",
            "serviceType",
            "vehicleType",
        ];
        const missingFields = requiredFields.filter((field) => !req.body[field]);
        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            });
            return;
        }

        let days = 1;


        const pickupDateTimeObj = new Date(pickupDateTime);
        if (isNaN(pickupDateTimeObj.getTime())) {
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

        days = serviceType === "Round trip"
            ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 1;

        const startOtp = await customOTPGenerator();
        const endOtp = await customOTPGenerator();

        const getService = await Service.findOne({
            where: { name: serviceType, adminId },
        });

        if (!getService) {
            res.status(400).json({
                success: false,
                message: "Invalid service type",
            });
            return;
        }

        // Validate service ID
        let service = getService?.serviceId;
        const companyProfile = await CompanyProfile.findOne({ where: { adminId } });

        // Build booking data from precomputed fields
        const bookingData = {
            adminId,
            vendorId: undefined,
            name,
            email,
            stops,
            phone,
            pickup,
            drop,
            pickupDateTime: pickupDateTimeObj,
            dropDate: dropDateObj,
            enquiryId,
            serviceType,
            days: days.toString(),
            tariffId: tariffId ?? null,
            serviceId: serviceId ?? null,
            vehicleId,
            // status: "Booking Confirmed",
            type: type || "Manual",
            distance: Math.round(distance || 0),
            estimatedAmount: Math.ceil(estimatedAmount || 0),
            discountAmount: discountAmount || 0,
            finalAmount: Math.ceil(finalAmount || 0),
            advanceAmount: advanceAmount,
            upPaidAmount: upPaidAmount,
            packageId: packageId ?? null,
            offerId: offerId ?? null,
            paymentMethod,
            minKm: getService?.minKm || 0,
            paymentStatus: paymentStatus || "Unpaid",
            createdBy: "Admin" as const,
            extraToll: extraToll || 0,
            extraHill: extraHill || 0,
            extraPermitCharge: extraPermitCharge || 0,
            pricePerKm: pricePerKm || 0,
            extraPricePerKm: extraPricePerKm || 0,
            taxPercentage: Number(taxPercentage) || Number(getService?.tax?.GST) || 0,
            taxAmount: taxAmount || Math.ceil((taxPercentage || getService?.tax?.GST) * (estimatedAmount || 0) / 100),
            driverBeta: driverBeta || undefined,
            extraDriverBeta: extraDriverBeta || 0,
            duration: duration ?? null,
            extraCharges: extraCharges ?? {
                "Toll": toll + extraToll || 0,
                "Hill": hill + extraHill || 0,
                "Permit Charge": permitCharge + extraPermitCharge || 0,
                "Parking Charge": 0,
                "Pet Charge": 0,
                "Waiting Charge": 0,
            },
            vehicleType: vehicleType,
            startOtp,
            endOtp,
            normalFare: fareBreakdown?.normalFare || null,
            modifiedFare: fareBreakdown?.modifiedFare || null,
            convenienceFee: convenienceFee || null,
            adminContact: String(companyProfile?.phone[0]) ?? "9876543210"
        };

        console.log("Booking data: >> ", bookingData);

        const newBooking = await Booking.create(bookingData);

        // bookingId
        let cleanedPhone = phone.replace(/^\+?91|\D/g, "");
        let phoneNumber = cleanedPhone.slice(5, 10);
        newBooking.bookingId = `SLTB${phoneNumber}${newBooking.id}`;
        await newBooking.save();

        // Notifications and emails remain as in existing implementation
        // (No changes below here)

        let customer = await Customer.findOne({
            where: {
                phone: {
                    [Op.iLike]: `%${phone}%`
                },
            }
        });

        if (!customer) {
            console.log(`${phone} customer not found, creating new customer`);
            const t = await sequelize.transaction();
            customer = await Customer.create({
                adminId,
                name,
                email,
                phone: `91 ${cleanedPhone}`,
                createdBy: "Vendor",
                bookingCount: 1,
                totalAmount: finalAmount || 0,
            }, { transaction: t });

            customer.customerId = `SLTC${phoneNumber}${customer.id}`;
            const { code: referralCode } = generateReferralCode({ userId: customer.id });
            customer.referralCode = referralCode;
            await customer.save({ transaction: t });

            const wallet = await CustomerWallet.create({
                adminId,
                customerId: customer.customerId,
                balance: 0,
                startAmount: 0,
            }, { transaction: t });

            wallet.walletId = `cus-wlt-${wallet.id}`;
            await wallet.save({ transaction: t });

            customer.walletId = wallet.walletId;
            await customer.save({ transaction: t }); // ✅ save only once, inside transaction

            await t.commit();
        } else {
            await customer.update({
                bookingCount: customer.bookingCount + 1,
                totalAmount: customer.totalAmount + Number(finalAmount || 0),
            });
        }

        newBooking.customerId = customer.customerId;
        if (!name) newBooking.name = customer.customerId;
        await newBooking.save();

        if (enquiryId !== null && enquiryId !== undefined && enquiryId !== "") {
            const enquiry = await Enquiry.findOne({ where: { enquiryId } });
            if (enquiry) {
                await enquiry.update({
                    status: "Booked",
                });
            }
        }


        const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
        const notification = {
            adminId,
            vendorId: createdBy === "Vendor" ? vendorId : null,
            title: `New ${createdBy === "Vendor" ? "Vendor" : "Admin"} Booking created`,
            // description: `Booking Id: ${newBooking.bookingId} , Customer Name: ${name} , Phone: ${phone}`,
            description: `Booking #${newBooking.bookingId} | Customer: ${name} | Phone: ${phone} | From: ${pickup} | To: ${drop ?? 'N/A'}`,
            type: "booking",
            read: false,
            date: new Date(),
            time: time,
        };

        const adminNotification = {
            adminId,
            vendorId: null,
            title: `New ${createdBy === "Vendor" ? "Vendor" : "Admin"} Booking created`,
            // description: `Booking Id: ${newBooking.bookingId} , Customer Name: ${name} , Phone: ${phone}`,
            description: `Booking #${newBooking.bookingId} | Customer: ${name} | Phone: ${phone} | From: ${pickup} | To: ${drop ?? 'N/A'}`,
            type: "booking",
            read: false,
            date: new Date(),
            time: time,
        };


        const adminNotificationResponse = await createNotification(adminNotification as any);

        if (createdBy === "Vendor") {
            const notificationResponse = await createNotification(notification as any);
            if (notificationResponse.success) {
                sendNotification(vendorId, {
                    notificationId: notificationResponse.notificationId ?? undefined,
                    title: `New Vendor Booking created`,
                    description: `Booking Id: ${newBooking.bookingId} , Customer Name: ${name} , Phone: ${phone}`,
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
                title: `New ${createdBy === "Vendor" ? "Vendor" : "Admin"} Booking created`,
                // description: `Booking Id: ${newBooking.bookingId} , Customer Name: ${name} , Phone: ${phone}`,
                description: `Booking #${newBooking.bookingId} | Customer: ${name} | Phone: ${phone} | From: ${pickup} | To: ${drop ?? 'N/A'}`,
                type: "booking",
                read: false,
                date: new Date(),
                time: time,
            });
        }
        const IST_OFFSET = 5.5 * 60 * 60 * 1000;
        // Send email to customer
        try {
            const emailData = {
                bookingId: newBooking.bookingId,
                bookingDate: new Date(newBooking.createdAt).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                fullName: name,
                mobileNo: phone,
                email: email,
                pickup: pickup,
                drop: drop ?? null,
                pickupDate: new Date(pickupDateTime).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                pickupTime: new Date(pickupDateTime).toLocaleString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                dropDate: dropDateObj ? new Date(dropDateObj).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : null,
                vehicleType: vehicleType,
                serviceType: serviceType,
                estimatedAmount: fareBreakdown?.modifiedFare?.estimatedAmount,
                discountAmount: fareBreakdown?.modifiedFare?.discountAmount || discountAmount,
                taxAmount: taxAmount,
                toll: fareBreakdown?.modifiedFare?.toll,
                hill: fareBreakdown?.modifiedFare?.hill,
                permitCharge: fareBreakdown?.modifiedFare?.permitCharge,
                finalAmount: fareBreakdown?.modifiedFare?.finalAmount,
                advanceAmount: advanceAmount,
                upPaidAmount: upPaidAmount,
                paymentMethod: paymentMethod,
            };

            // console.log("emailData ---> ", emailData);
            const emailResponse = await bookingConfirm(emailData);
            // console.log("emailResponse ---> ", emailResponse);
            if (emailResponse.status === 200) {
                console.log(`Email sent successfully to ${emailResponse.sentTo}`);
            } else {
                console.log("Email not sent");
            }
        } catch (error) {
            console.error("Error sending email:", error);
        }

        // Send Whatsapp to customer
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
                    { type: "text", text: newBooking.modifiedFare?.distance || newBooking.distance.toString() },
                    { type: "text", text: newBooking.modifiedFare?.minKm || newBooking.minKm.toString() },
                    { type: "text", text: newBooking.modifiedFare?.pricePerKm || newBooking.pricePerKm.toString() },
                    { type: "text", text: newBooking.modifiedFare?.driverBeta || newBooking.driverBeta.toString() },
                    // { type: "text", text: newBooking.extraCharges["Toll"].toString() ?? "0" },
                    { type: "text", text: newBooking.modifiedFare["hill"].toString() ?? "0" },
                    { type: "text", text: newBooking.modifiedFare["permitCharge"].toString() ?? "0" },
                    { type: "text", text: newBooking.modifiedFare?.estimatedAmount.toString() || newBooking.estimatedAmount.toString() },
                    { type: "text", text: newBooking.taxAmount.toString() },
                    { type: "text", text: newBooking.modifiedFare?.discountAmount.toString() || newBooking.discountAmount.toString() },
                    { type: "text", text: newBooking.modifiedFare?.finalAmount.toString() || newBooking.finalAmount.toString() },
                    { type: "text", text: companyProfile?.phone[0] ?? "9876543210" },
                    { type: "text", text: companyProfile?.website ?? "https://silvertaxi.in" },
                ],
                templateName: "bookingConfirmedAcknowledgement"
            }

            publishNotification("notification.whatsapp", waCustomerPayload)
                .catch((err) => console.log("❌ Failed to publish Whatsapp notification", waCustomerPayload.templateName, err));

        } catch (error) {
            console.error("Error sending admin create booking Whatsapp message:", error);
        }

        // Send SMS to customer
        try {
            const smsResponse = await sms.sendTemplateMessage({
                mobile: Number(cleanedPhone),
                template: "customer_booking_acknowledgement",
                data: {
                    contact: `${(companyProfile?.name ?? "silvercalltaxi.in")}`,
                    location: `${pickup}${drop ? `→${drop}` : ""}`,
                    pickupDateTime: new Date(
                        new Date(pickupDateTime).getTime() - IST_OFFSET
                    ).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    }),
                    serviceType: `${newBooking.serviceType === "Round trip" ? `${newBooking.serviceType} day(s)${newBooking.days}` : newBooking.serviceType}`,
                    distance: newBooking.modifiedFare?.distance,
                    minKm: newBooking.modifiedFare?.minKm,
                    pricePerKm: newBooking.modifiedFare?.pricePerKm,
                    driverBeta: newBooking.modifiedFare?.driverBeta,
                    hill: newBooking.modifiedFare["hill"].toString() ?? "0",
                    permitCharges: newBooking.modifiedFare["permitCharge"].toString() ?? "0",
                    estimatedAmount: newBooking.modifiedFare?.estimatedAmount.toString(),
                    taxAmount: newBooking.taxAmount.toString(),
                    discountAmount: newBooking.modifiedFare?.discountAmount.toString() || newBooking.discountAmount,
                    finalAmount: newBooking.modifiedFare?.finalAmount.toString(),
                    contactNumber: companyProfile?.phone[0] ?? "9876543210",
                    website: companyProfile?.website ?? "https://silvertaxi.in"
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


        res.status(201).json({
            success: true,
            message: `${serviceType} ${createdBy === "Vendor" ? "Vendor" : "Admin"} booking created successfully`,
            data: newBooking,
        });

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
            error: error,
        });
    }
};

export const assignDriver = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { bookingId, driverId } = req.body;

    if (!adminId) {
        res.status(400).json({
            success: false,
            message: 'adminId is required',
        });
        return;
    }

    if (!bookingId) {
        res.status(400).json({
            success: false,
            message: 'bookingId is required',
        });
        return;
    }

    if (!driverId) {
        res.status(400).json({
            success: false,
            message: 'driverId is required',
        });
        return;
    }

    const requestSentTime = dayjs().toDate();
    log.info(`Assign driver for adminId: ${adminId}, bookingId: ${bookingId}, driverId: ${driverId} entry $>>`);

    const transaction = await sequelize.transaction();

    try {
        // Find booking with lock to prevent concurrent modifications
        const booking = await Booking.findOne({
            where: { bookingId, adminId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!booking) {
            await transaction.rollback();
            debug.info(`Assign driver | Booking not found: bookingId=${bookingId}, adminId=${adminId}`);
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        // Validate booking status - don't allow assignment if booking is completed or cancelled
        if (booking.status === 'Completed' || booking.status === 'Cancelled' || booking.status === 'Manual Completed') {
            await transaction.rollback();
            res.status(400).json({
                success: false,
                message: `Cannot assign driver to a ${booking.status.toLowerCase()} booking`,
            });
            return;
        }

        // Find driver
        const driver = await Driver.findOne({
            where: { driverId, adminId },
            transaction,
        });

        if (!driver) {
            await transaction.rollback();
            debug.info(`Assign driver | Driver not found: driverId=${driverId}, adminId=${adminId}`);
            res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
            return;
        }

        // Check if driver is active
        if (!driver.isActive) {
            await transaction.rollback();
            res.status(400).json({
                success: false,
                message: 'Cannot assign an inactive driver',
            });
            return;
        }

        // Check if driver is already assigned to another active booking
        const existingBooking = await Booking.findOne({
            where: {
                adminId,
                driverId,
                driverAccepted: { [Op.in]: ['accepted'] },
                status: { [Op.in]: ['Not-Started', 'Started'] },
                bookingId: { [Op.ne]: bookingId },
            },
            transaction,
        });

        if (existingBooking) {
            await transaction.rollback();
            res.status(400).json({
                success: false,
                message: 'Driver is already assigned to another active booking',
            });
            return;
        }

        // Handle previous driver unassignment
        const previousDriverId = booking.driverId;
        if (previousDriverId && previousDriverId !== driverId) {
            const previousDriver = await Driver.findOne({
                where: { driverId: previousDriverId, adminId },
                transaction,
            });

            if (previousDriver) {
                previousDriver.assigned = false;
                await previousDriver.save({ transaction });
            }
        }

        // Assign the new driver with driverName and driverPhone
        const updateData: any = {
            driverId,
            driverName: driver.name,
            driverPhone: driver.phone,
            driverAccepted: 'pending',
            assignAllDriver: false,
            requestSentTime,
        };

        // Only update status if it's not already in a valid state
        if (booking.status === 'Not-Started' || booking.status === 'Reassign') {
            updateData.status = 'Booking Confirmed';
        }

        await booking.update(updateData, { transaction });

        // Commit transaction
        await transaction.commit();

        // Persist driver notification and push via FCM (non-blocking)
        try {
            const bookingAssignNotification = await createDriverNotification({
                title: "New Booking Arrived",
                message: `Mr ${driver.name}, you have received a new booking.`,
                ids: {
                    adminId: booking.adminId,
                    driverId: driver.driverId,
                    bookingId: booking.bookingId,
                },
                type: "booking",
            });

            // Get FCM token from Redis
            const redisFcmToken = booking.adminId
                ? await getDriverFcmToken(String(booking.adminId), String(driver.driverId))
                : null;
            const targetFcmToken = redisFcmToken || driver.fcmToken;

            if (bookingAssignNotification && targetFcmToken && targetFcmToken.trim() !== '') {
                const tokenResponse = await sendToSingleToken(targetFcmToken, {
                    ids: {
                        adminId: booking.adminId,
                        bookingId: booking.bookingId,
                        driverId: driver.driverId,
                    },
                    data: {
                        title: 'New Booking Arrived',
                        message: `Mr ${driver.name}, you have received a new booking.`,
                        type: "new-booking",
                        channelKey: "booking_channel",
                    }
                });
                debug.info(`FCM Notification Response: ${tokenResponse}`);
            } else {
                debug.info(`Driver notification not created or FCM token missing for driverId=${driver.driverId}`);
            }
        } catch (err: any) {
            // Log but don't fail the request if notification fails
            debug.info(`FCM Notification Error: ${err}`);
        }

        log.info(`Assign driver for adminId: ${adminId}, bookingId: ${bookingId}, driverId: ${driverId} exit <<$`);

        res.status(200).json({
            success: true,
            message: 'Driver assigned successfully',
            data: booking,
        });
    } catch (error) {
        await transaction.rollback();
        debug.info(`Assign driver error: adminId=${adminId}, bookingId=${bookingId}, driverId=${driverId}, error=${error}`);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
};

export const assignAllDrivers = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { id } = req.params;

    log.info(`Assign all drivers for adminId: ${adminId}, bookingId: ${id} entry >>`);

    try {
        const booking = await Booking.findOne({
            where: { bookingId: id, adminId },
        });

        if (!booking) {
            debug.info(`Assign all drivers | Booking not found: bookingId=${id}, adminId=${adminId}`);
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const requestSentTime = dayjs().toDate();

        // Unassign current driver if any
        if (booking.driverId) {
            const previousDriver = await Driver.findOne({
                where: { driverId: booking.driverId, adminId },
            });
            if (previousDriver) await previousDriver.update({ assigned: false });
        }

        const normalizedAdminId = adminId ? String(adminId) : "";
        let broadcastDrivers: Array<{ driverId: string; adminId: string; name: string; fcmToken?: string | null }> = [];

        if (normalizedAdminId) {
            const redisDrivers = await getAllRedisDrivers(normalizedAdminId);
            broadcastDrivers = redisDrivers
                .filter(driver => driver && driver.isActive)
                .map(driver => ({
                    driverId: driver.driverId,
                    adminId: driver.adminId,
                    name: driver.name,
                    fcmToken: driver.fcmToken,
                }));
        }

        if (!broadcastDrivers.length) {
            const dbDrivers = await Driver.findAll({
                where: { adminId, isActive: true },
                attributes: ['driverId', 'name', 'adminId'],
            });

            // Enrich with FCM tokens from Redis
            broadcastDrivers = await Promise.all(
                dbDrivers.map(async (driver) => {
                    const redisFcmToken = driver.adminId
                        ? await getDriverFcmToken(String(driver.adminId), String(driver.driverId))
                        : null;
                    return {
                        driverId: driver.driverId,
                        adminId: driver.adminId,
                        name: driver.name,
                        fcmToken: redisFcmToken,
                    };
                })
            );
        }

        if (!broadcastDrivers.length) {
            return res.status(404).json({
                success: false,
                message: "No active drivers found",
            });
        }

        // Update booking to indicate broadcast
        await booking.update({
            driverId: null,
            driverAccepted: "pending",
            assignAllDriver: true,
            requestSentTime,
            status: "Booking Confirmed",
        });

        // Collect all valid FCM tokens and driver data
        const validDrivers = broadcastDrivers.filter(driver => driver.fcmToken && driver.fcmToken.trim() !== '');
        const fcmTokens: string[] = [];
        const driverData: any[] = [];

        // Collect tokens and driver data
        for (const driver of validDrivers) {
            if (driver.fcmToken) {
                fcmTokens.push(driver.fcmToken);
            }
            driverData.push({
                driverId: driver.driverId,
                adminId: booking.adminId,
                name: driver.name,
            });
        }

        // Send batch notification directly (without queue)
        if (fcmTokens.length > 0) {
            // Prepare bulk notification data
            const notificationData = driverData
                .filter(driver => driver.driverId && driver.adminId)
                .map(driver => ({
                    title: "New Booking Arrived",
                    message: `Mr ${driver.name || 'Driver'}, you have received a new booking.`,
                    driverId: driver.driverId,
                    adminId: driver.adminId,
                    route: "",
                    type: "booking",
                    read: false,
                    date: new Date(),
                    time: new Date().toLocaleTimeString(),
                }));

            // Prepare booking log data for parallel upserts
            const bookingLogData = driverData
                .filter(driver => booking.bookingId && driver.driverId && driver.adminId)
                .map(driver => ({
                    adminId: driver.adminId,
                    driverId: driver.driverId,
                    bookingId: booking.bookingId,
                    requestSendTime: requestSentTime,
                }));

            // Execute all operations in parallel
            const [notificationResult, logResults, batchResult] = await Promise.allSettled([
                // Bulk create notifications
                notificationData.length > 0
                    ? DriverNotification.bulkCreate(notificationData, {
                        returning: true,
                    }).then(notifications => {
                        // Update notifyId for each notification in parallel
                        return Promise.all(
                            notifications.map(async (notif) => {
                                if (!notif.notifyId) {
                                    notif.notifyId = `notify-${notif.id}`;
                                    await notif.save();
                                }
                                return notif;
                            })
                        );
                    })
                    : Promise.resolve([]),

                // Parallel upserts for booking logs
                Promise.allSettled(
                    bookingLogData.map(logData =>
                        DriverBookingLog.upsert(logData).catch((err) => {
                            debug.info(`Failed to log for driver ${logData.driverId}:`, err);
                            return null;
                        })
                    )
                ),

                // Batch send FCM notifications
                sendBatchNotifications(fcmTokens, {
                    title: "New Booking Arrived",
                    message: "You have received a new booking.",
                    ids: {
                        adminId: booking.adminId,
                        bookingId: booking.bookingId,
                    },
                    data: {
                        title: "New Booking Arrived",
                        message: "You have received a new booking.",
                        type: "new-booking",
                        channelKey: "booking_channel",
                        bookingId: String(booking.bookingId),
                    },
                }),
            ]);

            // Log results
            if (notificationResult.status === 'fulfilled') {
                debug.info(`Bulk created ${notificationResult.value.length} notifications`);
            } else {
                debug.info(`Failed to bulk create notifications:`, notificationResult.reason);
            }

            if (logResults.status === 'fulfilled') {
                const successfulLogs = logResults.value.filter(r => r.status === 'fulfilled').length;
                debug.info(`Created ${successfulLogs} booking logs`);
            }

            if (batchResult.status === 'fulfilled') {
                const result = batchResult.value;
                debug.info(`Batch FCM notification sent: ${result.successCount} success, ${result.failureCount} failed`);
                if (result.invalidTokens && result.invalidTokens.length > 0) {
                    debug.info(`Invalid tokens detected: ${result.invalidTokens.length}`);
                }
            } else {
                debug.info(`Failed to send batch FCM notifications:`, batchResult.reason);
            }
        }

        log.info(`Assign all drivers for adminId: ${adminId}, bookingId: ${id} completed <<`);

        return res.status(200).json({
            success: true,
            message: `Batch notifications sent to ${validDrivers.length} drivers`,
            booking,
        });
    } catch (error) {
        debug.info(`Assign all drivers | Error: ${error}`);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};


// Update a booking
export const updateBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params; // Get booking ID from request parameters
        const {
            name, email, phone,
            pickup, drop, pickupDateTime,
            dropDate, enquiryId,
            serviceType,
            serviceId,
            offerId,
            status, type,
            tripCompletedDistance,
            tripCompletedTaxAmount,
            tripCompletedEstimatedAmount,
            tripCompletedPrice,
            tripCompletedDuration,
            tripCompletedFinalAmount,
            tripCompletedDriverBeta,
            driverCharges,
            extraCharges,
            paymentMethod,
            advanceAmount,
            discountAmount,
            estimatedAmount,
            startOdometerValue,
            endOdometerValue,
            finalAmount,
            upPaidAmount,
            distance,
            vehicleId,
            packageId, packageType,
            paymentStatus, createdBy,
            toll,
            hill,
            permitCharge,
            pricePerKm,
            taxPercentage,
            taxAmount,
            driverBeta,
            duration,
            isContacted,

            isManualCompleted
        } = req.body;

        // console.log("req.body ---> ", req.body);

        // Validate required fields for update
        const requiredFields = ['phone', 'pickup', 'pickupDateTime', 'serviceType', 'vehicleId'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
            return;
        }

        // Validate booking exists
        const booking = await Booking.findOne({ where: { bookingId: id, adminId } });
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }

        if (booking.status === "Completed") {
            res.status(400).json({
                success: false,
                message: "Cannot update a completed booking",
            });
            return;
        }

        // Validate dates
        const pickupDateTimeObj = new Date(pickupDateTime);
        if (isNaN(pickupDateTimeObj.getTime())) {
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
                res.status(400).json({
                    success: false,
                    message: "Invalid dropDate format",
                });
                return;
            }
        }

        const getService = await Service.findOne({
            where: { name: serviceType, adminId }
        });

        if (!getService) {
            res.status(400).json({
                success: false,
                message: "Invalid service type",
            });
            return;
        }

        // Validate service ID
        const service = getService?.serviceId;

        // Validate tariff exists
        let tariff: Tariff | null = null;
        if (serviceId) {
            tariff = await Tariff.findOne(
                {
                    where: { vehicleId, serviceId, adminId },
                    include: [
                        { model: Vehicle, as: 'vehicles' }
                    ]
                }
            );
        } else {
            tariff = await Tariff.findOne(
                {
                    where: { vehicleId, serviceId: service, adminId },
                    include: [
                        { model: Vehicle, as: 'vehicles' }
                    ]
                }
            );
        }


        let convertedDistance = Math.round(Number(distance));
        let convertedDuration = duration;

        if (packageId) {

            let [type, name, recordId] = packageId.split("-");

            switch (type) {
                case "hr":
                    const hourlyPackage = await HourlyPackage.findOne({ where: { id: recordId, adminId } });
                    if (hourlyPackage) {
                        convertedDistance = Number(hourlyPackage.distanceLimit);
                        convertedDuration = `${hourlyPackage.noOfHours} Hours`;
                    }
                    break;
                case "dl":
                    const dayPackage = await DayPackage.findOne({ where: { id: recordId, adminId } });
                    if (dayPackage) {
                        convertedDistance = Number(dayPackage.distanceLimit);
                        convertedDuration = `${dayPackage.noOfDays} Days`;
                    }
                    break;
            }
        }

        const companyCommissionPercentage = booking.driverCommissionBreakup.commissionTaxPercentage
        const driverCommissionRate = booking.driverCommissionBreakup.commissionPercentage
        const driverDeduction = await driverCommissionCalculation({
            commissionTaxPercentage: companyCommissionPercentage,
            normalFare: booking.normalFare,
            modifiedFare: booking.modifiedFare,
            gst: tripCompletedTaxAmount || 0,
            extraToll: booking.extraToll || 0,
            extraHill: booking.extraHill || 0,
            extraPermitCharge: booking.extraPermitCharge || 0,
            extraDriverBeta: booking.extraDriverBeta || 0,
            tripCompletedDistance,
            driverCommissionPercentage: booking.driverCommissionBreakup.commissionPercentage || 0,
            pricePerKm: booking.pricePerKm,
            extraPricePerKm: booking.extraPricePerKm,
            extraCharges: extraCharges,
            driverCharges: driverCharges,
            createdBy: booking.createdBy,
            convenienceFee: booking.convenienceFee,
            booking: booking,
            serviceType, // NEW: to decide calculation type
            driverCommissionRate,
            companyCommissionPercentage
        })

        // Update booking data
        const bookingData = {
            name,
            email,
            phone,
            pickup,
            drop,
            pickupDateTime: pickupDateTimeObj,
            dropDate: dropDateObj,
            enquiryId,
            serviceType,
            tariffId: tariff?.tariffId,
            status: isManualCompleted ? "Manual Completed" : status || booking.status, // Keep existing status if not provided
            type: type || booking.type, // Keep existing type if not provided
            distance: Number(convertedDistance),
            estimatedAmount: Number(estimatedAmount),
            discountAmount: Number(discountAmount),
            finalAmount: Number(finalAmount),
            advanceAmount: Number(advanceAmount) ?? 0,
            upPaidAmount: Number(upPaidAmount) ?? 0,
            offerId,
            vehicleId,
            paymentMethod,
            paymentStatus: paymentStatus || booking.paymentStatus, // Keep existing payment status if not provided
            createdBy: createdBy ?? "Admin",
            packageId,
            toll: toll ?? null,
            hill: hill ?? null,
            permitCharge: permitCharge ?? null,
            pricePerKm: pricePerKm ?? null,
            taxPercentage: taxPercentage ?? null,
            taxAmount: taxAmount ?? null,
            driverBeta: driverBeta ?? null,
            duration: convertedDuration,
            driverDeductionAmount: driverDeduction.deductionAmount,
            driverCommissionBreakup: driverDeduction.driverCommissionBreakup,
            tripCompletedDistance: tripCompletedDistance,
            tripCompletedTaxAmount: tripCompletedTaxAmount,
            tripCompletedEstimatedAmount: tripCompletedEstimatedAmount,
            tripCompletedPrice: tripCompletedPrice,
            tripCompletedDuration: tripCompletedDuration,
            tripCompletedFinalAmount: tripCompletedFinalAmount,
            tripCompletedDriverBeta: tripCompletedDriverBeta,
            driverCharges: driverCharges,
            extraCharges: extraCharges,
            isContacted: isContacted ?? false,

            startOdometerValue: startOdometerValue ?? 0,
            endOdometerValue: endOdometerValue ?? 0
        };

        console.log("Updated booking data $>>", bookingData);



        await booking.update(bookingData); // Update the booking
        await booking.save();

        if (isManualCompleted && booking.driverId) {
            const driver = await Driver.findOne({ where: { driverId: booking.driverId, adminId } });
            if (driver) {
                await driver.update({ assigned: false });
            }
        }

        res.status(200).json({
            success: true,
            message: "Booking updated successfully",
            data: booking,
        });

    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

export const manualBookingComplete = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params; // Get booking ID from request parameters
        const {
            startOdometerValue,
            endOdometerValue,
            tripStartedTime,
            tripCompletedTime,
            isManualCompleted,
            driverCharges,
            extraCharges,
            tripCompletedPaymentMethod,
            paymentMethod
        } = req.body;

        // console.log("req.body ---> ", req.body);

        // Validate required fields for update
        const requiredFields = ['startOdometerValue', 'endOdometerValue'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
            return;
        }

        // Validate booking exists
        const booking = await Booking.findOne({ where: { bookingId: id, adminId } });
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }


        await booking.update({
            startOdometerValue,
            endOdometerValue,
            tripStartedTime: new Date(tripStartedTime),
            tripCompletedTime: new Date(tripCompletedTime),
            driverCharges: driverCharges || {},
            extraCharges: extraCharges || {},
        }); // Update the booking
        await booking.save();

        const odoCalRes: any = await odoCalculation(id);
        console.warn("Response from odoCalculation in tripend", odoCalRes);

        if (isManualCompleted && booking.driverId) {
            const driver = await Driver.findOne({ where: { driverId: booking.driverId, adminId } });
            if (driver) {
                await driver.update({ assigned: false });
            }
        }
        // ===============================X==================x=========================X===========================//

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        let driver: Driver | null = null;
        if (booking.driverId) {
            driver = await Driver.findOne({
                where: { driverId: booking.driverId, adminId }
            });
        }

        if (!driver) {
            res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
            return;
        }


        let customer: Customer | null = null;
        if (booking.customerId) {
            customer = await Customer.findOne({
                where: { customerId: booking.customerId, adminId }
            });
        }


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
                driverId: driver.driverId
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
        await booking.update({
            status: 'Manual Completed',
            paymentStatus: 'Paid',
            tripCompletedPaymentMethod: "Cash",
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
            debitedId: driver.driverId ?? "",
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

        let invoiceResponse: InvoiceResponse | null = null;
        console.log(
            booking.driverCharges,
            booking.extraCharges
        )
        try {
            invoiceResponse = await createInvoice({
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
                    ...booking.extraCharges,
                    ...booking.driverCharges,
                },
                totalAmount: booking.tripCompletedFinalAmount,
                createdBy: booking.createdBy,
                status: booking.paymentStatus,
                paymentMethod: booking.paymentMethod,
                paymentDetails: booking.paymentMethod,
                note: "This invoice is auto-generated and does not require a signature.",
            }, booking.bookingId);

            debug.info("invoice response >> ", invoiceResponse.success);
        } catch (error) {
            debug.info("Error in invoice creation >> ", error);
        }

        const customerCleanedPhone = booking.phone.replace(/^\+?91|\D/g, '');
        const driverCleanedPhone = driver.phone.replace(/^\+?91|\D/g, '');

        const companyProfile = await CompanyProfile.findOne({ where: { adminId } });

        let vendor: Vendor | null = null;
        if (booking.createdBy === "Vendor") {
            vendor = await Vendor.findOne({ where: { adminId, vendorId: booking.vendorId } });
        }

        // SMS Send
        /* try {
            const smsResponse = await sms.sendTemplateMessage({
                mobile: Number(cleanedPhone),
                template: "trip_completed",
                data: {
                    contactNumber: companyProfile?.phone[0] ?? "9876543210",
                    website: companyProfile?.website ?? "https://silvercalltaxi.in/",
                }
            })
            if (smsResponse) {
                debug.info("Trip completed SMS sent successfully");
            } else {
                debug.info("Trip completed SMS not sent");
            }
        } catch (error) {
            debug.info(`Error sending Trip completed SMS: ${error}`);
        } */

        // Send whatsapp message
        /* try {
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
                    { type: "text", text: `${companyProfile?.website ?? "silvercalltaxi.in"}booking-invoice?id=${invoice?.data?.invoiceNo}` },
                ],
                templateName: "tripCompleted"
            }

            publishNotification("notification.whatsapp", waCustomerPayload)
                .catch((err) => console.log("❌ Failed to publish Whatsapp notification", err));
        } catch (error) {
            console.error("Error sending whatsapp trip completed :", error);
        } */

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

    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;

        const booking = await Booking.findOne({
            where: { bookingId: id, adminId }
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }

        if (booking.status === 'Started') {
            res.status(400).json({
                success: false,
                message: "Cannot delete a booking that has already started",
            });
            return;
        }

        if (booking.driverId !== null && booking.driverId !== undefined && booking.driverId !== "") {
            const driver = await Driver.findOne({
                where: { driverId: booking.driverId }
            });

            if (driver) {
                driver.assigned = false;
                driver.bookingCount = Number(driver.bookingCount) - 1;
                await driver.save();
            }
        }

        await booking.destroy();

        res.status(200).json({
            success: true,
            message: "Booking deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting booking",
        });
    }
};


export const toggleChanges = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const { paymentMethod, paymentStatus, status, contacted } = req.body;

        // console.log("req ---> ", req.body)

        const booking = await Booking.findOne({ where: { bookingId: id, adminId } });
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }

        if (paymentMethod) {
            await booking.update({ paymentMethod });
        }
        if (paymentStatus) {
            await booking.update({ paymentStatus });
        }
        if (status) {
            if (status === "Completed") {
                const driverId = booking.driverId;
                if (driverId) {
                    const driver = await Driver.findOne({
                        where: { driverId, adminId }
                    });
                    if (driver) {
                        driver.assigned = false
                        driver.bookingCount += 1
                        driver.totalEarnings = String(Number(driver.totalEarnings) + (Number(booking.tripCompletedFinalAmount || booking.finalAmount) - Number(booking.driverDeductionAmount ?? 0)));
                        await driver.save();
                        await booking.update({ status });
                        const extraChargesValue = sumSingleObject(booking.extraCharges);
                        const driverCommission = await commissionCalculation({
                            debitedId: driverId,
                            amount: booking.driverDeductionAmount + extraChargesValue,
                            serviceId: booking.serviceId,
                            debitedBy: "Driver",
                            bookingId: booking.bookingId
                        });

                        let vendorCommission: any = null;
                        if (booking.vendorId !== null && booking.vendorId !== undefined && booking.vendorId !== "") {
                            vendorCommission = await commissionCalculation({
                                debitedId: booking.vendorId,
                                amount: booking.vendorDeductionAmount,
                                serviceId: booking.serviceId,
                                debitedBy: "Vendor",
                                bookingId: booking.bookingId,
                                creditAmount: booking.vendorCommission + extraChargesValue
                            });
                        }
                        // console.log("vendorCommission ---> ", vendorCommission);
                        // console.log("driverCommission ---> ", driverCommission);
                    } else {
                        res.status(404).json({
                            success: false,
                            message: "Driver not found",
                        });
                        return;
                    }
                } else {
                    res.status(404).json({
                        success: false,
                        message: "Check the driver is not assigned",
                    });
                    return;
                }
            } else if (status === "Cancelled") {
                const driverId = booking.driverId;
                if (driverId) {
                    const driver = await Driver.findOne({
                        where: { driverId, adminId }
                    });

                    if (driver) {
                        driver.assigned = false
                        await driver.save();
                        await booking.update({ status });

                        const bookingAssignNotification = await createDriverNotification({
                            title: "Booking cancelled by admin",
                            message: `Mr ${driver.name}, Your booking has been cancelled by admin, please contact admin for more details`,
                            ids: {
                                adminId: booking.adminId,
                                driverId: driver.driverId,
                            },
                            type: "booking"
                        });


                        try {
                            const redisFcmToken = booking.adminId
                                ? await getDriverFcmToken(String(booking.adminId), String(driver.driverId))
                                : null;
                            const targetFcmToken = redisFcmToken || driver.fcmToken;

                            if (bookingAssignNotification && targetFcmToken) {
                                const tokenResponse = await sendToSingleToken(targetFcmToken, {
                                    ids: {
                                        adminId: booking.adminId,
                                        bookingId: booking.bookingId,
                                        driverId: driver.driverId,
                                    },
                                    data: {
                                        title: 'Booking cancelled by admin',
                                        message: `Mr ${driver.name}, Your booking has been cancelled by admin , please contact admin for more details`,
                                        type: "admin-booking-cancel",
                                        channelKey: "other_channel",
                                    }
                                });
                                debug.info(`FCM Notification Response: ${tokenResponse}`);
                            } else {
                                debug.info(`booking cancelled by admin notification skipped due to missing token`);
                            }
                        } catch (err: any) {
                            debug.info(`FCM Notification Error: ${err}`);
                        }

                    } else {
                        res.status(404).json({
                            success: false,
                            message: "Driver not found",
                        });
                        return;
                    }

                    // const customerData = await Customer.findOne({ where: { adminId: booking.adminId, customerId: booking.customerId } });

                    // if (!customerData) {
                    //     debug.info(`Customer data not found to send notification >> ${booking.customerId}`);
                    //     return;
                    // }

                    // const customerNotification = await createCustomerNotification({
                    //     title: "Booking has been cancelled by admin",
                    //     message: `Hi ${customerData.name}, your booking has been cancelled by admin`,

                    //     adminId: customerData.adminId,
                    //     customerId: customerData.customerId,

                    //     type: "booking"
                    // });


                    // try {
                    //     if (customerNotification) {
                    //         const tokenResponse = await sendToSingleToken(customerData.fcmToken, {
                    //             ids: {
                    //                 adminId: customerData.adminId,
                    //                 bookingId: booking.bookingId,
                    //                 customerId: customerData.customerId
                    //             },
                    //             data: {
                    //                 title: 'Booking has been cancelled by admin',
                    //                 message: `Hi ${customerData.name}, your booking has been cancelled by admin`,
                    //                 type: "admin-booking-cancel",
                    //                 channelKey: "other_channel",
                    //             }
                    //         });
                    //         debug.info(`FCM Notification Response: ${tokenResponse}`);
                    //     } else {
                    //         debug.info(`trip cancelled by admin notification to customer is false`);
                    //     }
                    // } catch (err: any) {
                    //     debug.info(`FCM Notification Error - trip cancelled by admin notification to customer: ${err}`);
                    // }

                    // Send SMS
                    // try {
                    //     let cleanedPhone = customerData.phone.replace(/^\+?91|\D/g, '');
                    //     const companyProfile = await CompanyProfile.findOne({ where: { adminId } });
                    //     const smsResponse = await sms.sendTemplateMessage({
                    //         mobile: Number(cleanedPhone),
                    //         template: "trip_cancel",
                    //         data: {
                    //             name: customerData.name,
                    //             bookingId: booking.bookingId,
                    //             contactNumber: companyProfile?.phone[0] ?? "9876543210",
                    //             website: companyProfile?.website ?? "https://silvercalltaxi.in/",
                    //         }
                    //     })
                    //     if (smsResponse) {
                    //         debug.info("SMS sent successfully to customer");
                    //     } else {
                    //         debug.info("SMS not sent to customer");
                    //     }
                    // } catch (error) {
                    //     debug.info(`Error sending SMS to customer: ${error}`);
                    // }


                } else {
                    await booking.update({ status });
                    return;
                }
            } else {
                await booking.update({ status });
            }
        }
        if (contacted !== undefined && contacted !== null && contacted !== "") {
            await booking.update({ isContacted: contacted });
        }

        res.status(200).json({
            success: true,
            message: "Booking updated successfully",
            data: booking,
        });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({
            success: false,
            message: "Error updating booking",
        });
    }
};


// Delete a booking
export const multiDeleteBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { bookingIds } = req.body;

        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: bookingIds must be a non-empty array",
            });
            return;
        }

        const bookings = await Booking.findAll({
            where: {
                bookingId: bookingIds,
                adminId,
            },
        });

        if (bookings.length === 0) {
            res.status(404).json({
                success: false,
                message: "No bookings found with the provided IDs",
            });
            return;
        }

        const failedToDelete: string[] = [];

        for (const booking of bookings) {
            // Skip deletion if booking has started
            if (booking.status === 'Started') {
                failedToDelete.push(booking.bookingId);
                continue;
            }

            // Unassign driver if assigned
            if (booking.driverId && booking.status !== 'Completed') {
                const driver = await Driver.findOne({
                    where: { driverId: booking.driverId },
                });

                if (driver) {
                    driver.assigned = false;
                    driver.bookingCount = Number(driver.bookingCount) - 1;
                    await driver.save();
                }
            }

            await booking.destroy();
        }

        const successCount = bookings.length - failedToDelete.length;

        res.status(200).json({
            success: true,
            message: `${successCount} booking(s) deleted successfully`,
            ...(failedToDelete.length > 0 && {
                skipped: failedToDelete,
                note: "Some bookings could not be deleted as they were already started.",
            }),
        });

    } catch (error) {
        console.error("Error deleting bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting bookings",
        });
    }
};

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            areaChart = false,
            barChart = 'day',
            topDrivers = 'day',
        } = req.query;

        let areaChartData: any = null;
        let barChartData: any = null;
        let topDriversData: any = null;

        /* -------------------------------------------------------
         * 1) AREA CHART (Service-wise counts)
         * ----------------------------------------------------- */
        if (areaChart) {
            const [oneWay, roundTrip, hourlyPackages] = await Promise.all([
                Booking.count({ where: { adminId, serviceType: "One way" } }),
                Booking.count({ where: { adminId, serviceType: "Round trip" } }),
                Booking.count({ where: { adminId, serviceType: "Hourly Packages" } }),
            ]);

            areaChartData = { oneWay, roundTrip, hourlyPackages };
        }

        /* -------------------------------------------------------
         * 2) BAR CHART (Dynamic by filter)
         * ----------------------------------------------------- */
        if (barChart) {
            const filter = String(barChart);
            const { startDate, categories, datePart } = getBarChartMeta(filter);

            const sqlResult = await Booking.findAll({
                where: {
                    adminId,
                    createdAt: { [Op.gte]: startDate },
                } as any,
                attributes: [
                    [
                        Sequelize.literal(`EXTRACT(${datePart} FROM "createdAt")`),
                        "category",
                    ],
                    [Sequelize.fn("COUNT", Sequelize.col("createdAt")), "total"],
                ],
                group: ["category"],
                order: [[Sequelize.literal("category"), "ASC"]],
                raw: true,
            });

            // Build dataset in frontend-ready format
            const dataset = categories.map((category) => ({
                category,
                Bookings: 0,
            }));

            sqlResult.forEach((row: any) => {
                let index = Number(row.category);
                // PostgreSQL EXTRACT returns 1-indexed for DAY (1-31) and MONTH (1-12)
                // but our arrays are 0-indexed, so we need to adjust
                if (datePart === "DAY" || datePart === "MONTH") {
                    index = index - 1;
                }
                if (dataset[index]) dataset[index].Bookings = Number(row.total);
            });

            barChartData = dataset;
        }

        /* -------------------------------------------------------
         * 3) TOP DRIVERS (Top 5 by booking count)
         * ----------------------------------------------------- */
        if (topDrivers) {
            const drivers = await Driver.findAll({
                where: { adminId },
                attributes: [
                    "driverId",
                    "name",
                    [
                        Sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM bookings AS b
                    WHERE b."driverId" = "Driver"."driverId"
                      AND b."deletedAt" IS NULL
                  )`),
                        "bookingCount"
                    ]
                ],
                order: [[Sequelize.literal(`"bookingCount"`), "DESC"]],
                limit: 5,
                raw: true,
            });

            topDriversData = drivers.map((d) => ({
                name: d.name ?? "Unknown",
                total: Number(d.bookingCount) || 0,
            }));
        }



        /* -------------------------------------------------------
         * Final Response
         * ----------------------------------------------------- */
        return res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: {
                areaChartData,
                barChartData,
                topDriversData,
            },
        });
    } catch (error) {
        console.error("Dashboard Error:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard data",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


// const startOfferExpirationJob = () => {
//     // Runs every day at midnight (0 0 * * *)
//     schedule.scheduleJob('0 0 * * *', async () => {
//         try {
//             // Find drivers with assigned: true and at least one completed booking
//             const driversWithCompletedBookings = await Driver.findAll({
//                 where: {
//                     assigned: true,
//                 },
//                 include: [{
//                     model: Booking,
//                     as: 'bookings', // Match the association alias
//                     where: {
//                         status: 'Completed',
//                     },
//                     required: true, // Only include drivers with completed bookings
//                 }],
//             });

//             if (driversWithCompletedBookings.length === 0) {
//                 logger.info('No drivers with completed bookings found to unassign.');
//                 return;
//             }

//             // Get the driver IDs to unassign
//             const driverIdsToUnassign = driversWithCompletedBookings.map(driver => driver.id);

//             // Update those drivers to assigned: false
//             const [updatedCount] = await Driver.update(
//                 { assigned: false },
//                 {
//                     where: {
//                         id: driverIdsToUnassign,
//                     },
//                 }
//             );

//             logger.info(`Daily offer expiration completed: ${updatedCount} drivers unassigned. Date: ${new Date().toLocaleString()} Time: ${new Date().toLocaleTimeString()}`);
//         } catch (error) {
//             logger.error(`Offer expiration job error: ${error} Date: ${new Date().toLocaleString()} Time: ${new Date().toLocaleTimeString()}`);
//         }
//     });
// };

// // Initialize when the module loads
// startOfferExpirationJob();
