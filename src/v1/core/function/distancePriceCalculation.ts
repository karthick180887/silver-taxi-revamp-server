import { Service } from "../models/services";
import { infoLogger, infoLog } from "../../../utils/logger";

export const getDistrict = async (location: string) => {
    // console.log("Fetching district for:", location);
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            location
        )}&key=AIzaSyBiYqs0WhDwD59tp8lfPWLHUstjRw_PXkU`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;

        // Look for "administrative_area_level_3" or "locality"
        const district = addressComponents.find(
            (component: any) =>
                component.types.includes("administrative_area_level_3")
        );

        return district ? district.long_name : null;
    }
    return null;
};

export const distancePriceCalculation = async ({
    tariff,
    pickupLocation,
    dropLocation,
    service,
    pickupDateTime,
    dropDate,
    routeInfo,
    packageId,
    packageType,
    adminId,
    filteredOffers,
    subServiceType,
    pickupLocationState,
    dropLocationState,
    stops
}: {
    tariff: any;
    pickupLocation: string;
    dropLocation: string;
    service: Service;
    pickupDateTime: string;
    dropDate: string;
    routeInfo?: any,
    packageId?: string;
    packageType?: string;
    adminId: string;
    filteredOffers?: any;
    subServiceType?: string;
    pickupLocationState?: string
    dropLocationState?: string,
    stops?: string[]
}) => {
    try {
        // Validate common required fields
        if (!pickupLocation || !dropLocation) {
            return {
                success: false,
                message: "Missing required fields: tariffId, pickupLocation, dropLocation",
            };
        }


        let allIncludes: any = null;
        // if (pickupLocationDistrict && dropLocationDistrict) {
        //     allIncludes = await AllIncludes.findOne({
        //         where: {
        //             [Op.or]: [
        //                 { origin: pickupLocationDistrict.toLowerCase(), destination: dropLocationDistrict.toLowerCase() },
        //                 { origin: dropLocationDistrict.toLowerCase(), destination: pickupLocationDistrict.toLowerCase() }
        //             ]
        //         },
        //     });
        // }


        // constant values
        let taxAmount: number = 0;
        let taxPercentage: number = 0;
        let totalBeforeDiscount = 0;
        let driverBeta: number = 0;
        let basePrice: number;
        let discountApplyPrice: number = 0;
        let finalPrice: number = 0;
        let offerAmount: number = 0;
        let offerType: string = "";
        let offerId: string = "";
        let offerName: string = "";

        let totalDistance: number = 0;

        //normal calculation
        const distance = Math.round(routeInfo.distance) || 0;
        const duration = routeInfo.duration || "0";

        // all include calculation
        let toll: number = 0;
        let hill: number = 0;
        let permitCharge: number = 0;
        let allIncludePackageDistance: number = 0;
        let allIncludeVehicles: any;
        let newOfferAmount: number = 0;

        if (filteredOffers) {
            offerAmount = filteredOffers.value;
            offerType = filteredOffers.type;
            offerId = filteredOffers.offerId;
            offerName = filteredOffers.offerName;
        }

        if (allIncludes) {
            toll = allIncludes.tollPrice;
            hill = allIncludes.hillPrice;
            allIncludePackageDistance = allIncludes.Km;
            allIncludeVehicles = allIncludes.vehicles;
        }

        taxPercentage = Number(service?.tax?.GST) ?? 0;
        switch (service.name) {
            case "One way":
                if (allIncludes) {
                    const vehicleType: string = (tariff as any).vehicles.type;
                    const allIncludeVehicle = allIncludeVehicles.find((vehicle: any) => vehicle.type === vehicleType);
                    permitCharge = allIncludeVehicle?.price ? allIncludeVehicle.price : 0;

                    const tariffPrice = tariff.increasedPrice ? tariff.price + tariff.increasedPrice : tariff.price;
                    tariff.price = tariffPrice;
                    basePrice = tariff.price * allIncludePackageDistance;
                    driverBeta = tariff.driverBeta;
                    // basePrice += driverBeta;
                    finalPrice = basePrice;

                    console.log("Offer amount", offerAmount);

                    if (offerAmount > 0) {
                        if (offerType === "Percentage") {
                            offerAmount = (basePrice * offerAmount) / 100;
                        } else {
                            offerAmount = offerAmount;
                        }
                        discountApplyPrice = basePrice - Math.ceil(offerAmount);
                    } else {
                        discountApplyPrice = 0;
                    }

                    taxAmount = (basePrice * taxPercentage) / 100;
                    discountApplyPrice !== 0 ? finalPrice = discountApplyPrice + toll + hill + permitCharge + Math.ceil(taxAmount) + driverBeta
                        : finalPrice += discountApplyPrice + toll + hill + permitCharge + Math.ceil(taxAmount) + driverBeta;

                } else {
                    const tariffPrice = tariff.increasedPrice ? tariff.price + tariff.increasedPrice : tariff.price;
                    tariff.price = tariffPrice;
                    basePrice = Math.max(
                        tariff.price * distance,
                        service.minKm * tariff.price
                    );
                    driverBeta = tariff.driverBeta;
                    // basePrice += driverBeta;
                    // finalPrice = basePrice;

                    taxAmount = (basePrice * taxPercentage) / 100;

                    // Step 2: Apply offer discount if applicable
                    if (offerAmount > 0) {
                        discountApplyPrice = (offerType === "Percentage")
                            ? (basePrice * offerAmount) / 100
                            : offerAmount;

                        finalPrice = basePrice - Math.ceil(discountApplyPrice);
                    } else {
                        finalPrice = basePrice;
                    }

                    // Step 3: Calculate total before discount
                    totalBeforeDiscount = finalPrice + toll + hill + permitCharge + Math.ceil(taxAmount) + driverBeta;





                }
                break;

            case "Round trip":
                // Validate dates
                // console.log("pickupDateTime-->", pickupDateTime);
                // console.log("dropDate-->", dropDate);
                const pickupDateObj = new Date(pickupDateTime).setHours(0, 0, 0, 0);
                const dropDateObj = new Date(dropDate).setHours(0, 0, 0, 0);

                if (isNaN(pickupDateObj) || isNaN(dropDateObj)) {
                    return {
                        success: false,
                        message: "Invalid date format",
                    };
                }

                if (dropDateObj < pickupDateObj) {
                    return {
                        success: false,
                        message: "dropDate must be after pickupDateTime",
                    };
                }

                const tripDays = Math.max(
                    Math.ceil((dropDateObj - pickupDateObj) / (1000 * 3600 * 24)) + 1,
                    1
                );

                // console.log("New Days---->", tripDays);
                // console.log("tripDays--->", tripDays)

                if (allIncludes) {
                    // console.log("allIncludes--->", allIncludes);
                    const vehicleType: string = (tariff as any).vehicles.type;
                    const allIncludeVehicle = allIncludeVehicles.find((vehicle: any) => vehicle.type === vehicleType);
                    permitCharge = allIncludeVehicle?.price ? allIncludeVehicle.price : 0;

                    let totalDistance = allIncludePackageDistance * 2;
                    const tariffPrice = tariff.increasedPrice ? tariff.price + tariff.increasedPrice : tariff.price;
                    tariff.price = tariffPrice;
                    basePrice = (totalDistance * tariff.price)
                    driverBeta = tariff.driverBeta * tripDays;
                    // basePrice += driverBeta;
                    finalPrice = basePrice;

                    if (offerAmount > 0) {
                        if (offerType === "Percentage") {
                            offerAmount = (basePrice * offerAmount) / 100;
                        } else {
                            offerAmount = offerAmount;
                        }
                        discountApplyPrice = basePrice - Math.ceil(offerAmount);
                    } else {
                        discountApplyPrice = 0;
                    }

                    taxAmount = (basePrice * taxPercentage) / 100;
                    discountApplyPrice !== 0 ? finalPrice = discountApplyPrice + toll + hill + permitCharge + Math.ceil(taxAmount) + driverBeta
                        : finalPrice += discountApplyPrice + toll + hill + permitCharge + Math.ceil(taxAmount) + driverBeta;

                } else {
                    if (stops?.length) {
                        totalDistance = distance;
                    } else {
                        totalDistance = Math.max(distance * 2, service.minKm * tripDays);
                    }


                    const tariffPrice = tariff.increasedPrice ? tariff.price + tariff.increasedPrice : tariff.price;
                    tariff.price = tariffPrice;
                    basePrice = (totalDistance * tariff.price);
                    infoLog(`Base fare ${basePrice}`)
                    driverBeta = tariff.driverBeta * tripDays;
                    // basePrice += driverBeta;
                    taxAmount = (basePrice * taxPercentage) / 100;


                    if (offerAmount > 0) {
                        discountApplyPrice = (offerType === "Percentage")
                            ? (basePrice * offerAmount) / 100
                            : offerAmount;

                        finalPrice = basePrice - Math.ceil(discountApplyPrice);
                        console.log("discountApplyPrice--->", discountApplyPrice);
                        console.log("Base fare--->", basePrice);
                        console.log("Final price after discount--->", finalPrice);
                    } else {
                        finalPrice = basePrice;
                    }


                    totalBeforeDiscount = finalPrice + toll + hill + permitCharge + Math.ceil(taxAmount) + driverBeta;


                }
                break;

            case "Airport Pickup":
            case "Airport Drop":
                const tariffPrice = tariff.increasedPrice ? tariff.price + tariff.increasedPrice : tariff.price;
                tariff.price = tariffPrice;
                basePrice = tariff.price * distance;
                driverBeta = tariff.driverBeta;
                // basePrice += driverBeta;
                finalPrice = basePrice;
                if (offerAmount > 0) {
                    if (offerType === "Percentage") {
                        offerAmount = (basePrice * offerAmount) / 100;
                    } else {
                        offerAmount = offerAmount;
                    }
                    discountApplyPrice = basePrice - Math.ceil(offerAmount);
                } else {
                    discountApplyPrice = 0;
                }

                taxAmount = (basePrice * taxPercentage) / 100;
                discountApplyPrice !== 0 ? finalPrice = discountApplyPrice + Math.ceil(taxAmount) + driverBeta
                    : finalPrice += discountApplyPrice + Math.ceil(taxAmount) + driverBeta;
                break;

            default:
                return {
                    success: false,
                    message: "Unsupported service type",
                };
        }
        // }


        newOfferAmount = offerType === "Percentage"
            ? (basePrice * filteredOffers.value) / 100
            : filteredOffers?.value;

        // console.log("newOfferAmount", newOfferAmount   , offerType, filteredOffers?.value, totalBeforeDiscount);

        const finalDistance = service.name === "Airport Pickup" || service.name === "Airport Drop" ? distance : (allIncludes ? allIncludePackageDistance : stops?.length ? totalDistance : distance);

        return {
            success: true,
            message: "Calculation successful",
            cals: {
                distance: finalDistance,
                price: basePrice,
                pricePerKm: tariff.price,
                beforeDiscountPrice: Math.ceil(basePrice + taxAmount + driverBeta),
                discountApplyPrice: discountApplyPrice,
                finalPrice: totalBeforeDiscount,
                duration: duration,
                driverBeta: driverBeta,
                taxAmount: taxAmount,
                taxPercentage: taxPercentage,
                toll: service.name === "Airport Pickup" || service.name === "Airport Drop" ? 0 : toll,
                hill: service.name === "Airport Pickup" || service.name === "Airport Drop" ? 0 : hill,
                permitCharge: service.name === "Airport Pickup" || service.name === "Airport Drop" ? 0 : permitCharge,
                offerAmount: newOfferAmount,
                offerType: offerType,
                offerId: offerId,
                offerName: offerName
            }
        };

    } catch (error) {
        console.error("Error in calculation:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        };
    }
};


export interface ModifiedDualCalculationResult {
    normalFare: {
        distance: number;
        pricePerKm: number;
        driverBeta: number;
        toll: number;
        hill: number;
        permitCharge: number;
        estimatedAmount: number;
        finalAmount: number;
        extraPricePerKm?: number;
        additionalExtraPricePerKm?: number;
        days?: number;
        minKm?: number;
    };
    modifiedFare: {
        distance: number;
        driverBeta: number;
        pricePerKm: number;
        toll: number;
        hill: number;
        permitCharge: number;
        estimatedAmount: number;
        finalAmount: number;
        extraPricePerKm?: number;
        additionalExtraPricePerKm?: number;
        days?: number;
        minKm?: number;
    };
}
// Calculate both estimation fare and vendor fare
export const modifiedDualFareCalculation = ({
    distance,
    toll,
    hill,
    permitCharge,
    pricePerKm,
    driverBeta,
    extraToll,
    extraHill,
    extraPermitCharge,
    extraPricePerKm,
    extraDriverBeta,
    additionalExtraPricePerKm,
    isHourly = false,
    serviceType,
    days = 1,
    stops,
    hourlyPrice,
    minKm
}: {
    distance: number;
    toll: number;
    hill: number;
    permitCharge: number;
    pricePerKm: number;
    driverBeta: number;
    extraToll: number;
    extraHill: number;
    extraPermitCharge: number;
    extraPricePerKm: number;
    extraDriverBeta: number;
    additionalExtraPricePerKm?: number,
    isHourly: boolean,
    serviceType: "One way" | "Round trip" | "Hourly Packages",
    days: number,
    stops: string[]
    hourlyPrice?: number
    minKm: number
}): ModifiedDualCalculationResult => {
    // Estimation Fare (current logic)

    let normalFare;
    let modifiedFare;
    if (isHourly) {
        normalFare = {
            days: days,
            distance: distance,
            pricePerKm: 0,
            driverBeta: driverBeta,
            toll: toll,
            hill: hill,
            permitCharge: permitCharge,
            estimatedAmount: hourlyPrice || 0,
            finalAmount: (hourlyPrice || 0) + driverBeta + hill + permitCharge + toll,
            extraPricePerKm: extraPricePerKm,
            additionalExtraPricePerKm,
            minKm: minKm
        };

        modifiedFare = {
            days: days,
            distance: distance,
            pricePerKm: 0,
            driverBeta: driverBeta + extraDriverBeta,
            toll: toll + extraToll,
            hill: hill + extraHill,
            permitCharge: permitCharge + extraPermitCharge,
            estimatedAmount: hourlyPrice || 0,
            finalAmount: (hourlyPrice || 0) + driverBeta + extraDriverBeta + hill + extraHill + permitCharge + extraPermitCharge + toll + extraToll,
            extraPricePerKm: extraPricePerKm + (additionalExtraPricePerKm || 0),
            minKm: minKm
        };
    } else {
        let finalDistance = distance;
        if (serviceType == "Round trip") {
            if (stops.length > 0) {
                finalDistance = Math.max(distance, minKm * days);
                distance = distance;
            } else {
                finalDistance = Math.max(distance * 2, minKm * days);
                distance = distance * 2;
            }
        } else {
            finalDistance = Math.max(distance, minKm);
        }
        normalFare = {
            distance: distance,
            pricePerKm: pricePerKm,
            driverBeta: driverBeta,
            toll: toll,
            hill: hill,
            permitCharge: permitCharge,
            estimatedAmount: finalDistance * pricePerKm,
            finalAmount: Math.ceil((finalDistance * pricePerKm) + driverBeta + hill + permitCharge + toll),
            days: days,
            minKm: minKm
        };

        modifiedFare = {
            distance: distance,
            pricePerKm: pricePerKm + extraPricePerKm,
            driverBeta: driverBeta + extraDriverBeta,
            toll: toll + extraToll,
            hill: hill + extraHill,
            permitCharge: permitCharge + extraPermitCharge,
            estimatedAmount: Math.ceil(finalDistance * (pricePerKm + extraPricePerKm)),
            finalAmount: Math.ceil((finalDistance * (pricePerKm + extraPricePerKm)) + driverBeta + extraDriverBeta + hill + extraHill + permitCharge + extraPermitCharge + toll + extraToll),
            days: days,
            minKm: minKm
        };
    }


    return {
        normalFare,
        modifiedFare,
    };
};
