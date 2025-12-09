import { Request, Response } from "express";
import { Booking } from "../../../core/models/booking";
import {
  Driver,
  Service,
  DayPackage,
  HourlyPackage,
  Customer,
  Vehicle,
  Vendor,
  DriverWallet,
  CompanyProfile,
  DriverBookingLog,
  VehicleTypes,
  CustomerWallet,
  DriverNotification,
} from "../../../core/models/index";
import {
  createNotification,
  createVendorNotification,
} from "../../../core/function/notificationCreate";
import {
  sendToSingleToken,
  sendBatchNotifications
} from "../../../../common/services/firebase/appNotify";
import { NotificationManager } from "../../../../common/services/notification/notificationManager";
import dayjs from "../../../../utils/dayjs";
import {
  debugLogger as debug,
  infoLogger as log,
} from "../../../../utils/logger";
import { generateReferralCode } from "../../../core/function/referCode";
import SMSService from "../../../../common/services/sms/sms";
import { createDriverNotification } from "../../../core/function/notificationCreate";
import { Op } from "sequelize";
import { sequelize } from "../../../../common/db/postgres";
import { commissionCalculation } from "../../../core/function/commissionCalculation";
import { sumSingleObject } from "../../../core/function/objectArrays";
import { createCustomerNotification } from "../../../core/function/notificationCreate";
import { sendBookingNotifications } from "../../../core/function/postBookingCreation";
import { customOTPGenerator } from "../../../core/function/commissionCalculation";
import { validatedVendorBooking } from "../../../../common/validations/bookingSchema";
import { publishNotification } from "../../../../common/services/rabbitmq/publisher";
import { toLocalTime } from "../../../core/function/dataFn";
import { getAllRedisDrivers, getDriverFcmToken } from "../../../../utils/redis.configs";


const sms = SMSService();

