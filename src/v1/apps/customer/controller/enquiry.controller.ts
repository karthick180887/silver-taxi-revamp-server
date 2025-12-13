/**
 * @fileoverview Estimation controller for taxi fare calculations
 * 
 * Handles fare estimation for trips with multiple stops using Google Maps Distance Matrix API.
 * Supports multiple vehicles and service types, including round trips with return leg calculations.
 * 
 * @module estimationController
 * @author Silver Taxi Team
 * @version 1.0.0
 * @since 2025-08-01
 */

import { Request, Response } from "express";
import { Service } from "../../../core/models/services";
import { Vehicle } from "../../../core/models/vehicles";
import { debugLog, infoLog } from "../../../../utils/logger";
import { distancePriceCalculation } from "../../../core/function/distancePriceCalculation";
import { findDistanceAndTime, getSegmentDistancesOptimized } from "../../../../common/functions/distanceAndTime";
import getTariffs from "../../../core/function/getTariffs";
import { polylineCreate } from "../../../core/function/polylineCreate";
import { estimationSchema } from "../../../../common/validations/customerSchema";
import { Offers } from "../../../core/models/offers";
import { OfferUsage } from "../../../core/models/offerUsage";
import { HourlyPackage } from "../../../core/models/hourlyPackages";
import { Op } from "sequelize";

interface DistanceAndTimeResponse {
  distance: number;
  duration: string;
  origin: string;
  destination: string;
}

/**
 * Converts duration string (e.g., "1 hour 30 mins") to seconds
 * @param duration - Duration string from Google Maps API
 * @returns Duration in seconds
 */
const parseDurationToSeconds = (duration: string): number => {
  const durationParts = duration.match(/(\d+)\s*(hour|min|sec)/g) || [];
  return durationParts.reduce((seconds, part) => {
    const value = parseInt(part);
    if (part.includes("hour")) return seconds + value * 3600;
    if (part.includes("min")) return seconds + value * 60;
    if (part.includes("sec")) return seconds + value;
    return seconds;
  }, 0);
};


