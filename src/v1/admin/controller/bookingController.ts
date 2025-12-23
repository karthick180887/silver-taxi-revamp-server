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
    CustomerWallet
} from '../../core/models/index'
import { bookingConfirm } from "../../../common/services/mail/mail";
import { commissionCalculation } from "../../core/function/commissionCalculation";
import { sendNotification, emitNewTripOfferToDriver, emitNewTripOfferToDrivers } from "../../../common/services/socket/websocket";
import { createNotification } from "../../core/function/notificationCreate";
import { createDriverNotification, createCustomerNotification } from '../../core/function/notificationCreate';
import { sendToSingleToken, sendToMultipleTokens } from "../../../common/services/firebase/appNotify";
import dayjs from "../../../utils/dayjs";
import { debugLogger as debug, infoLogger as log } from "../../../utils/logger";
import { sumSingleObject } from "../../core/function/objectArrays";
import { generateReferralCode } from "../../core/function/referCode";
import SMSService from "../../../common/services/sms/sms";
import { driverCommissionCalculation } from "../../core/function/odoCalculation";
import { publishNotification } from "../../../common/services/rabbitmq/publisher";
import { Op } from "sequelize";
import { sequelize, retryDbOperation } from "../../../common/db/postgres";
import { toLocalTime } from "../../core/function/dataFn";

const sms = SMSService()

// Get Booking Dashboard Stats
export const getBookingDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { areaChart, barChart, sortBy } = req.query;

        if (!adminId) {
            res.status(400).json({ success: false, message: "adminId is required" });
            return;
        }

        console.log(`[Dashboard] Fetching stats for adminId: ${adminId}`);

        // 1. New KPI Cards Calculation
        const startOfToday = dayjs().startOf('day').toDate();
        const endOfToday = dayjs().endOf('day').toDate();

        const [
            todaysBookings,
            activeTrips,
            pendingAssignments,
            completedTrips,
            cancelledTrips,
            totalRevenue,
            totalCount
        ] = await Promise.all([
            // Today's Bookings
            Booking.count({
                where: {
                    adminId,
                    createdAt: { [Op.between]: [startOfToday, endOfToday] }
                }
            }),

            // Active Trips (Started / On The Way / Arrived)
            Booking.count({
                where: {
                    adminId,
                    status: { [Op.in]: ['Started'] }
                }
            }),

            // Pending Assignment (Confirmed/Reassign AND No Driver OR Pending Acceptance)
            Booking.count({
                where: {
                    adminId,
                    [Op.or]: [
                        { driverId: null },
                        { driverId: { [Op.ne]: null }, driverAccepted: 'pending' }
                    ],
                    status: { [Op.in]: ['Booking Confirmed', 'Reassign'] }
                }
            }),

            // Completed (Total)
            Booking.count({
                where: { adminId, status: 'Completed' }
            }),

            // Cancelled / Failed
            Booking.count({
                where: { adminId, status: { [Op.in]: ['Cancelled'] } }
            }),

            // Total Revenue
            Booking.sum('finalAmount', { where: { adminId } }),

            // Total Count
            Booking.count({ where: { adminId } })
        ]);


        // 2. Last 7 Days Revenue (For Trend Chart)
        const last7DaysRevenue = await Booking.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('finalAmount')), 'revenue'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                adminId,
                createdAt: {
                    [Op.gte]: dayjs().subtract(7, 'days').toDate()
                },
                status: 'Completed'
            } as any,
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        // 3. Status Distribution (Donut)
        const statusDistribution = await Booking.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
            where: { adminId },
            group: ['status'],
            raw: true
        });

        res.status(200).json({
            success: true,
            message: "Dashboard data retrieved",
            data: {
                stats: {
                    todaysBookings,
                    activeTrips,
                    pendingAssignments,
                    completedTrips,
                    cancelledTrips,
                    totalRevenue: totalRevenue || 0,
                    bookingsCount: totalCount,
                },
                charts: {
                    revenue: last7DaysRevenue,
                    status: statusDistribution
                }
            }
        });
        console.log(`[Dashboard] KPIs Fetched: Active=${activeTrips}, Pending=${pendingAssignments}`);

    } catch (error) {
        console.error("Error fetching booking dashboard:", error);
        res.status(500).json({ success: false, message: "Error fetching dashboard data" });
    }
};