// Get all bookings for vendor
export const getAllVendorBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = String(req.query.adminId);
    const vendorId = String(req.query.vendorId);

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

    const bookings = await Booking.findAll({
      where: { adminId, vendorId },
      attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Vendor bookings retrieved successfully",
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

export const getHourlyPackages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.query.adminId ?? req.body.adminId;

    const hourlyPackagesValues = await HourlyPackage.findAll({
      where: { adminId, status: true },
      attributes: [
        "packageId",
        "noOfHours",
        "distanceLimit",
        "price",
        "extraPrice",
      ],
      include: [
        {
          model: Vehicle,
          as: "vehicles",
          where: { isActive: true },
          required: true,
        },
      ],
    });

    const hourlyPackages = new Set();
    hourlyPackagesValues.forEach((hourPackage) => {
      const dayOrHour = hourPackage.noOfHours;
      const distanceLimit = hourPackage.distanceLimit;
      const formattedString = `${dayOrHour} ${Number(dayOrHour) > 1 ? "Hours" : "Hour"
        } ${distanceLimit} Km`;
      hourlyPackages.add(formattedString.trim());
    });

    res.status(200).json({
      success: true,
      message: "Hourly packages retrieved successfully",
      data: {
        hourlyPackage: Array.from(hourlyPackages),
        packages: hourlyPackagesValues.map((hourPackage) => ({
          packageId: hourPackage.packageId,
          noOfHours: hourPackage.noOfHours,
          distanceLimit: hourPackage.distanceLimit,
          price: hourPackage.price,
          extraPrice: hourPackage.extraPrice,
          vehicle: (hourPackage as any).vehicles,
        })),
      },
    });
  } catch (error) {
    debug.info(`Get hourly packages error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Error retrieving hourly packages",
      error: error instanceof Error ? error.message : "Unknown error",
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

    console.log("booking.driverId >> ", booking.driverId);
    console.log("booking.vehicleId >> ", booking.vehicleId);


    const driver = await Driver.findOne({
      where: { driverId: booking.driverId ?? "" },
      attributes: ["driverId", "name", "phone", "email", "assigned", "geoLocation"]

    });

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

    res.status(200).json({
      success: true,
      message: "Vendor booking retrieved successfully",
      data: data,
      driver: driver,
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
          order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
          success: true,
          message: "Booking Confirmed bookings fetched successfully",
          data: bookings,
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
          order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
          success: true,
          message:
            "Booking Confirmed/Not Started/Driver Accepted bookings fetched successfully",
          data: bookings,
        });
        break;
      case "started":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Started", driverAccepted: "accepted" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
          success: true,
          message: "Started bookings fetched successfully",
          data: bookings,
        });
        break;
      case "cancelled":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Cancelled" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
          success: true,
          message: "Cancelled bookings fetched successfully",
          data: bookings,
        });
        break;
      case "trip-completed":
      case "completed":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Completed", driverAccepted: "accepted" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [['updatedAt', 'DESC']],
        });
        res.status(200).json({
          success: true,
          message: "Trip Completed bookings fetched successfully",
          data: bookings,
        });
        break;
      case "recent":
        bookings = await Booking.findOne({
          where: { adminId, vendorId },
          order: [["createdAt", "DESC"]],
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
        });
        res.status(200).json({
          success: true,
          message: "Recent booking fetched successfully",
          data: bookings,
        });
        break;
      case "current":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Started" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
          success: true,
          message: "Current bookings fetched successfully",
          data: bookings,
        });
        break;
      case "upcoming":
        bookings = await Booking.findAll({
          where: { adminId, vendorId, status: "Not-Started" },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
          success: true,
          message: "Upcoming bookings fetched successfully",
          data: bookings,
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
          order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
          success: true,
          message: "New bookings fetched successfully",
          data: bookings,
        });
        break;
      default:
        // Default to Not-Started bookings if no status provided
        bookings = await Booking.findAll({
          where: { adminId, vendorId },
          attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
          order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
          success: true,
          message: "All bookings fetched successfully",
          data: bookings,
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


export const getVendorSpecificBookingCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = String(req.query.adminId) ?? String(req.body.adminId);
    const vendorId = String(req.query.vendorId) ?? String(req.body.vendorId);

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

    const counts: Record<string, number> = {};

    // booking-confirmed (new bookings with driverAccepted pending)
    counts["new-bookings"] = await Booking.count({
      where: {
        adminId,
        vendorId,
        status: "Booking Confirmed",
        driverAccepted: "pending"
      },
    });


    counts["all"] = await Booking.count({ where: { adminId, vendorId } });


    // not-started (accepted but not yet started)
    counts["not-started"] = await Booking.count({
      where: {
        adminId,
        vendorId,
        status: "Not-Started",
        driverAccepted: "accepted",
      },
    });

    // started (current trips)
    counts["started"] = await Booking.count({
      where: { adminId, vendorId, status: "Started", driverAccepted: "accepted" },
    });

    // completed
    counts["completed"] = await Booking.count({
      where: {
        adminId,
        vendorId,
        status: "Completed",
        driverAccepted: "accepted"
      },
    });

    // cancelled
    counts["cancelled"] = await Booking.count({
      where: { adminId, vendorId, status: "Cancelled" },
    });



    res.status(200).json({
      success: true,
      message: "Vendor booking counts fetched successfully",
      data: counts,
    });
  } catch (error) {
    console.error("Error fetching vendor specific booking counts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendor specific booking counts",
      error,
    });
  }
};


// Create a new booking for vendor with automatic fare calculation
export const createVendorBookingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = String(req.query.adminId);
    const vendorId = String(req.query.vendorId);

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

    const vendor = await Vendor.findOne({ where: { vendorId } });

    // Build booking data from precomputed fields
    const bookingData = {
      adminId,
      vendorId,
      name,
      email,
      stops,
      phone: `91 ${phone}`,
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
      status: "Booking Confirmed" as const,
      type: type || "App",
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
      createdBy: "Vendor" as const,
      extraToll: extraToll || 0,
      extraHill: extraHill || 0,
      extraPermitCharge: extraPermitCharge || 0,
      pricePerKm: pricePerKm || 0,
      extraPricePerKm: extraPricePerKm || 0,
      taxPercentage: Number(taxPercentage) || getService?.tax?.vendorGST || 0,
      taxAmount: taxAmount || Math.ceil((taxPercentage || getService?.tax?.vendorGST) * (estimatedAmount || 0) / 100),
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
      adminContact: String(vendor?.phone) ?? "9876543210"
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
        vendorId: vendorId,
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

    // Send notification to admin after booking creation
    await sendBookingNotifications({
      adminId,
      customerId: newBooking.customerId,
      createdBy: "Vendor",
      bookingId: newBooking.bookingId,
      customerName: name,
      customerPhone: phone,
      customerFcmToken: customer?.fcmToken || "",
      customerAdminId: adminId,
      from: pickup,
      to: drop,
    });

    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    // Add 'from' and 'to' in notification template (for admin)
    const time = new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(new Date());
    const adminNotification = {
      adminId,
      vendorId: null,
      title: `New Vendor Booking created`,
      description: `Booking Id: ${newBooking.bookingId}, From: ${pickup}, To: ${drop}, Customer Name: ${name}, Phone: ${phone}`,
      type: "booking",
      read: false,
      date: new Date(),
      time: time,
    };
    await createNotification(adminNotification as any);

    // send notification to customer
    try {
      const waCustomerPayload = {
        phone: cleanedPhone,
        variables: [
          { type: "text", text: `${(vendor?.name ?? "silvercalltaxi.in")}` },
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
          { type: "text", text: `${newBooking.pickup}${newBooking.stops.length > 0 ? `→ ${newBooking.stops.slice(0, 2).join("→")}` : ""}${newBooking.drop ? `→ ${newBooking.drop}` : ""}` },
          { type: "text", text: `${newBooking.serviceType === "Round trip" ? `${newBooking.serviceType} day(s)${newBooking.days}` : newBooking.serviceType}` },
          { type: "text", text: newBooking?.modifiedFare?.distance.toString() || newBooking.distance.toString() },
          { type: "text", text: newBooking?.modifiedFare?.minKm.toString() || newBooking.minKm.toString() },
          { type: "text", text: newBooking?.modifiedFare?.pricePerKm.toString() || newBooking.pricePerKm.toString() },
          { type: "text", text: newBooking?.modifiedFare?.driverBeta.toString() || newBooking.driverBeta.toString() },
          // { type: "text", text: newBooking.extraCharges["Toll"].toString() ?? "0" },
          { type: "text", text: newBooking?.modifiedFare["hill"].toString() ?? "0" },
          { type: "text", text: newBooking?.modifiedFare["permitCharge"].toString() ?? "0" },
          { type: "text", text: newBooking?.modifiedFare?.estimatedAmount.toString() },
          { type: "text", text: newBooking.taxAmount.toString() },
          { type: "text", text: newBooking?.modifiedFare?.discountAmount.toString() || newBooking.discountAmount.toString() },
          { type: "text", text: newBooking?.modifiedFare?.finalAmount.toString() || newBooking.finalAmount.toString() },
          { type: "text", text: vendor?.phone ?? "9876543210" },
          { type: "text", text: vendor?.website ?? "https://silvertaxi.in" },
        ],
        templateName: "bookingConfirmedAcknowledgement"
      }

      publishNotification("notification.whatsapp", waCustomerPayload)
        .catch((err) => console.log("❌ Failed to publish Whatsapp notification", waCustomerPayload.templateName, err));

    } catch (err) {
      console.log("❌ Error in Whatsapp notification", err);
    }

    // Send SMS to customer
    try {
      const smsResponse = await sms.sendTemplateMessage({
        mobile: Number(cleanedPhone),
        template: "customer_booking_acknowledgement",
        data: {
          contact: `${(vendor?.name ?? "silvercalltaxi.in")}`,
          location: `${pickup}${drop ? `→${drop}` : ""}`,
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
          distance: newBooking?.modifiedFare.distance.toString() || newBooking.distance.toString(),
          minKm: newBooking?.modifiedFare.minKm.toString() || newBooking.minKm.toString(),
          pricePerKm: newBooking?.modifiedFare?.pricePerKm.toString() || newBooking.pricePerKm.toString(),
          driverBeta: newBooking?.modifiedFare?.driverBeta.toString() || newBooking.driverBeta.toString(),
          hill: newBooking.modifiedFare["hill"].toString() ?? "0",
          permitCharges: newBooking?.modifiedFare["permitCharge"].toString() ?? "0",
          estimatedAmount: newBooking?.modifiedFare?.estimatedAmount.toString() || newBooking.estimatedAmount.toString(),
          taxAmount: newBooking.taxAmount.toString(),
          discountAmount: newBooking?.modifiedFare?.discountAmount.toString() || newBooking?.discountAmount.toString(),
          finalAmount: newBooking?.modifiedFare?.finalAmount.toString() || newBooking.finalAmount.toString(),
          contactNumber: vendor?.phone ?? "9876543210",
          website: vendor?.website ?? "https://silvertaxi.in",
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
      message: "Vendor booking created successfully",
      data: newBooking,
    });
  } catch (error) {
    console.error("Error creating vendor booking:", error);
    res.status(500).json({
      success: false,
      message: "Error creating vendor booking",
    });
  }
};

// Update a booking for vendor with automatic fare calculation
export const updateVendorBookingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.query.adminId ?? req.body.adminId;
    const vendorId = req.query.vendorId ?? req.body.vendorId;
    const { id } = req.params;

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
      tripCompletedDistance,
      tripCompletedTaxAmount,
      tripCompletedEstimatedAmount,
      tripCompletedPrice,
      tripCompletedDuration,
      tripCompletedFinalAmount,
      tripCompletedDriverBeta,
      driverCharges,
      paymentMethod,
      advanceAmount,
      discountAmount,
      distance,
      toll,
      extraToll,
      hill,
      extraHill,
      permitCharge,
      extraPermitChange,
      tariffId,
      vehicleId,
      serviceId,
      upPaidAmount,
      packageId,
      paymentStatus,
      duration,
      vehicleType,
      pricePerKm,
      extraPricePerKm,
      driverBeta,
      extraDriverBeta,
      isContacted,
    } = req.body;

    console.log("Vendor update booking with calculation request:", req.body);

    // Validate booking exists and belongs to vendor
    const booking = await Booking.findOne({
      where: { bookingId: id, adminId, vendorId },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    const validationData = {
      status: booking.status,
      pickupDateTime: pickupDateTime,
      serviceType: serviceType,
      dropDate: dropDate,
      distance: distance,
      pricePerKm: pricePerKm,
      driverBeta: driverBeta,
    }

    const zodValidation = validatedVendorBooking.safeParse(validationData)

    if (!zodValidation.success) {
      const formattedErrors = zodValidation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: formattedErrors,
      });
      return;
    }

    // Calculate new amounts if distance, pricePerKm, or driverBeta are provided
    let newBaseFare = booking.estimatedAmount;
    let newDistance = booking.distance;
    let newDriverBeta = Number(booking.driverBeta) || 0;

    // Update base fare if distance or pricePerKm changed
    if (distance && pricePerKm) {
      newDistance = Number(distance);
      newBaseFare = Number(distance) * Number(pricePerKm);
      newDriverBeta = Number(driverBeta) || 0;
    } else if (distance && booking.pricePerKm) {
      newDistance = Number(distance);
      newBaseFare = Number(distance) * Number(booking.pricePerKm);
    } else if (pricePerKm && booking.distance) {
      newBaseFare = Number(booking.distance) * Number(pricePerKm);
    }

    // Update driver beta if provided
    if (driverBeta !== undefined && driverBeta !== null) {
      newDriverBeta = Number(driverBeta);
    }

    // Calculate hill and permit charges
    const hillCharge = Number(hill) || 0;
    const permitChargeAmount = Number(permitCharge) || 0;
    const tollCharge = Number(toll) || 0;

    // Calculate total extra charges (hill + permit + toll)
    const totalExtraCharges = hillCharge + permitChargeAmount + tollCharge;

    // Calculate final amount: baseFare + driverBeta + extraCharges
    const newFinalAmount = newBaseFare + newDriverBeta + totalExtraCharges;

    // Create booking
    let convertedDistance = Math.round(Number(newDistance));
    let convertedDuration = duration || booking.duration;

    if (packageId) {
      let [packageType, packageName, recordId] = packageId.split("-");

      switch (packageType) {
        case "hr":
          const hourlyPackage = await HourlyPackage.findOne({
            where: { id: recordId, adminId },
          });
          if (hourlyPackage) {
            convertedDistance = Number(hourlyPackage.distanceLimit);
            convertedDuration = `${hourlyPackage.noOfHours} Hours`;
          }
          break;
        case "dl":
          const dayPackage = await DayPackage.findOne({
            where: { id: recordId, adminId },
          });
          if (dayPackage) {
            convertedDistance = Number(dayPackage.distanceLimit);
            convertedDuration = `${dayPackage.noOfDays} Days`;
          }
          break;
      }
    }

    // Prepare update data
    const updateData: any = {
      name: name || booking.name,
      email: email || booking.email,
      phone: phone || booking.phone,
      pickup: pickup || booking.pickup,
      stops: stops || booking.stops,
      drop: drop || booking.drop,
      pickupDateTime: pickupDateTime ? new Date(pickupDateTime) : booking.pickupDateTime,
      dropDate: dropDate ? new Date(dropDate) : booking.dropDate,
      enquiryId: enquiryId || booking.enquiryId,
      serviceType: serviceType || booking.serviceType,
      tariffId: tariffId || booking.tariffId,
      serviceId: serviceId || booking.serviceId,
      vehicleId: vehicleId || booking.vehicleId,
      distance: convertedDistance,
      estimatedAmount: Math.ceil(newBaseFare),
      discountAmount: discountAmount || booking.discountAmount || 0,
      finalAmount: Math.ceil(newFinalAmount),
      advanceAmount: advanceAmount || booking.advanceAmount || 0,
      upPaidAmount: upPaidAmount || booking.upPaidAmount || 0,
      packageId: packageId || booking.packageId,
      offerId: offerId || booking.offerId,
      paymentMethod: paymentMethod || booking.paymentMethod,
      paymentStatus: paymentStatus || booking.paymentStatus || "Unpaid",
      toll: extraToll || booking.extraToll || 0,
      hill: extraHill || booking.extraHill || 0,
      permitCharge: extraPermitChange || booking.extraPermitCharge || 0,
      pricePerKm: pricePerKm,
      extraPricePerKm: extraPricePerKm,
      extraDriverBeta: extraDriverBeta,
      taxPercentage: 0,
      taxAmount: 0,
      driverBeta: newDriverBeta || driverBeta || 0,
      duration: convertedDuration,
      extraCharges: {
        "Toll": (toll + extraToll) || booking.extraCharges?.Toll || 0,
        "Hill": (hill + extraHill) || booking.extraCharges?.Hill || 0,
        "Permit Charge": (permitCharge + extraPermitChange) || booking.extraCharges?.["Permit Charge"] || 0,
        "Parking Charge": 0,
        "Pet Charge": 0,
        "Waiting Charges": 0,
      },
      vehicleType: vehicleType || booking.vehicleType,
    };

    // Add trip completion data if provided
    if (tripCompletedDistance)
      updateData.tripCompletedDistance = Number(tripCompletedDistance);
    if (tripCompletedTaxAmount)
      updateData.tripCompletedTaxAmount = Number(tripCompletedTaxAmount);
    if (tripCompletedEstimatedAmount)
      updateData.tripCompletedEstimatedAmount = Number(
        tripCompletedEstimatedAmount
      );
    if (tripCompletedPrice)
      updateData.tripCompletedPrice = Number(tripCompletedPrice);
    if (tripCompletedDuration)
      updateData.tripCompletedDuration = tripCompletedDuration;
    if (tripCompletedFinalAmount)
      updateData.tripCompletedFinalAmount = Number(tripCompletedFinalAmount);
    if (tripCompletedDriverBeta)
      updateData.tripCompletedDriverBeta = tripCompletedDriverBeta;
    if (driverCharges) updateData.driverCharges = driverCharges;
    if (isContacted !== undefined) updateData.isContacted = isContacted;

    // Handle status updates
    if (status) {
      updateData.status = status;

      if (status === "Started" && !booking.tripStartedTime) {
        updateData.tripStartedTime = new Date();
      }

      if (status === "Completed" && !booking.tripCompletedTime) {
        updateData.tripCompletedTime = new Date();
      }
    }

    await booking.update(updateData);

    // Send notifications for status changes
    // if (status && status !== booking.status) {
    //   const time = new Intl.DateTimeFormat("en-IN", {
    //     hour: "numeric",
    //     minute: "numeric",
    //     hour12: true,
    //     timeZone: "Asia/Kolkata",
    //   }).format(new Date());

    //   const notification = {
    //     adminId,
    //     vendorId,
    //     title: `Booking ${status}`,
    //     description: `Booking Id: ${booking.bookingId
    //       } has been ${status.toLowerCase()}`,
    //     type: "booking",
    //     read: false,
    //     date: new Date(),
    //     time: time,
    //   };

    //   const adminNotification = {
    //     adminId,
    //     vendorId: null,
    //     title: `Vendor Booking ${status}`,
    //     description: `Booking Id: ${booking.bookingId
    //       } has been ${status.toLowerCase()} by vendor`,
    //     type: "booking",
    //     read: false,
    //     date: new Date(),
    //     time: time,
    //   };

    //   await createNotification(adminNotification as any);
    //   await createNotification(notification as any);
    // }

    res.status(200).json({
      success: true,
      message: "Vendor booking updated successfully with automatic calculation",
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        updatedAt: booking.updatedAt,
        calculationDetails: {
          basePrice: Math.ceil(newBaseFare),
          taxAmount: 0,
          driverBeta: Math.ceil(newDriverBeta),
          pricePerKm: Number(pricePerKm || booking.pricePerKm || 0),
          totalDistance: Math.ceil(newDistance),
          totalKM: Number(newDistance),
          extraCharges: totalExtraCharges,
          taxPercentage: 0,
          calculation: {
            baseFare: `distance (${newDistance}) × pricePerKm (${pricePerKm || booking.pricePerKm}) = ₹${Math.ceil(newBaseFare)}`,
            driverBeta: `₹${Math.ceil(newDriverBeta)}`,
            extraCharges: `Hill: ₹${hillCharge}, Permit: ₹${permitChargeAmount}, Toll: ₹${tollCharge}`,
            total: `₹${Math.ceil(newBaseFare)} + ₹${Math.ceil(newDriverBeta)} + ₹${totalExtraCharges} = ₹${Math.ceil(newFinalAmount)}`,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error updating vendor booking with calculation:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vendor booking with calculation",
    });
  }
};

// Delete a booking for vendor
export const deleteVendorBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = String(req.query.adminId);
    const vendorId = String(req.query.vendorId);
    const { id } = req.params;

    // console.log("Vendor delete booking request for ID:", id, vendorId, adminId);
    const booking = await Booking.findOne({
      where: { bookingId: id, adminId, vendorId },
    });

    // console.log("Delete vendor booking >> ", booking?.bookingId);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    if (booking.status === "Started") {
      res.status(400).json({
        success: false,
        message: "Cannot delete a booking that has already started",
      });
      return;
    }

    if (booking.driverId) {
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

    // Send notification to admin
    const time = new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    const adminNotification = {
      adminId,
      vendorId: null,
      title: `Vendor Booking Deleted`,
      description: `Booking Id: ${booking.bookingId} has been deleted by vendor`,
      type: "booking",
      read: false,
      date: new Date(),
      time: time,
    };

    await createNotification(adminNotification as any);

    res.status(200).json({
      success: true,
      message: "Vendor booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vendor booking:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting vendor booking",
    });
  }
};

export const fetchDrivers = async (req: Request, res: Response) => {
  try {
    const adminId = String(req.query.adminId);
    const { phone } = req.params;

    if (!adminId) {
      res.status(400).json({
        success: false,
        message: "adminId is required",
      });
      return;
    }

    // If phone parameter is provided, validate and search for drivers
    if (phone) {
      // Validate phone number length
      if (phone.length < 4) {
        res.status(200).json({
          success: true,
          message: "Please enter at least 4 digits to search drivers",
          data: {
            drivers: [],
            // searchTerm: phone,
            totalFound: 0,
          },
        });
        return;
      }

      if (phone.length > 10) {
        res.status(400).json({
          success: false,
          message: "Invalid phone number. Please enter a valid 10-digit number",
          data: {
            drivers: [],
            // searchTerm: phone,
            totalFound: 0,
          },
        });
        return;
      }

      // Validate that only digits are provided
      if (!/^\d+$/.test(phone)) {
        res.status(400).json({
          success: false,
          message: "Please enter only digits for phone number search",
          data: {
            drivers: [],
            // searchTerm: phone,
            totalFound: 0,
          },
        });
        return;
      }

      // Search for drivers with phone numbers that start with the provided digits
      const drivers = await Driver.findAll({
        where: {
          adminId,
          phone: {
            [Op.iLike]: `${phone}%`, // Matches phone numbers starting with the provided digits (case-insensitive)
          },
        },
        attributes: ["driverId", "name", "phone", "email", "assigned", "geoLocation"],
        limit: 10,
        order: [["name", "ASC"]],
        include: [{ model: DriverWallet, as: "wallet", attributes: ["balance"], required: false },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicleId", "name", "type", "vehicleNumber"],
          required: false,
          where: {
            isActive: true,
            // isAdminVehicle: true,
          },
        },
        ],
        raw: true,
        nest: true

      });

      const totalDrivers = await Driver.count({
        where: { adminId },
      });

      res.status(200).json({
        success: true,
        message: "Drivers fetched successfully",
        data: {
          drivers: drivers,
          // searchTerm: phone,
          totalDrivers: totalDrivers,
        },
      });
    } else {
      // If no phone provided, return all drivers (for initial load)
      const allDrivers = await Driver.findAll({
        where: { adminId },
        attributes: ["driverId", "name", "phone", "email", "assigned"],
        order: [["name", "ASC"]],
      });

      const totalDrivers = await Driver.count({
        where: { adminId },
      });

      res.status(200).json({
        success: true,
        message: "All drivers fetched successfully",
        data: {
          drivers: allDrivers,
          totalDrivers: totalDrivers,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching drivers",
    });
  }
};

export const fetchDriversWithLocation = async (req: Request, res: Response) => {
  const adminId = req.body.adminId ?? req.query.adminId;
  const vendorId = req.body.vendorId ?? req.query.vendorId;

  try {
    const drivers = await Driver.findAll({
      where: { adminId, isActive: true },
      attributes: ["driverId", "name", "phone", "email", "assigned", "geoLocation"],
    })
    res.status(200).json({
      success: true,
      message: "Drivers fetched successfully",
      data: drivers,
    })
  } catch (error) {
    console.error("Error fetching drivers with location:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching drivers with location",
    });
  }
}

export const getVehicleTypes = async (req: Request, res: Response) => {
  const adminId = req.body.adminId ?? req.query.adminId;

  const vehicles = await Vehicle.findAll({
    where: { adminId, isAdminVehicle: true },
    attributes: ['vehicleId', 'type', 'order'],
    order: [['order', 'ASC']]
  });


  const customVehicleType = [];
  const seen = new Set();
  for (const v of vehicles) {
    const key = v.type; // or use just v.type if that's the unique field
    if (!seen.has(key)) {
      seen.add(key);
      customVehicleType.push({
        vTypeId: v.vehicleId,
        name: v.type,
        order: v.order
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Vehicle types retrieved successfully",
    data: customVehicleType,
  });

}

export const assignDriver = async (req: Request, res: Response): Promise<void> => {
  const vendorId = req.body.vendorId ?? req.query.vendorId;
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
  log.info(`Assign driver for adminId: ${adminId}, vendorId: ${vendorId}, bookingId: ${bookingId}, driverId: ${driverId} entry $>>`);

  const transaction = await sequelize.transaction();

  try {
    // Find booking with lock to prevent concurrent modifications
    const booking = await Booking.findOne({
      where: { bookingId, adminId, vendorId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!booking) {
      await transaction.rollback();
      debug.info(`Assign driver | Booking not found: bookingId=${bookingId}, adminId=${adminId}, vendorId=${vendorId}`);
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
      debug.info(`Assign driver | Driver not found: driverId=${driverId}, adminId=${adminId}, vendorId=${vendorId}`);
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
        vendorId,
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
  const vendorId = req.body.vendorId ?? req.query.vendorId;
  const { id } = req.params;
  console.log("Assign all drivers request:", id);
  try {
    const booking = await Booking.findOne({
      where: {
        bookingId: id,
        vendorId,
        adminId,
      },
    });
    if (!booking) {
      debug.info(
        `Assign all driver for vendorId: ${vendorId} and driverId: ${id} Booking not found`
      );
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    const requestSentTime = dayjs().toDate();

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
        attributes: [
          "driverId",
          "name",
          "fcmToken",
          "adminId",
        ],
      });

      broadcastDrivers = dbDrivers.map(driver => ({
        driverId: driver.driverId,
        adminId: driver.adminId,
        name: driver.name,
        fcmToken: driver.fcmToken,
      }));
    }

    if (!broadcastDrivers.length) {
      res.status(400).json({
        success: false,
        message: "No drivers found",
      });
      return;
    }

    // Update booking with requestSentTime
    await booking.update({
      requestSentTime,
      driverId: null,
      driverAccepted: "pending",
      assignAllDriver: true,
    });
    await booking.save();

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
        adminId: driver.adminId,
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

    res.status(200).json({
      success: true,
      message: `Batch notifications sent to ${validDrivers.length} drivers`,
      booking,
    });

    log.info(
      `Assign all driver for adminId: ${adminId} and driverId: ${id} exit <<$`
    );
    return;
  } catch (error) {
    debug.info(
      `Assign all driver for adminId: ${adminId} and driverId: ${id} error >> ${error}`
    );
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
    return;
  }
};

export const toggleChanges = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.body.adminId ?? req.query.adminId;
    const vendorId = req.body.vendorId ?? req.query.vendorId;
    const { id } = req.params;
    const { paymentMethod, paymentStatus, status, contacted } = req.body;

    const vendor = await Vendor.findOne({
      where: { adminId, vendorId },
      attributes: ["fcmToken"],
    });
    if (!vendor) {
      res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
      return;
    }
    console.log("vendor ---> ", vendor.fcmToken);

    // console.log("req ---> ", req.body)

    const booking = await Booking.findOne({
      where: { bookingId: id, adminId },
    });
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
            where: { driverId, adminId },
          });
          if (driver) {
            driver.assigned = false;
            driver.bookingCount += 1;
            driver.totalEarnings = String(Number(driver.totalEarnings) + (Number(booking.tripCompletedFinalAmount || booking.finalAmount) - Number(booking.driverDeductionAmount ?? 0)));
            await driver.save();
            await booking.update({ status });
            const extraChargesValue = sumSingleObject(booking.extraCharges);
            const driverCommission = await commissionCalculation({
              debitedId: driverId,
              amount: booking.driverDeductionAmount + extraChargesValue,
              serviceId: booking.serviceId,
              debitedBy: "Driver",
              bookingId: booking.bookingId,
            });

            let vendorCommission: any = null;
            if (
              booking.vendorId !== null &&
              booking.vendorId !== undefined &&
              booking.vendorId !== ""
            ) {
              vendorCommission = await commissionCalculation({
                debitedId: booking.vendorId,
                amount: booking.vendorDeductionAmount,
                serviceId: booking.serviceId,
                debitedBy: "Vendor",
                bookingId: booking.bookingId,
                creditAmount: booking.vendorCommission + extraChargesValue,
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
            where: { driverId, adminId },
          });
          if (driver) {
            driver.assigned = false;
            await driver.save();
            await booking.update({ status });

            // Send notification to driver
            const bookingAssignNotification = await createDriverNotification({
              title: "Booking cancelled by vendor",
              message: `Mr ${driver.name}, Your booking has been cancelled by vendor, please contact vendor/admin for more details`,
              ids: {
                adminId: booking.adminId,
                driverId: driver.driverId,
              },
              type: "booking",
            });

            const vendorNotification = await createVendorNotification({
              title: "Booking successfully cancelled",
              message: `Your booking has been cancelled successfully`,
              ids: {
                adminId: booking.adminId,
                vendorId: booking.vendorId,
              },
              type: "booking",
            });

            try {
              if (vendorNotification && vendor.fcmToken) {
                console.log("vendor.fcmToken ---> ", vendor.fcmToken);
                const tokenResponse = await sendToSingleToken(vendor.fcmToken, {
                  ids: {
                    adminId: booking.adminId,
                    bookingId: booking.bookingId,
                    vendorId: booking.vendorId,
                  },
                  data: {
                    title: "Booking successfully cancelled",
                    message: `Your booking has been cancelled successfully`,
                    type: "vendor-booking-cancel",
                    channelKey: "other_channel",
                  },
                });
                debug.info(`FCM Notification Response: ${tokenResponse}`);
              } else {
                debug.info(
                  `Vendor notification or FCM token not available`
                );
              }
            } catch (error) {
              debug.info(`FCM Notification Error - booking cancelled by vendor notification to vendor: ${error}`);
            }

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
                    title: "Booking cancelled by vendor",
                    message: `Mr ${driver.name}, Your booking has been cancelled by vendor, please contact vendor/admin for more details`,
                    type: "vendor-booking-cancel",
                    channelKey: "other_channel",
                  },
                });
                debug.info(`FCM Notification Response: ${tokenResponse}`);
              } else {
                debug.info(
                  `Driver notification skipped due to missing FCM token`
                );
              }
            } catch (err: any) {
              debug.info(`FCM Notification Error: ${err}`);
            }

            res.status(200).json({
              success: true,
              message: "Booking cancelled successfully",
              data: booking,
            });
            return;
          } else {
            res.status(404).json({
              success: false,
              message: "Driver not found",
            });
            return;
          }
        } else {
          // No driver assigned, just update booking status
          await booking.update({ status });

          // Send notification to vendor
          const vendorNotification = await createVendorNotification({
            title: "Booking successfully cancelled",
            message: `Your booking has been cancelled successfully`,
            ids: {
              adminId: booking.adminId,
              vendorId: booking.vendorId,
            },
            type: "booking",
          });

          try {
            if (vendorNotification && vendor.fcmToken) {
              console.log("vendor.fcmToken ---> ", vendor.fcmToken);
              const tokenResponse = await sendToSingleToken(vendor.fcmToken, {
                ids: {
                  adminId: booking.adminId,
                  bookingId: booking.bookingId,
                  vendorId: booking.vendorId,
                },
                data: {
                  title: "Booking successfully cancelled",
                  message: `Your booking has been cancelled successfully`,
                  type: "vendor-booking-cancel",
                  channelKey: "other_channel",
                },
              });
              debug.info(`FCM Notification Response: ${tokenResponse}`);
            } else {
              debug.info(
                `Vendor notification or FCM token not available`
              );
            }
          } catch (error) {
            debug.info(`FCM Notification Error - booking cancelled by vendor notification to vendor: ${error}`);
          }

          res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking,
          });
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