export const getHourlyPackages = async (req: Request, res: Response) => {
  try {

    const adminId = req.query.adminId ?? req.body.adminId;

    const hourlyPackagesValues = await HourlyPackage.findAll(
      {
        where: { adminId, status: true },
        attributes: ['noOfHours', 'distanceLimit'],
        include: [
          {
            model: Vehicle,
            as: 'vehicles',
            // attributes: ['vehicleId'],
          },
        ]
      });

    console.log("hourlyPackagesValues", hourlyPackagesValues)

    // const service = await Service.findOne({
    //     where: { 
    //       adminId,
    //       serviceId: hourlyPackagesValues[0].serviceId

    //      },
    //     attributes: { exclude: ['id', 'updatedAt', 'deletedAt', 'adminId'] },
    // })


    const hourlyPackages = new Set();

    hourlyPackagesValues.forEach((hourPackage) => {
      const dayOrHour = hourPackage.noOfHours;
      const distanceLimit = hourPackage.distanceLimit;
      const formattedString = `${dayOrHour} ${(Number(dayOrHour) > 1 ? "Hours" : "Hour")} ${distanceLimit} Km`;

      hourlyPackages.add(formattedString.trim());
    });


    res.status(200).json({
      success: true,
      message: "Active Services retrieved successfully",
      data: {
        hourlyPackage: Array.from(hourlyPackages),
        vehicles: hourlyPackagesValues.map((hourPackage) => (hourPackage as any).vehicles),
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching services",
    });
  }
};



/**
 * @route POST /v1/customer/estimation
 * @desc Estimate fare for a trip with multiple stops for all available vehicles
 * @access Customer
 */
export const estimateFare = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId, customerId } = { ...req.body, ...req.query };
    // console.log("Entering estimateFare", { requestBody: req.body, customerId, adminId });

    const parseResult = estimationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      debugLog("Input validation failed", { errors });
      res.status(400).json({ success: false, message: "Validation error", errors });
      return;
    }

    const { pickUp, drop, stops, pickupDateTime, dropDate, serviceType } = parseResult.data;

    if (serviceType === "Round trip" && !dropDate) {
      res.status(400).json({ success: false, message: "Drop date is required for round trip service." });
      return;
    }




    // const polyline = await polylineCreate(pickUp, drop, stops || []);

    const service = await Service.findOne({ where: { name: serviceType, isActive: true } });
    if (!service) {
      debugLog("Invalid service type", { serviceType });
      res.status(400).json({ success: false, message: "Invalid service type" });
      return;
    }

    if (serviceType === "Hourly Packages") {
      const hourlyPackages = await HourlyPackage.findAll({
        where: { status: true, adminId },
        include: [
          {
            model: Vehicle,
            as: 'vehicles',
            where: { isActive: true, isAdminVehicle: true },
            required: true
          },
          {
            model: Service,
            as: 'services',
            where: { isActive: true },
            required: true
          }
        ]
      });

      if (!hourlyPackages || hourlyPackages.length === 0) {
        res.status(400).json({ success: false, message: "No active hourly packages found" });
        return;
      }

      const offers = await Offers.findAll({
        where: {
          status: true,
          [Op.or]: [
            { category: serviceType },
            { category: 'All' }
          ]
        },
        include: [
          {
            model: OfferUsage,
            as: 'offerUsage',
            required: false,
            where: {
              customerId: customerId
            }
          }
        ]
      });

      // Group packages by hours and kilometers
      const packageGroups = new Map();

      hourlyPackages.forEach((pkg: any) => {
        const key = `${pkg.noOfHours}_${pkg.distanceLimit}`;

        if (!packageGroups.has(key)) {
          packageGroups.set(key, {
            hours: pkg.noOfHours,
            kilometers: pkg.distanceLimit,
            packageName: pkg.packageName,
            description: pkg.description || "",
            extraPricePerKm: pkg.extraPrice || 0,
            vehicles: [],
            packages: []
          });
        }

        const group = packageGroups.get(key);
        // Add vehicle with its specific package details - clean data
        const vehicleData = pkg.vehicles.dataValues || pkg.vehicles;
        const vehicleWithPackage = {
          vehicleId: vehicleData.vehicleId,
          name: vehicleData.name,
          type: vehicleData.type,
          fuelType: vehicleData.fuelType,
          imageUrl: vehicleData.imageUrl,
          seats: vehicleData.seats,
          bags: vehicleData.bags,
          permitCharge: vehicleData.permitCharge,
          driverBeta: pkg.driverBeta || vehicleData.driverBeta,
          packageId: pkg.packageId,
          packagePrice: parseFloat(pkg.price) || 0,
          packageDriverBeta: parseFloat(pkg.driverBeta) || 0,
          packageTaxPercentage: parseFloat(pkg.taxPercentage) || 0
        };
        group.vehicles.push(vehicleWithPackage);
        group.packages.push(pkg);
      });

      // Process each group to calculate pricing
      const groupedPackages = Array.from(packageGroups.values()).map((group: any) => {
        // Calculate individual pricing for each vehicle in the group
        const vehiclesWithPricing = group.vehicles.map((vehicle: any) => {
          const packageData = group.packages.find((pkg: any) => pkg.packageId === vehicle.packageId);
          const basePrice = parseFloat(packageData?.price || "0");
          const driverBeta = parseFloat(vehicle.driverBeta || "0");
          const priceWithDriverBeta = basePrice + driverBeta;

          // Offer calculation for this vehicle
          let offerAmount = 0;
          let offerType = "";
          let offerId = "";
          let offerName = "";
          let discountApplyPrice = 0;

          // if (offers && (!offers.offerUsage || offers.offerUsage.length === 0)) {
          //   if (offers.type === "Percentage") {
          //     offerAmount = (basePrice * parseFloat(String(offers.value))) / 100;
          //   } else {
          //     offerAmount = parseFloat(String(offers.value)) || 0;
          //   }
          //   offerType = offers.type;
          //   offerId = offers.offerId;
          //   offerName = offers.offerName;
          //   discountApplyPrice = Math.max(0, basePrice - offerAmount);
          // }

          if (offers && Array.isArray(offers)) {
            const specificOffer = offers.find(o => o.category === "Hourly Packages");
            const applicableOffer = specificOffer || offers.find(o => o.category === "All");

            if (applicableOffer && (!applicableOffer.offerUsage || applicableOffer.offerUsage.length < applicableOffer.limit)) {

              if (applicableOffer.type === "Percentage") {
                offerAmount = (basePrice * parseFloat(String(applicableOffer.value))) / 100;
              } else {
                offerAmount = parseFloat(String(applicableOffer.value)) || 0;
              }

              offerType = applicableOffer.type;
              offerId = applicableOffer.offerId;
              offerName = applicableOffer.offerName;
              discountApplyPrice = offerAmount
            }
          }


          // Tax calculation using service tax (GST) on base price
          const serviceTaxPercentage = parseFloat(String(service.tax?.GST || "0"));
          const taxAmount = (basePrice * serviceTaxPercentage) / 100;
          const discountedAmount = Math.max(0, basePrice - discountApplyPrice);
          const finalPrice = discountedAmount + taxAmount + driverBeta;

          return {
            ...vehicle,
            vehicleType: vehicle.type,
            baseFare: Math.ceil(basePrice),
            estimatedPrice: Math.ceil(basePrice),
            discountApplyPrice: offers ? Math.ceil(discountApplyPrice) : 0,
            beforeDiscountPrice: Math.ceil(priceWithDriverBeta + taxAmount),
            finalPrice: Math.ceil(finalPrice),
            taxAmount: Math.ceil(taxAmount),
            taxPercentage: serviceTaxPercentage,
            offerAmount: Math.ceil(offerAmount),
            offerType,
            offerId,
            offerName
          };
        });

        // Create package display name
        const packageDisplayName = `${group.hours} ${(Number(group.hours) > 1 ? "Hours" : "Hour")} ${group.kilometers} KM`;

        console.log("Package Group", { group });
        return {
          packageDisplayName,
          hours: `${group.hours} Hour${Number(group.hours) > 1 ? "s" : ""}`,
          kilometers: group.kilometers,
          description: group.description,
          vehicles: vehiclesWithPricing,
          totalVehicles: vehiclesWithPricing.length,
          extraPricePerKm: group.extraPricePerKm || 0,
        };
      });

      res.status(200).json({
        success: true,
        message: "Fare estimation successful",
        customerId,
        serviceId: service.serviceId,
        data: {
          packages: groupedPackages,
          totalPackages: groupedPackages.length
        }
      });
      return;
    }



    const routeInfo = await getSegmentDistancesOptimized({
      pickupCity: pickUp,
      stops: stops || [],
      dropCity: drop || "",
      serviceType
    });

    console.log("Route Info", routeInfo);

    if (typeof routeInfo === 'string') {
      res.status(400).json({
        success: false,
        message: routeInfo,
      })
      return;
    }

    const vehicles = await Vehicle.findAll(
      {
        where: {
          isActive: true,
          isAdminVehicle: true,
          adminId
        },
        order: [['order', 'ASC']]

      });
    if (!vehicles || vehicles.length === 0) {
      debugLog("No active vehicles found");
      res.status(400).json({ success: false, message: "No active vehicles found" });
      return;
    }
    let offers: any[] = await Offers.findAll({
      where: {
        status: true,
        [Op.or]: [
          { category: serviceType },
          { category: "All" }
        ]
      },
      include: [
        {
          model: OfferUsage,
          as: 'offerUsage',
          required: false,
          where: {
            customerId: customerId
          }
        }
      ]
    });


    // offers.forEach((offer) => {
    //   console.log("Offer:", offer.id, "Usage:", offer.offerUsage);
    // });


    offers = offers.filter((offer: any) => {
      const usageCount = offer.offerUsage ? offer.offerUsage.length : 0;
      return usageCount < offer.limit;
    });

    // If both all and service specific offers are present, show the service specific offer
    const serviceSpecificOffer = offers.find(offer => offer.category === serviceType);

    console.log("Service Specific Offer", serviceSpecificOffer);
    const validOffer = serviceSpecificOffer ? serviceSpecificOffer : offers[0];


    const tariffs = await getTariffs(adminId, service.serviceId);
    const vehicleFares = await Promise.all(
      vehicles.map(async (vehicle) => {
        if (!tariffs || tariffs.length === 0) {
          console.log("No tariffs found", { vehicleId: vehicle.vehicleId, serviceId: service.serviceId });
          return null;
        }

        const vehicleTariffs = tariffs.filter((tariff: any) => tariff.vehicleId === vehicle.vehicleId);
        if (vehicleTariffs.length === 0) {
          console.log("No tariffs found for vehicle", { vehicleId: vehicle.vehicleId, serviceId: service.serviceId });
          return null;
        }

        // console.log("Tariffs", vehicleTariffs);
        // console.log("Routeinof", routeInfo);
        const start = new Date(pickupDateTime);
        const end = dropDate ? new Date(dropDate) : new Date();

        // Normalize to midnight
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const days = serviceType === "Round trip"
          ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          : 1;

        const fares = await Promise.all(
          vehicleTariffs.map(async (tariff: any) => {
            const pricingResult = await distancePriceCalculation({
              tariff,
              pickupLocation: pickUp,
              dropLocation: drop || "",
              service,
              pickupDateTime,
              dropDate: dropDate || "",
              routeInfo,
              adminId,
              // filteredOffers: offers,
              filteredOffers: validOffer,
              subServiceType: undefined,
              stops,
            });

            if (!pricingResult.success) {
              console.log("Pricing calculation failed", { vehicleId: vehicle.vehicleId, tariffId: tariff.tariffId, message: pricingResult.message });
              return { tariffId: tariff.tariffId, price: 0, distance: 0, duration: 0 };
            }

            const baseFare = pricingResult.cals?.price || 0;
            // console.log("INfo ", pricingResult)
            return {
              tariffId: tariff.tariffId,
              baseFare,
              minKm: Number(service.minKm) || 0,
              pricePerKm: pricingResult.cals?.pricePerKm || 0,
              estimatedPrice: Math.ceil(pricingResult.cals?.price ?? 0),
              discountApplyPrice: Math.ceil(pricingResult.cals?.discountApplyPrice ?? 0),
              beforeDiscountPrice: pricingResult.cals?.beforeDiscountPrice || 0,
              finalPrice: Math.ceil(pricingResult.cals?.finalPrice ?? 0),
              distance: pricingResult.cals?.distance || routeInfo.distance,
              duration: pricingResult.cals?.duration || routeInfo.duration,
              driverBeta: pricingResult.cals?.driverBeta || 0,
              taxAmount: Math.ceil(pricingResult.cals?.taxAmount ?? 0),
              taxPercentage: pricingResult.cals?.taxPercentage || 0,
              toll: pricingResult.cals?.toll || 0,
              hill: pricingResult.cals?.hill || 0,
              permitCharge: pricingResult.cals?.permitCharge || 0,
              offerAmount: Math.ceil(pricingResult.cals?.offerAmount ?? 0) || 0,
              offerType: pricingResult.cals?.offerType || "",
              offerId: pricingResult.cals?.offerId || "",
              offerName: pricingResult.cals?.offerName || "",
              stops: stops || [],
              description: tariff.description,
              days: days
            };
          })
        );

        const validFares = fares.filter((fare) => fare.estimatedPrice !== 0);
        if (validFares.length === 0) {
          console.log("No valid fares for vehicle", { vehicleId: vehicle.vehicleId });
          return null;
        }

        return {
          vehicleId: vehicle.vehicleId,
          vehicleType: vehicle.type,
          vehicleImage: vehicle.imageUrl,
          fares: validFares,
        };
      })
    );

    const validVehicleFares = vehicleFares.filter((fare) => fare !== null);
    if (validVehicleFares.length === 0) {
      console.log("No valid fare calculations");
      res.status(400).json({ success: false, message: "No valid fare calculations available" });
      return;
    }

    // console.log("Fare estimation successful", { totalDistanceKm, vehicleCount: validVehicleFares.length, locations: allLocations });
    res.status(200).json({
      success: true,
      message: "Fare estimation successful",
      customerId,
      serviceId: service.serviceId,
      // polyline,
      totalDistanceKm: validVehicleFares[0].fares[0].distance,
      locations: routeInfo.results,
      vehicles: validVehicleFares,
    });
  } catch (error) {
    console.error("Estimation error", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};