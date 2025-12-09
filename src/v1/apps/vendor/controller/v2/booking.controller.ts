import { Request, Response } from "express";
import { Booking } from "../../../../core/models/booking";
import {
  Driver,
  Service,
  HourlyPackage,
  Customer,
  Vehicle,
  Vendor,
} from "../../../../core/models/index";
import {
  debugLogger as debug,
} from "../../../../../utils/logger";
import { Op } from "sequelize";
import { getDriverGeoLocation } from "../../../../../utils/redis.configs";
import { QueryParams } from "../../../../../common/types/global.types";


// Get all bookings for vendor
export const getAllVendorBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = String(req.query.adminId);
    const vendorId = String(req.query.vendorId);
    const {
      page = 1,
      limit = 25,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    }: QueryParams = req.query;

    if (!adminId) {
      res.status(400).json({
        success: false,
        message: "adminId is required",
      });
      return;
    }

    if (!vendorId) {
      res.status(400).json({
        success: false,
        message: "vendorId is required",
      });
      return;
    }

    const offset = (page - 1) * limit;

    const whereClause: any = {
      adminId,
      vendorId,
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
        // Numeric fields - convert to number if search is numeric
        ...(isNaN(Number(search)) ? [] : [
          { distance: Number(search) },
          { estimatedAmount: Number(search) },
          { finalAmount: Number(search) }
        ])
      );
    }

    if (searchConditions.length > 0) {
      whereClause[Op.or] = searchConditions;
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
      order: [[sortBy, sortOrder]],
      limit: limit,
      offset: offset,
    });

    const baseWhereClause = { adminId, vendorId };

    const totalCount = await Booking.count({ where: baseWhereClause });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.status(200).json({
      success: true,
      message: "Vendor bookings retrieved successfully",
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

// Get a single booking by ID for vendor
export const getVendorBookingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = String(req.query.adminId) ?? String(req.body.adminId);
    const vendorId = String(req.query.vendorId) ?? String(req.body.vendorId);
    const { id } = req.params;

    if (!adminId) {
      res.status(400).json({
        success: false,
        message: "adminId is required",
      });
      return;
    }

    if (!vendorId) {
      res.status(400).json({
        success: false,
        message: "vendorId is required",
      });
      return;
    }

    const booking = await Booking.findOne({
      where: { bookingId: id, adminId, vendorId },
      attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    const data: any = booking.toJSON();
    data.toll = booking.extraCharges?.Toll || 0;
    data.hill = booking.extraCharges?.Hill || 0;
    data.permitCharge = booking.extraCharges?.["Permit Charge"] || 0;

    console.log("Fetching booking details", { 
      bookingId: id, 
      driverId: booking.driverId, 
      vehicleId: booking.vehicleId 
    });


    const driver = await Driver.findOne({
      where: { driverId: booking.driverId ?? "" },
      attributes: ["driverId", "name", "phone", "email", "assigned"]

    });

    // Get geoLocation from Redis
    let driverGeoLocation = null;
    if (booking.driverId && booking.adminId) {
      driverGeoLocation = await getDriverGeoLocation(String(booking.adminId), String(booking.driverId));
    }

    const vehicle = await Vehicle.findOne({
      where: { vehicleId: booking.vehicleId ?? "" },
      attributes: [
        "vehicleId",
        ["name", "vehicleName"],
        ["type", "vehicleType"],
        ["vehicleNumber", "carNumber"],
      ],
      raw: true,
    });

    const additionalCharges = {
      ...booking.driverCharges,
      ...booking.extraCharges,
    }


    let tripSummary: any;
    let commissionDetails: any;
    if (booking.status === "Completed") {
      tripSummary = {
        totalKm: booking.tripCompletedDistance,
        pricePerKm: booking.pricePerKm + (booking.extraPricePerKm || 0),
        baseFare: booking.tripCompletedEstimatedAmount,
        driverBeta: booking.tripCompletedDriverBeta || (booking.driverBeta + booking.extraDriverBeta) || 0,
        discountAmount: booking.discountAmount,
        gstPercentage: booking.taxPercentage || 0,
        gstAmount: booking.tripCompletedTaxAmount || 0,
        totalAmount: booking.tripCompletedTaxAmount + booking.tripCompletedEstimatedAmount + booking.tripCompletedDriverBeta,
        additionalCharges: additionalCharges || {},
        advanceAmount: booking.advanceAmount || 0,
        convenienceFee: booking.convenienceFee || 0,
        finalAmount: booking.tripCompletedFinalAmount || 0,
      }

      commissionDetails = {
        pricePerKm: booking.pricePerKm,
        adminCommission: booking.vendorCommissionBreakup.adminCommission || 0,
        adminCommissionPercentage: booking.vendorCommissionBreakup.adminCommissionPercentage || 0,
        extraPerKm: booking.extraPricePerKm,
        extraPerKmCharge: booking.driverCommissionBreakup.extraPerKmCharge,
        extraDriverBeta: booking.driverCommissionBreakup.extraDriverBeta,
        extraHill: booking.driverCommissionBreakup.extraHill,
        extraPermitCharge: booking.driverCommissionBreakup.extraPermitCharge,
        extraToll: booking.driverCommissionBreakup.extraToll,
        convenienceFee: booking.convenienceFee,
        commissionAmount: booking.driverCommissionBreakup.commissionAmount,
        commissionPercentage: booking.driverCommissionBreakup.commissionPercentage,
        totalCommissionCharge: (booking.driverDeductionAmount),
      }

    }

    // Attach geoLocation from Redis to driver object
    const driverWithGeoLocation = driver ? {
      ...driver.toJSON ? driver.toJSON() : driver,
      geoLocation: driverGeoLocation
    } : null;

    res.status(200).json({
      success: true,
      message: "Vendor booking retrieved successfully",
      data: data,
      driver: driverWithGeoLocation,
      vehicle: vehicle,
      tripSummary: tripSummary,
      commissionDetails: commissionDetails,
    });
  } catch (error) {
    console.error("Error fetching vendor booking:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendor booking",
    });
  }
};

// Get specific bookings for vendor by status
export const getVendorSpecificBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = String(req.query.adminId) ?? String(req.body.adminId);
    const vendorId = String(req.query.vendorId) ?? String(req.body.vendorId);
    const status = req.query.status as string;
    const {
      page = 1,
      limit = 25,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    }: QueryParams = req.query;

    if (!adminId) {
      res.status(400).json({
        success: false,
        message: "adminId is required",
      });
      return;
    }

    if (!vendorId) {
      res.status(400).json({
        success: false,
        message: "vendorId is required",
      });
      return;
    }

    console.log("Vendor specific booking status >> ", status);

    const offset = (page - 1) * limit;

    let totalCount: number;
    let totalPages: number;
    let hasNext: boolean;
    let hasPrev: boolean;

    let bookings: any;
    switch (status?.toLowerCase().trim()) {
      case "booking-confirmed":
        bookings = await Booking.findAll({
          where: {
            adminId,
            vendorId,
            [Op.or]: [
              { status: "Booking Confirmed" },
            ],
            driverAccepted: "pending"
          },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
        });

        totalCount = await Booking.count({
          where: {
            adminId, vendorId, [Op.or]: [
              { status: "Booking Confirmed" },
            ], driverAccepted: "pending"
          }
        });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message: "Booking Confirmed bookings fetched successfully",
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
        break;
      case "not-started":
        bookings = await Booking.findAll({
          where: {
            adminId,
            vendorId,
            status: "Not-Started",
            driverAccepted: "accepted",
          },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
        });

        totalCount = await Booking.count({ where: { adminId, vendorId, status: "Not-Started", driverAccepted: "accepted" } });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message:
            "Booking Confirmed/Not Started/Driver Accepted bookings fetched successfully",
          data: {
            bookings,
            pagination: {
              currentPage: Number(page),
              totalPages: totalPages,
              totalCount: totalCount,
              hasNext: hasNext,
              hasPrev: hasPrev,
              limit: limit
            }
          },
        });
        break;
      case "started":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Started", driverAccepted: "accepted" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
        });

        totalCount = await Booking.count({ where: { adminId, vendorId, status: "Started", driverAccepted: "accepted" } });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message: "Started bookings fetched successfully",
          data: {
            bookings,
            pagination: {
              currentPage: Number(page),
              totalPages: totalPages,
              totalCount: totalCount,
              hasNext: hasNext,
              hasPrev: hasPrev,
              limit: Number(limit)
            }
          },
        });
        break;
      case "cancelled":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Cancelled" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
        });

        totalCount = await Booking.count({ where: { adminId, vendorId, status: "Cancelled" } });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message: "Cancelled bookings fetched successfully",
          data: {
            bookings,
            pagination: {
              currentPage: Number(page),
              totalPages: totalPages,
              totalCount: totalCount,
              hasNext: hasNext,
              hasPrev: hasPrev,
              limit: Number(limit)
            }
          },
        });
        break;
      case "trip-completed":
      case "completed":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Completed", driverAccepted: "accepted" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
        });

        totalCount = await Booking.count({ where: { adminId, vendorId, status: "Completed", driverAccepted: "accepted" } });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message: "Trip Completed bookings fetched successfully",
          data: {
            bookings,
            pagination: {
              currentPage: Number(page),
              totalPages: totalPages,
              totalCount: totalCount,
              hasNext: hasNext,
              hasPrev: hasPrev,
              limit: Number(limit)
            }
          },
        });
        break;
      case "recent":
        bookings = await Booking.findOne({
          where: { adminId, vendorId },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
        });

        totalCount = await Booking.count({ where: { adminId, vendorId } });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message: "Recent booking fetched successfully",
          data: {
            bookings,
            pagination: {
              currentPage: Number(page),
              totalPages: totalPages,
              totalCount: totalCount,
              hasNext: hasNext,
              hasPrev: hasPrev,
              limit: Number(limit)
            }
          },
        });
        break;
      case "current":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Started" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
        });

        totalCount = await Booking.count({ where: { adminId, vendorId, status: "Started" } });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message: "Current bookings fetched successfully",
          data: {
            bookings,
            pagination: {
              currentPage: Number(page),
              totalPages: totalPages,
              totalCount: totalCount,
              hasNext: hasNext,
              hasPrev: hasPrev,
              limit: Number(limit)
            }
          },
        });
        break;
      case "upcoming":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Not-Started" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
        });

        totalCount = await Booking.count({ where: { adminId, vendorId, status: "Not-Started" } });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message: "Upcoming bookings fetched successfully",
          data: {
            bookings,
            pagination: {
              currentPage: Number(page),
              totalPages: totalPages,
              totalCount: totalCount,
              hasNext: hasNext,
              hasPrev: hasPrev,
              limit: Number(limit)
            }
          },
        });
        break;
      case "new-bookings":
        bookings = await Booking.findAll({
          where: {
            adminId,
            vendorId,
            [Op.or]: [
              { status: "Booking Confirmed" },
            ],
            driverAccepted: "pending",
          },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
        });

        totalCount = await Booking.count({
          where: {
            adminId, vendorId, [Op.or]: [
              { status: "Booking Confirmed" },
            ], driverAccepted: "pending"
          }
        });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message: "New bookings fetched successfully",
          data: {
            bookings,
            pagination: {
              currentPage: Number(page),
              totalPages: totalPages,
              totalCount: totalCount,
              hasNext: hasNext,
              hasPrev: hasPrev,
              limit: Number(limit)
            }
          },
        });
        break;
      default:
        // Default to Not-Started bookings if no status provided
        bookings = await Booking.findAll({
          where: { adminId, vendorId },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [[sortBy, sortOrder]],
          limit: limit,
          offset: offset,
        });

        totalCount = await Booking.count({ where: { adminId, vendorId } });

        totalPages = Math.ceil(totalCount / limit);
        hasNext = page < totalPages;
        hasPrev = page > 1;
        res.status(200).json({
          success: true,
          message: "All bookings fetched successfully",
          data: {
            bookings,
            pagination: {
              currentPage: Number(page),
              totalPages: totalPages,
              totalCount: totalCount,
              hasNext: hasNext,
              hasPrev: hasPrev,
              limit: Number(limit)
            }
          },
        });
        break;
    }
  } catch (error) {
    console.error("Error fetching vendor specific bookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendor specific bookings",
      error: error,
    });
  }
};