export const cancelBookingByVendor = async (req: Request, res: Response) => {
  try {
    const adminId = String(req.body.adminId ?? req.query.adminId);
    const vendorId = String(req.body.vendorId ?? req.query.vendorId);
    const { id } = req.params;

    const booking = await Booking.findOne({
      where: { bookingId: id, adminId, vendorId },
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

    const driverId = booking.driverId;
    if (driverId) {
      const driver = await Driver.findOne({
        where: { driverId, adminId },
      });

      const activityLog = await DriverBookingLog.findOne({
        where: {
          bookingId: id,
          adminId
        },
      });

      if (activityLog) {
        await activityLog.update({
          tripStatus: "Cancelled",
        });
        activityLog.save();
      }


      if (driver) {
        driver.assigned = false;
        await driver.save();

        const bookingAssignNotification = await createDriverNotification({
          title: "Booking cancelled by vendor",
          message: `Mr ${driver.name}, Your booking has been cancelled`,
          ids: {
            adminId: booking.adminId,
            driverId: driver.driverId,
          },
          type: "booking",
        });

        try {
          const redisFcmToken = booking.adminId
            ? await getDriverFcmToken(String(booking.adminId), String(driver.driverId))
            : null;
          const targetFcmToken = redisFcmToken || driver.fcmToken;

          if (bookingAssignNotification && targetFcmToken) {
            const tokenResponse = await sendToSingleToken(targetFcmToken, {
              ids: {
                adminId: booking.adminId, driverId: driver.driverId,
              },
              data: {
                title: "Booking cancelled by vendor",
                message: `Mr ${driver.name}, Your booking has been cancelled`,
                type: "vendor-booking-cancel",
                channelKey: "other_channel",
              },
            });
            debug.info(`FCM Notification Response: ${tokenResponse}`);
          } else {
            debug.info(
              `Driver notification skipped due to missing FCM token`
            );
          }
        } catch (err: any) {
          debug.info(`FCM Notification Error: ${err}`);
        }
      }
    }

    await booking.update({ status: "Cancelled" });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
    return;

  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
    });

  }
};