// Get Recent Bookings
export const getRecentBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 30;
        const offset = (page - 1) * limit;

        if (!adminId) {
            res.status(400).json({ success: false, message: "adminId is required" });
            return;
        }

        console.log(`[RecentBookings] Fetching recent bookings for adminId: ${adminId}`);

        const bookings = await Booking.findAll({
            where: { adminId },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['updatedAt', 'deletedAt'] },
            include: [{ model: Customer, as: 'customer', attributes: ['name', 'phone', 'customerId'] }]
        });

        console.log(`[RecentBookings] Found: ${bookings.length} bookings`);

        res.status(200).json({
            success: true,
            message: "Recent bookings retrieved",
            data: bookings,
        });
    } catch (error) {
        console.error("Error fetching recent bookings:", error);
        res.status(500).json({ success: false, message: "Error fetching recent bookings" });
    }
};

// Get all bookings

// Get all bookings
export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Bookings",
            });
            return;
        }
        const { driverId, customerId, vendorId } = req.query;

        const whereCondition: any = { adminId };
        if (driverId) whereCondition.driverId = driverId;
        if (customerId) whereCondition.customerId = customerId;
        if (vendorId) whereCondition.vendorId = vendorId;

        const offset = (page - 1) * limit;

        // Parallelize queries - use single aggregation for counts
        const [bookingsData, statsResult] = await Promise.all([
            Booking.findAndCountAll({
                where: whereCondition,
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: offset,
                include: [
                    {
                        model: Driver,
                        as: 'driver',
                        attributes: ['name', 'phone', 'driverId']
                    },
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: ['name', 'phone', 'customerId']
                    }
                ],
                distinct: true
            }),
            // Single aggregated query for all stats (replaces 8 separate COUNT queries)
            sequelize.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'Booking Confirmed') as "bookingConfirmed",
                    COUNT(*) FILTER (WHERE status = 'Not-Started') as "notStarted",
                    COUNT(*) FILTER (WHERE status = 'Started') as "started",
                    COUNT(*) FILTER (WHERE status = 'Completed') as "completed",
                    COUNT(*) FILTER (WHERE status = 'Cancelled') as "cancelled",
                    COUNT(*) FILTER (WHERE "vendorId" IS NOT NULL) as "vendor",
                    COUNT(*) FILTER (WHERE "isContacted" = true) as "contacted",
                    COUNT(*) FILTER (WHERE "isContacted" = false OR "isContacted" IS NULL) as "notContacted"
                FROM bookings 
                WHERE "adminId" = :adminId AND "deletedAt" IS NULL
            `, {
                replacements: { adminId },
                type: 'SELECT'
            })
        ]);

        const stats = (statsResult as any[])[0] || {};
        const bookingsCount = {
            bookingConfirmed: parseInt(stats.bookingConfirmed) || 0,
            notStarted: parseInt(stats.notStarted) || 0,
            started: parseInt(stats.started) || 0,
            completed: parseInt(stats.completed) || 0,
            cancelled: parseInt(stats.cancelled) || 0,
            vendor: parseInt(stats.vendor) || 0,
            contacted: parseInt(stats.contacted) || 0,
            notContacted: parseInt(stats.notContacted) || 0
        };

        const totalPages = Math.ceil(bookingsData.count / limit);

        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: {
                bookings: bookingsData.rows,
                bookingsCount: bookingsCount,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalCount: bookingsData.count,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: limit
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

export const getVendorBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

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

        const bookings = await Booking.findAll({
            where: { adminId, vendorId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            order: [['createdAt', 'DESC']],
        });


        res.status(200).json({
            success: true,
            message: "Vendor Bookings retrieved successfully",
            data: bookings,
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

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Bookings",
            });
            return;
        }

        if (!id) {
            res.status(400).json({
                success: false,
                message: "vendorId is required in Bookings",
            });
            return;
        }

        const bookings = await Booking.findAll({
            where: { adminId, vendorId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            order: [['createdAt', 'DESC']],
        });


        res.status(200).json({
            success: true,
            message: "Vendor Bookings retrieved successfully",
            data: bookings,
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

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Bookings",
            });
            return;
        }

        console.log("adminId-->", adminId, "driverId-->", id)
        const bookings = await Booking.findAll({
            where: { adminId, driverId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            order: [['createdAt', 'DESC']],
        });

        if (bookings.length === 0) {
            res.status(200).json({
                success: false,
                message: "No bookings found",
                data: []
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Driver Bookings retrieved successfully",
            data: bookings,
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
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;
        const {
            distance,
            pickupDateTime,
            dropDate,
            serviceType,
            vehicleId,
            packageId,
            packageType,
            createdBy,
            stops
        } = req.body;

        // console.log("req.body", req.body);

        // Validate common required fields
        const requiredFields = ['pickupDateTime', 'serviceType', 'vehicleId'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
            return;
        }

        // Service-specific validations
        if (serviceType === "Round trip" && !dropDate) {
            res.status(400).json({
                success: false,
                message: "dropDate is required for Round trip",
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

        const service = await Service.findOne({ where: { name: serviceType, adminId } });
        if (!service) {
            res.status(404).json({
                success: false,
                message: "Service not found",
            });
            return;
        }

        const serviceId = service?.serviceId;

        // Price calculation variables
        let basePrice: number = 0;
        let pricePerKm: number = 0;
        let taxAmount: number = 0;
        let finalPrice: number = 0;
        let driverBeta: number = 0;
        let totalDistance = 0;

        const taxPercentage = service?.tax?.GST ?? 0; // Default tax percentage, update as needed

        // Handle package-specific logic
        if (packageType && packageId) {
            switch (packageType) {
                case "Hourly Package":
                    let hourlyPackage: HourlyPackage | null = null;
                    if (createdBy === "Vendor") {
                        hourlyPackage = await HourlyPackage.findOne(
                            { where: { packageId, vendorId, adminId } }
                        );
                    } else {
                        hourlyPackage = await HourlyPackage.findOne(
                            { where: { packageId, adminId } }
                        );
                    }
                    if (!hourlyPackage) {
                        res.status(404).json({
                            success: false,
                            message: "Hourly Package not found",
                        });
                        return;
                    }
                    basePrice = hourlyPackage.price;
                    driverBeta = hourlyPackage.driverBeta;
                    taxAmount = (basePrice * taxPercentage) / 100;
                    finalPrice = basePrice + taxAmount + driverBeta;
                    break;

                case "Day Package":
                    let dayPackage: DayPackage | null = null;
                    if (createdBy === "Vendor") {
                        dayPackage = await DayPackage.findOne(
                            { where: { packageId, vendorId, adminId } }
                        );
                    } else {
                        dayPackage = await DayPackage.findOne(
                            { where: { packageId, adminId } }
                        );
                    }
                    if (!dayPackage) {
                        res.status(404).json({
                            success: false,
                            message: "Day Package not found",
                        });
                        return;
                    }
                    basePrice = dayPackage.price;
                    taxAmount = (basePrice * taxPercentage) / 100;
                    finalPrice = basePrice + taxAmount;
                    break;

                default:
                    res.status(400).json({
                        success: false,
                        message: "Invalid package type",
                    });
                    return;
            }
        } else {
            // Handle standard service logic (e.g., One way, Round trip, etc.)
            let tariff: Tariff | null = null;
            if (createdBy === "Vendor") {
                tariff = await Tariff.findOne({
                    where: { serviceId, vehicleId, vendorId, adminId },
                    include: [
                        {
                            model: Vehicle,
                            as: 'vehicles',
                        }
                    ]
                });
            } else {
                tariff = await Tariff.findOne({
                    where: { serviceId, vehicleId, adminId },
                    include: [
                        {
                            model: Vehicle,
                            as: 'vehicles',
                        }
                    ]
                });
            }


            if (!tariff) {
                res.status(404).json({
                    success: false,
                    message: "Tariff not found",
                });
                return;
            }

            // console.log("tariff", tariff);
            // console.log("serviceId", serviceId);

            switch (serviceType) {
                case "One way":
                    basePrice = Math.max(
                        tariff.price * distance,
                        service.minKm * tariff.price
                    );
                    totalDistance = distance
                    pricePerKm = tariff.price;
                    driverBeta = tariff.driverBeta;
                    taxAmount = (basePrice * taxPercentage) / 100;
                    finalPrice = basePrice + driverBeta + taxAmount;
                    break;

                case "Round trip":
                    if (!dropDateObj) throw new Error("dropDate required");
                    if (dropDateObj < pickupDateTimeObj) {
                        res.status(400).json({
                            success: false,
                            message: "dropDate must be after pickupDateTime",
                        });
                        return;
                    }
                    const start = new Date(pickupDateTime);
                    const end = new Date(dropDate);

                    // Normalize to midnight
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);

                    const tripDays = serviceType === "Round trip"
                        ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        : 1;

                    console.log("distance", distance);

                    if (Array.isArray(stops) && stops.length > 0) {
                        // Stops provided → use distance directly
                        totalDistance = distance;
                    } else {
                        // No stops → find max value
                        totalDistance = Math.max(
                            distance * 2,
                            service.minKm * tripDays
                        );
                    }


                    console.log("totalDistance", totalDistance);
                    pricePerKm = tariff.price;
                    driverBeta = tariff.driverBeta * tripDays;
                    basePrice = (totalDistance * tariff.price);
                    taxAmount = (basePrice * taxPercentage) / 100;
                    finalPrice = basePrice + driverBeta + taxAmount;
                    break;

                case "Airport Pickup":
                case "Airport Drop":
                    basePrice = tariff.price * distance;
                    pricePerKm = tariff.price;
                    driverBeta = tariff.driverBeta;
                    taxAmount = (basePrice * taxPercentage) / 100;
                    finalPrice = basePrice + driverBeta + taxAmount;
                    break;

                default:
                    res.status(400).json({
                        success: false,
                        message: "Unsupported service type",
                    });
                    return;
            }
        }

        res.status(200).json({
            success: true,
            message: `Fair Calculation done successfully`,
            data: {
                basePrice: Math.ceil(basePrice),
                taxAmount: Math.ceil(taxAmount),
                finalPrice: Math.ceil(finalPrice),
                taxPercentage: taxPercentage,
                driverBeta: driverBeta,
                pricePerKm: pricePerKm,
                totalDistance: Math.ceil(totalDistance),
                breakFareDetails: {
                    basePrice: Math.ceil(basePrice),
                    taxAmount: Math.ceil(taxAmount),
                    driverBeta: Math.ceil(driverBeta),
                }
            },

        });

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Create a new booking
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;
        const {
            name, email, phone,
            pickup, stops, drop, pickupDateTime,
            dropDate, enquiryId,
            serviceType,
            offerId,
            status, type,
            paymentMethod,
            advanceAmount,
            discountAmount,
            estimatedAmount,
            finalAmount,
            distance,
            tariffId,
            vehicleId,
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
            isContacted
        } = req.body;


        console.log("req.body", req.body);


        let days = 1;

        // console.log(req.body);

        // Validate common required fields
        const requiredFields = ['name', 'phone', 'pickup', 'pickupDateTime', 'serviceType', 'vehicleId', 'vehicleType'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
            return;
        }

        // Service-specific validations
        if (serviceType === "Round trip" && !dropDate) {
            res.status(400).json({
                success: false,
                message: "dropDate is required for Round trip",
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


        const start = new Date(pickupDateTime);
        const end = new Date(dropDate);

        // Normalize to midnight
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        days = serviceType === "Round trip"
            ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 1;

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
        let service = getService?.serviceId;

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

        const companyProfile = await CompanyProfile.findOne({ where: { adminId } });

        // console.log("tariff ---> ", tariff);
        // Create booking
        let convertedDistance = Math.round(Number(distance));
        let convertedDuration = duration;
        // const upPaidAmount = Number(finalAmount) - Number(advanceAmount)

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

        const { customAlphabet } = await import("nanoid");
        const generateOtp = customAlphabet('1234567890', 6);  // Changed from 4 to 6 digits for MSG91 compatibility
        const startOtp = generateOtp();
        const endOtp = generateOtp();
        const bookingData = {
            adminId,
            vendorId: createdBy === "Vendor" ? vendorId : null,
            name,
            email,
            stops,
            phone,
            pickup,
            drop,
            days: days.toString(),
            pickupDateTime: pickupDateTimeObj,
            dropDate: dropDateObj,
            enquiryId,
            serviceType,

            tariffId: tariffId ?? tariff?.tariffId,
            serviceId: serviceId ?? service,
            vehicleId,
            driverId: req.body.driverId || null,
            assignAllDriver: req.body.assignAllDriver || false,
            driverAccepted: (req.body.driverId ? "accepted" : "pending") as any,
            status: status || "Booking Confirmed",
            type: type || "Manual",
            distance: Number(convertedDistance) || 0,
            estimatedAmount: Number(estimatedAmount) || 0,
            discountAmount: Number(discountAmount) || 0,
            finalAmount: Number(finalAmount) || 0,
            advanceAmount: Number(advanceAmount) || 0,
            upPaidAmount: Number(upPaidAmount) || 0,
            packageId: packageId ?? null,
            offerId: offerId ?? null,
            paymentMethod,
            minKm: getService?.minKm,
            paymentStatus: paymentStatus || "Unpaid",
            createdBy: createdBy ?? "Admin",
            isContacted: isContacted !== undefined ? isContacted : true,
            extraToll: extraToll ?? null,
            extraHill: extraHill ?? null,
            extraPermitCharge: extraPermitCharge ?? null,
            pricePerKm: pricePerKm ?? null,
            taxPercentage: taxPercentage ?? null,
            taxAmount: taxAmount ?? null,
            driverBeta: driverBeta ?? null,
            duration: convertedDuration ?? null,
            startOtp: startOtp,
            endOtp: endOtp,
            extraCharges: extraCharges ?? {
                "Toll": 0,
                "Hill": 0,
                "Permit Charge": 0,
                "Parking Charge": 0,
                "Pet Charge": 0,
                "Waiting Charge": 0,
            },
            vehicleType: vehicleType,
            normalFare: {
                days: days || 1,
                distance: distance,
                pricePerKm: pricePerKm,
                driverBeta: driverBeta,
                toll: toll,
                hill: hill,
                permitCharge: permitCharge,
                estimatedAmount: estimatedAmount,
                finalAmount: finalAmount,
            },
            modifiedFare: {
                days: (days ?? 1),
                distance: (distance ?? 0),
                pricePerKm: (pricePerKm ?? 0),
                extraPricePerKm: (extraPricePerKm ?? 0),
                driverBeta: (driverBeta ?? 0) + (extraDriverBeta ?? 0),
                toll: (toll ?? 0) + (extraToll ?? 0),
                hill: (hill ?? 0) + (extraHill ?? 0),
                permitCharge: (permitCharge ?? 0) + (extraPermitCharge ?? 0),
                estimatedAmount: Number(estimatedAmount) + (distance * (extraPricePerKm ?? 0)),
                finalAmount: Number(finalAmount),
            },
            convenienceFee: companyProfile?.convenienceFee ?? 0,
            adminContact: String(companyProfile?.phone[0]) ?? "9876543210"
        };

        // console.log("bookingData ---> ", bookingData);

        const newBooking = await Booking.create(bookingData);
        let cleanedPhone = phone.replace(/^\+?91|\D/g, '');
        let phoneNumber = cleanedPhone.slice(5, 10);

        newBooking.bookingId = `SLTB${phoneNumber}${newBooking.id}`;
        // newBooking.bookingId = `book-${newBooking.id}`;
        await newBooking.save();

        // Check for existing customer with various phone formats
        let customer = await Customer.findOne({
            where: {
                [Op.or]: [
                    { phone: phone },
                    { phone: cleanedPhone },
                    { phone: `91 ${cleanedPhone}` },
                    { phone: `+91${cleanedPhone}` },
                    { phone: `+91 ${cleanedPhone}` }
                ]
            }
        });
        if (!customer) {
            const t = await sequelize.transaction();

            try {
                customer = await Customer.create({
                    adminId,
                    vendorId: createdBy === "Vendor" ? vendorId : null,
                    name,
                    email,
                    phone: `91 ${cleanedPhone}`,
                    createdBy: createdBy === "User" ? "Admin" : createdBy ?? "Admin",
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
            } catch (error) {
                await t.rollback();
                console.error("Transaction failed:", error);
                throw error;
            }

        } else {
            await customer.update({
                bookingCount: customer.bookingCount + 1,
                totalAmount: customer.totalAmount + finalAmount,
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
                vehicleType: (tariff as any).vehicles.type,
                vehicleName: (tariff as any).vehicles.name,
                serviceType: serviceType,
                estimatedAmount: estimatedAmount,
                discountAmount: discountAmount,
                taxAmount: taxAmount,
                toll: toll,
                hill: hill,
                permitCharge: permitCharge,
                finalAmount: finalAmount,
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
                    { type: "text", text: newBooking.distance },
                    { type: "text", text: newBooking.minKm },
                    { type: "text", text: newBooking.pricePerKm },
                    { type: "text", text: newBooking.driverBeta },
                    // { type: "text", text: newBooking.extraCharges["Toll"].toString() ?? "0" },
                    { type: "text", text: newBooking.extraCharges["Hill"].toString() ?? "0" },
                    { type: "text", text: newBooking.extraCharges["Permit Charge"].toString() ?? "0" },
                    { type: "text", text: newBooking.estimatedAmount.toString() },
                    { type: "text", text: newBooking.taxAmount.toString() },
                    { type: "text", text: newBooking.discountAmount.toString() },
                    { type: "text", text: newBooking.finalAmount.toString() },
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
                    location: `${pickup} ${stops.length > 0 ? ` → ${stops.join(" → ")} → ${drop}` : drop ? ` → ${drop}` : ""}`,
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
                    distance: newBooking.distance,
                    minKm: newBooking.minKm,
                    pricePerKm: newBooking.pricePerKm,
                    driverBeta: newBooking.driverBeta,
                    hill: newBooking.extraCharges["Hill"].toString() ?? "0",
                    permitCharges: newBooking.extraCharges["Permit Charge"].toString() ?? "0",
                    estimatedAmount: newBooking.estimatedAmount.toString(),
                    taxAmount: newBooking.taxAmount.toString(),
                    discountAmount: newBooking.discountAmount.toString(),
                    finalAmount: newBooking.finalAmount.toString(),
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

export const assignDriver = async (req: Request, res: Response) => {

    const adminId = req.body.adminId ?? req.query.adminId;
    const { bookingId, driverId } = req.body;

    const requestSentTime = dayjs().toDate();

    log.info(`Assign driver for adminId: ${adminId} and driverId: ${driverId} entry $>>`);
    try {
        const booking = await Booking.findOne({ where: { bookingId, adminId } });
        if (!booking) {
            debug.info(`Assign driver for adminId: ${adminId} and driverId: ${driverId} Booking not found`);
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return
        }

        // Check if a driver is already assigned
        const previousDriverId = booking.driverId;
        if (previousDriverId && previousDriverId !== driverId) {
            // Unassign the previous driver
            const previousDriver = await Driver.findOne({ where: { driverId: previousDriverId, adminId } });
            if (previousDriver) {
                await previousDriver.update({ assigned: false });
            }
        }

        const driver = await Driver.findOne({
            where: { driverId, adminId },
        });

        if (!driver) {
            debug.info(`Assign driver for adminId: ${adminId} and driverId: ${driverId} Driver not found`);
            res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
            return
        }


        // Assign the new driver
        // await booking.update({ driverId });
        await booking.update({
            driverId,
            driverAccepted: "pending" as any,
            status: "Booking Confirmed",
            assignAllDriver: false,
            requestSentTime,
        });

        // 🟢 Emit Socket Event for Real-time Popup
        try {
            // Include fare fields that overlay expects
            const bookingData = {
                ...booking.toJSON(),
                estimatedFare: booking.estimatedAmount || booking.finalAmount || 0,
                fare: booking.estimatedAmount || booking.finalAmount || 0,
            };
            emitNewTripOfferToDriver(driverId, bookingData);
            debug.info(`✅ Socket event 'NEW_TRIP_OFFER' sent to driver ${driverId} from assignDriver`);
        } catch (socketError) {
            debug.error(`❌ Error emitting socket event in assignDriver: ${socketError}`);
        }


        try {
            // Updated to use direct sendToSingleToken instead of RabbitMQ for consistency standard
            if (driver.fcmToken) {
                await sendToSingleToken(driver.fcmToken, {
                    title: "🚗 1 Trip Available",
                    message: `₹${booking.estimatedAmount || booking.finalAmount || 0} - ${booking.pickup || 'Pickup'} → ${booking.drop || 'Drop'}`,
                    ids: { bookingId: booking.bookingId },
                    data: {
                        title: '🚗 1 Trip Available',
                        message: `₹${booking.estimatedAmount || booking.finalAmount || 0} - ${booking.pickup || 'Pickup'} → ${booking.drop || 'Drop'}`,
                        type: "new-booking",
                        channelKey: "booking_channel",
                        bookingId: String(booking.bookingId),
                        adminId: String(booking.adminId),
                        // Trip details for overlay popup
                        pickup: String(booking.pickup || 'Pickup Location'),
                        drop: String(booking.drop || 'Drop Location'),
                        fare: String(booking.estimatedAmount || booking.finalAmount || '0'),
                        estimatedPrice: String(booking.estimatedAmount || booking.finalAmount || '0'),
                        customerName: String(booking.name || 'Customer'),
                        customerPhone: String(booking.phone || ''),
                        pickupDateTime: String(booking.pickupDateTime || ''),
                        serviceType: String(booking.serviceType || ''),
                        click_action: "FLUTTER_NOTIFICATION_CLICK",
                        fullScreenIntent: "true",
                    },
                    priority: 'high'
                });
                debug.info(`FCM Notification directly sent to driver ${driver.driverId}`);
            } else {
                debug.info(`Driver ${driver.driverId} has no FCM token`);
            }
        } catch (err: any) {
            debug.error(`FCM Notification Error: ${err}`);
        }

        log.info(`Assign driver for adminId: ${adminId} and driverId: ${driverId} exit <<$`);

        res.status(200).json({
            success: true,
            message: 'Driver assigned successfully',
            data: booking,
        });
    } catch (error) {
        debug.info(`Assign driver for adminId: ${adminId} and driverId: ${driverId} error >> ${error}`);
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
        const booking = await retryDbOperation(async () => {
            return await Booking.findOne({
                where: { bookingId: id, adminId },
            });
        });

        if (!booking) {
            debug.info(`Assign all drivers | Booking not found: bookingId=${id}, adminId=${adminId}`);
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const requestSentTime = dayjs().toDate();

        // Unassign current driver if any
        const currentDriverId = booking.driverId;
        if (currentDriverId) {
            const previousDriver = await retryDbOperation(async () => {
                return await Driver.findOne({
                    where: { driverId: currentDriverId, adminId },
                });
            });
            if (previousDriver) {
                await retryDbOperation(async () => {
                    await previousDriver.update({ assigned: false });
                });
            }
        }

        // DEBUG: Targeted check for Karthick Selvam
        const targetDriver = await retryDbOperation(async () => {
            return await Driver.findOne({ where: { driverId: 'SLTD260105672' } });
        });
        if (targetDriver) {
            debug.info(`>>> TARGET CHECK: Found Karthick Selvam (SLTD260105672)`);
            debug.info(`    adminId match? ${targetDriver.adminId} === ${adminId} => ${targetDriver.adminId === adminId} (types: ${typeof targetDriver.adminId} vs ${typeof adminId})`);
            debug.info(`    isActive match? ${targetDriver.isActive} === true => ${targetDriver.isActive === true} (type: ${typeof targetDriver.isActive})`);
            debug.info(`    isOnline match? ${targetDriver.isOnline} === true => ${targetDriver.isOnline === true} (type: ${typeof targetDriver.isOnline})`);
            debug.info(`    Raw Values: adminId='${targetDriver.adminId}', isActive=${targetDriver.isActive}, isOnline=${targetDriver.isOnline}`);
        } else {
            debug.warn(`>>> TARGET CHECK: Could not find Karthick Selvam explicitly?`);
        }

        // Fetch potentially valid drivers (Relaxed Query)
        // We filter isOnline MANUALLY to handle potential boolean/string mismatches
        const candidates = await retryDbOperation(async () => {
            return await Driver.findAll({
                where: {
                    adminId,
                    isActive: true,
                    // isOnline: true  <-- Removed to debug/fix strict type issue
                },
                attributes: ['driverId', 'name', 'fcmToken', 'geoLocation', 'isOnline'],
            });
        });

        // Manual Filter with loose check
        const drivers = candidates.filter(d => {
            // Check true, "true", or 1
            const isOnlineBool = d.isOnline === true || String(d.isOnline) === 'true';

            // Log as YES/NO to avoid 'true'/'false' redaction if they are secrets
            const onlineStatusStr = isOnlineBool ? "YES" : "NO";
            const rawStatusStr = d.isOnline ? "TRUTHY" : "FALSY";

            if (!isOnlineBool) {
                // debug.info(`Skipping driver ${d.name} (${d.driverId}) because isOnline=${onlineStatusStr} (Raw: ${d.isOnline})`);
                // Use a safer log format
                debug.info(`Skipping driver ${d.name} (Online: ${onlineStatusStr})`);
            }
            return isOnlineBool;
        });

        debug.info(`Assign All: Found ${drivers.length} active & online drivers (from ${candidates.length} candidates) for adminId=${adminId}`);

        if (!drivers.length) {
            debug.warn(`Assign All Failed: No active & online drivers found. (${candidates.length} active drivers, 0 online)`);
            return res.status(404).json({
                success: false,
                message: `No online drivers available. ${candidates.length} active driver(s) found but none are currently online. Please ensure drivers have the app open and are set to online status.`,
            });
        }

        debug.info(`Assign All: Proceeding with ${drivers.length} active & online drivers for adminId=${adminId}`);

        // Update booking to indicate broadcast
        await retryDbOperation(async () => {
            await booking.update({
                driverId: null,
                driverAccepted: "pending",
                status: "Booking Confirmed",
                assignAllDriver: true,
                requestSentTime,
            });
        });

        // 🟢 Emit Socket Event for Real-time Popup (Broadcast)
        if (drivers.length > 0) {
            const driverIds = drivers.map(d => d.driverId);
            try {
                // Include fare fields that overlay expects
                const bookingData = {
                    ...booking.toJSON(),
                    estimatedFare: booking.estimatedAmount || booking.finalAmount || 0,
                    fare: booking.estimatedAmount || booking.finalAmount || 0,
                };
                emitNewTripOfferToDrivers(driverIds, bookingData);
                debug.info(`✅ Socket broadcast 'NEW_TRIP_OFFER' sent to ${driverIds.length} drivers from assignAllDrivers`);
            } catch (socketError) {
                debug.error(`❌ Error emitting socket broadcast in assignAllDrivers: ${socketError}`);
            }
        }

        // Extract active FCM tokens
        const fcmTokens = drivers
            .map(d => d.fcmToken)
            .filter(token => token && token.trim() !== "");

        if (fcmTokens.length > 0) {
            try {
                // Build notification message with booking details
                const pickupShort = booking.pickup?.substring(0, 30) || 'Pickup';
                const dropShort = booking.drop?.substring(0, 30) || 'Drop';
                const amount = booking.estimatedAmount || booking.finalAmount || 0;

                const notificationTitle = "🚗 New Trip Available";
                const notificationMessage = `${pickupShort} → ${dropShort}\n₹${amount}`;

                // Updated to use direct sendToMultipleTokens instead of RabbitMQ for consistency standard
                // Parse pickup/drop addresses from JSON if needed
                const parseAddress = (location: any): string => {
                    if (!location) return '';
                    if (typeof location === 'string') {
                        try {
                            const parsed = JSON.parse(location);
                            return parsed.address || parsed.Address || parsed.name || location;
                        } catch {
                            return location;
                        }
                    }
                    if (typeof location === 'object') {
                        return location.address || location.Address || location.name || JSON.stringify(location);
                    }
                    return String(location);
                };

                await sendToMultipleTokens(fcmTokens, {
                    title: notificationTitle,
                    message: notificationMessage,
                    ids: { bookingId: booking.bookingId },
                    data: {
                        title: notificationTitle,
                        message: notificationMessage,
                        type: "NEW_TRIP_OFFER",
                        channelKey: "booking_channel",
                        bookingId: String(booking.bookingId),
                        adminId: String(booking.adminId),
                        pickup: parseAddress(booking.pickup),
                        drop: parseAddress(booking.drop),
                        estimatedPrice: String(amount),
                        estimatedFare: String(amount), // Also include this key for compatibility
                        fare: String(amount), // Include this too
                        pickupDateTime: String(booking.pickupDateTime || ''),
                        customerName: String(booking.name || ''),
                        customerPhone: String(booking.phone || ''),
                        click_action: "FLUTTER_NOTIFICATION_CLICK",
                        fullScreenIntent: "true",
                    },
                    priority: "high"
                });
                debug.info(`Batch FCM Notification sent to ${fcmTokens.length} drivers directly`);
            } catch (err) {
                debug.error(`Batch FCM Notification Error: ${err}`);
            }
        } else {
            debug.info("No valid FCM tokens found for active drivers");
        }

        log.info(`Assign all drivers for adminId: ${adminId}, bookingId: ${id} completed <<`);

        return res.status(200).json({
            success: true,
            message: `Notifications sent to ${drivers.length} drivers via RabbitMQ`,
            booking,
        });
    } catch (error: any) {
        debug.info(`Assign all drivers | Error: ${error}`);

        // Check if it's a connection error
        const isConnectionError =
            error.name === 'SequelizeConnectionError' ||
            error.message?.includes('connect failed') ||
            error.message?.includes('server_login_retry') ||
            error.code === '08P01';

        if (isConnectionError) {
            debug.error(`Assign all drivers | Database connection error: ${error.message}`);
            return res.status(503).json({
                success: false,
                message: "Database connection error. Please try again in a moment.",
                error: "SERVICE_UNAVAILABLE",
            });
        }

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
                                        title: 'Booking cancelled by admin',
                                        message: `Mr ${driver.name}, Your booking has been cancelled by admin , please contact admin for more details`,
                                        type: "admin-booking-cancel",
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
            if (booking.driverId !== null && booking.driverId !== undefined && booking.driverId !== "") {
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
