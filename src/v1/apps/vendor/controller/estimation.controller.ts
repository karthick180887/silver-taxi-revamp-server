import { Request, Response } from "express";
import {
  findDistanceAndTime,
  getSegmentDistancesOptimized,
} from "../../../../common/functions/distanceAndTime";
import { debugLogger as debug } from "../../../../utils/logger";
import {
  CompanyProfile,
  HourlyPackage,
  Service
} from "../../../core/models";
import { Vehicle } from "../../../core/models/vehicles";
import { modifiedDualFareCalculation, ModifiedDualCalculationResult } from "../../../core/function/distancePriceCalculation";
import { toIST } from "../../../core/function/dataFn";


export const estimateFareController = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      if (distance && !isNaN(distance) && Number(distance) > 0) {
        totalDistance = Number(distance);
      } else {

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

    }


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
      type: type || "App",
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
      taxPercentage: Number(taxPercentage) || 0,
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

