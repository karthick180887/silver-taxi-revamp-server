import { Booking } from "../models/booking";
import { Service } from "../models/services";
import { HourlyPackage } from "../models/hourlyPackages";
import dayjs from "../../../utils/dayjs";
import { debugLogger as debug, infoLogger as log } from "../../../utils/logger";
import { CompanyProfile, Offers, PromoCode } from "../models";
import { sumSingleObject, filterObject } from "./objectArrays";

// ------------------ Interfaces ------------------ //

interface BookingResponseAttributes {
    success: boolean;
    message: string;
    data?: {
        extraKmCharge?: number;
        hourlyPackagePrice?: number;
        baseFare?: number;
        totalBaseFare?: number;
        finalPayOut?: number;
        tripCompletedDistance?: number;
    };
}

interface FareTypes {
    pricePerKm: number;
    driverBeta: number;
    toll: number;
    hill: number;
    permitCharge: number;
    estimatedAmount: number;
    finalAmount: number;
}

interface DriverDeductionParams {
    commissionTaxPercentage: number;
    normalFare: FareTypes;
    modifiedFare: FareTypes;
    gst: number;
    extraToll?: number;
    extraHill?: number;
    extraPermitCharge?: number;
    extraDriverBeta?: number;
    tripCompletedDistance: number;
    driverCommissionPercentage: number;
    pricePerKm: number;
    extraPricePerKm: number;
    extraCharges: any;
    driverCharges: any;
    createdBy: "Admin" | "Vendor" | "User";
    convenienceFee?: number;
    days?: number;
}

interface DriverCommissionBreakup {
    baseKmPrice: number;
    pricePerKm: number;
    commissionPercentage: number;
    extraPerKmCharge: number;
    commissionTaxPercentage: number;
    commissionTax: number;
    commissionAmount: number;
    gst: number;
    extraToll: number;
    extraHill: number;
    extraPermitCharge: number;
    extraDriverBeta: number;
    totalDeduction: number;
    convenienceFee?: number;
}

// ------------------ Driver Commission ------------------ //

export const driverCommissionCalculation = async ({
    commissionTaxPercentage = 0,
    normalFare,
    modifiedFare,
    gst,
    extraToll,
    extraHill,
    extraPermitCharge,
    extraDriverBeta,
    tripCompletedDistance,
    driverCommissionPercentage,
    pricePerKm,
    extraPricePerKm,
    driverCharges,
    extraCharges,
    createdBy,
    convenienceFee = 0,
    booking,
    serviceType, // NEW: to decide calculation type
    driverCommissionRate,
    companyCommissionPercentage,
    days
}: DriverDeductionParams & {
    booking?: any;
    serviceType?: string;
    driverCommissionRate?: number;
    companyCommissionPercentage?: number;
}) => {
    try {
        if (serviceType === "Hourly Packages" && booking?.packageId) {
            // ---------- Hourly Package Logic ----------
            const [_, __, recordId] = booking.packageId.split("-");
            const hourlyPackage = await HourlyPackage.findOne({
                where: { id: recordId, adminId: booking.adminId }
            });

            if (!hourlyPackage) throw new Error("Hourly package not found");

            const hourlyPackagePrice = hourlyPackage.price || 0;
            const packageDistance = hourlyPackage.distanceLimit || 0;
            const extraKmRate = hourlyPackage.extraPrice || 0;

            let extraKmCharge = 0;
            if (tripCompletedDistance > packageDistance) {
                const extraKm = tripCompletedDistance - packageDistance;
                extraKmCharge = extraKm * extraKmRate;
            }

            const baseFare = hourlyPackagePrice + extraKmCharge;
            const taxAmount = Math.ceil((baseFare * booking.taxPercentage) / 100);
            const dGst = taxAmount || booking.tripCompletedTaxAmount;

            const driverChargesTotal = sumSingleObject(driverCharges || {});
            const extraChargesTotal = sumSingleObject(extraCharges || {});

            const commissionAmount = Math.ceil((baseFare * (driverCommissionRate || 0)) / 100);
            const CommissionTaxPct = companyCommissionPercentage || 0;
            const commissionTax = Math.ceil((commissionAmount * CommissionTaxPct) / 100);

            const totalCommission = commissionAmount + commissionTax;

            const deductionAmount =
                totalCommission +
                extraChargesTotal +
                dGst +
                (booking.convenienceFee || 0);

            const finalPayOut =
                hourlyPackagePrice +
                extraKmCharge +
                dGst +
                (extraDriverBeta || 0) +
                (booking.convenienceFee || 0) +
                driverChargesTotal +
                extraChargesTotal -
                ((booking.discountAmount || 0) + (booking.advanceAmount || 0));

            const additionalChanges = filterObject(extraCharges);

            const driverDeduction = {
                driverCommissionBreakup: {
                    baseKmPrice: baseFare,
                    extraPricePerKmCharge: extraKmRate,
                    commissionPercentage: driverCommissionRate || 0,
                    extraCharge: extraKmCharge,
                    commissionTaxPercentage: CommissionTaxPct,
                    commissionTax,
                    commissionAmount,
                    gst: dGst,
                    totalDeduction: deductionAmount,
                    convenienceFee: booking.convenienceFee || 0,
                    ...additionalChanges
                },
                deductionAmount,
                baseKmPrice: baseFare
            };

            return { ...driverDeduction, finalPayOut, adminCommission: deductionAmount };
        }

        // ---------- Default Normal Fare Logic ----------
        const dGst = gst || 0;
        const dTripDistance = tripCompletedDistance || 0;
        const dCommissionPct = driverCommissionPercentage || 0;

        const baseKmPrice = (pricePerKm || 0) * dTripDistance;
        const commissionAmount = Math.ceil((baseKmPrice * dCommissionPct) / 100);

        const dCommissionTaxPct = createdBy === "Vendor" ? 0 : commissionTaxPercentage;
        const commissionTax =
            createdBy === "Vendor"
                ? 0
                : Math.ceil((commissionAmount * dCommissionTaxPct) / 100);

        const totalCommission = commissionAmount + commissionTax;
        const extraPerKmCharge = dTripDistance * (extraPricePerKm || 0);
        const extraChargesAmount =
            createdBy !== "Vendor" ? sumSingleObject(extraCharges) : 0;

        const deductionAmount =
            dGst +
            totalCommission +
            (extraToll || 0) +
            (extraHill || 0) +
            (extraPermitCharge || 0) +
            (extraDriverBeta || 0) +
            extraPerKmCharge +
            extraChargesAmount +
            convenienceFee;

        const additionalChanges =
            createdBy !== "Vendor" ? filterObject(extraCharges) : {};

        const driverCommissionBreakup: DriverCommissionBreakup = {
            baseKmPrice,
            pricePerKm,
            commissionPercentage: dCommissionPct,
            extraPerKmCharge,
            commissionTaxPercentage: dCommissionTaxPct,
            commissionTax,
            commissionAmount,
            gst: dGst,
            extraToll: extraToll || 0,
            extraHill: extraHill || 0,
            extraPermitCharge: extraPermitCharge || 0,
            extraDriverBeta: extraDriverBeta || 0,
            totalDeduction: deductionAmount,
            convenienceFee,
            ...additionalChanges
        };

        return { driverCommissionBreakup, deductionAmount, baseKmPrice };
    } catch (error) {
        console.error("[ERROR] Driver commission calculation failed:", error);
        return {
            driverCommissionBreakup: {
                baseKmPrice: 0,
                commissionPercentage: 0,
                extraPerKmCharge: 0,
                commissionTaxPercentage: 0,
                commissionTax: 0,
                commissionAmount: 0,
                gst: 0,
                extraToll: 0,
                extraHill: 0,
                extraPermitCharge: 0,
                extraDriverBeta: 0,
                totalDeduction: 0,
                convenienceFee: 0
            },
            deductionAmount: 0
        };
    }
};


// ------------------ Odo Calculation ------------------ //

export const odoCalculation = async (
    bookingId: string
): Promise<BookingResponseAttributes> => {
    try {
        const booking = await Booking.findOne({ where: { bookingId } });
        if (!booking) return { success: false, message: "Booking not found" };

        const { startOdometerValue, endOdometerValue } = booking;

        // Time calculations
        const start = dayjs(booking.tripStartedTime).tz("Asia/Kolkata");
        const end = dayjs(booking.tripCompletedTime).tz("Asia/Kolkata");
        console.log("Start Time && End Time:", {
            start: start.format(),
            end: end.format(),
            days: `${end.startOf("day").diff(start.startOf("day"), "day")} + 1`
        });
        const tripDuration = dayjs.duration(end.diff(start));
        const totalHours = Math.floor(tripDuration.asHours());
        const minutes = tripDuration.minutes();
        const formattedDuration = `${String(totalHours).padStart(
            2,
            "0"
        )} Hours ${String(minutes).padStart(2, "0")} Mins`;

        // Distance
        const tripCompletedDistance = Number(endOdometerValue) - Number(startOdometerValue);

        // Days for round trip
        const service = await Service.findOne({ where: { name: booking.serviceType } });
        const days =
            booking.serviceType === "Round trip" ? end.startOf("day").diff(start.startOf("day"), "day") + 1 : 1;

        // Driver Beta
        const ogDriverBeta = booking.driverBeta / Number(booking.normalFare?.days || 1) || 0;
        const ogExtraDriverBeta = booking.extraDriverBeta / Number(booking.normalFare?.days || 1) || 0;
        booking.driverBeta = ogDriverBeta * days;
        booking.extraDriverBeta = ogExtraDriverBeta * days;
        const driverBeta =
            (Number(ogDriverBeta) || 0) * days +
            (Number(ogExtraDriverBeta) || 0) * days;
        const tripCompletedDriverBeta = driverBeta;


        // Hourly Package
        let extraKmCharge = 0;
        let hourlyPackagePrice = 0;

        // Company profile
        const company = await CompanyProfile.findOne({
            where: { adminId: booking.adminId, vendorId: null } as any
        });

        let discounts: any = null;
        if (booking.offerId) {
            discounts = await Offers.findOne({
                where: {
                    adminId: booking.adminId,
                    offerId: booking.offerId
                },
                paranoid: false
            });
        }

        if (booking.promoCodeId) {
            discounts = await PromoCode.findOne({
                where: {
                    adminId: booking.adminId,
                    codeId: booking.promoCodeId
                },
                paranoid: false
            });
        }

        const companyCommissionPercentage =
            company?.companyCommissionPercentage ?? 0;

        // Fare
        let baseFare = 0;
        let taxAmount = 0;
        let gst = 0;
        let finalPayOut = 0;
        let driverDeduction: any;
        // Commission
        const driverCommissionRate = service?.driverCommission || 0;
        const vendorCommissionRate = service?.vendorCommission || 0;

        // Admin & Vendor Commission
        let adminCommission = 0;
        let extraPriceAdminCommission = 0;
        let vendorCommission = {};
        let vendorEarned = 0;


        if (service?.name === "Hourly Packages") {

            if (booking.createdBy === "Vendor") {
                hourlyPackagePrice = booking.estimatedAmount || 0;
                const afterDistance = tripCompletedDistance;
                const packageDistance = booking.distance || 0;
                const extraPricePerKm = booking.extraPricePerKm || 0;
                const additionalExtraPricePerKm = booking.normalFare.additionalExtraPricePerKm || 0;
                let additionalExtraKmCharge = 0;
                if (afterDistance > packageDistance) {
                    const extraKm = afterDistance - packageDistance;
                    extraKmCharge = extraKm * extraPricePerKm;
                    if (additionalExtraPricePerKm) {
                        additionalExtraKmCharge = extraKm * additionalExtraPricePerKm
                    }
                }

                baseFare = hourlyPackagePrice + extraKmCharge + additionalExtraKmCharge || 0;
                booking.discountAmount = discounts ? (discounts?.type === "Flat" ? discounts?.value : Math.ceil((baseFare * discounts?.value) / 100)) : 0;
                taxAmount = Math.ceil(((baseFare) * booking.taxPercentage) / 100);
                gst = taxAmount || booking.tripCompletedTaxAmount;
                const commissionAmount = Math.ceil(((baseFare) * driverCommissionRate) / 100);
                const CommissionTaxPct = companyCommissionPercentage;
                const commissionTax = Math.ceil((commissionAmount * CommissionTaxPct) / 100);

                const totalCommission = commissionAmount + commissionTax;

                const deductionAmount =
                    totalCommission +
                    gst +
                    (booking.extraToll || 0) +
                    (booking.extraHill || 0) +
                    (booking.extraPermitCharge || 0) +
                    (booking.extraDriverBeta || 0) +
                    booking.convenienceFee +
                    additionalExtraKmCharge;

                const driverChargesTotal = sumSingleObject(booking.driverCharges || {});
                const extraChargesTotal = sumSingleObject(booking.extraCharges || {});
                finalPayOut =
                    hourlyPackagePrice +
                    extraKmCharge +
                    additionalExtraKmCharge +
                    gst +
                    driverBeta +
                    booking.convenienceFee +
                    driverChargesTotal +
                    extraChargesTotal;

                finalPayOut -= booking.discountAmount + booking.advanceAmount;

                driverDeduction = {
                    driverCommissionBreakup: {
                        baseKmPrice: baseFare,
                        extraPricePerKmCharge: extraPricePerKm,
                        commissionPercentage: driverCommissionRate,
                        extraCharge: extraKmCharge,
                        additionalExtraKmCharge,
                        commissionTaxPercentage: CommissionTaxPct,
                        commissionTax,
                        commissionAmount,
                        gst: gst,
                        extraToll: booking.extraToll || 0,
                        extraHill: booking.extraHill || 0,
                        extraPermitCharge: booking.extraPermitCharge || 0,
                        extraDriverBeta: booking.extraDriverBeta || 0,
                        totalDeduction: deductionAmount,
                        convenienceFee: booking.convenienceFee,
                    },
                    deductionAmount: deductionAmount,
                    baseKmPrice: baseFare
                }

                adminCommission = driverDeduction.deductionAmount;

                if (booking.createdBy === "Vendor" && driverDeduction.driverCommissionBreakup) {
                    const breakup = driverDeduction.driverCommissionBreakup;
                    const totalExtraCharges =
                        (breakup.extraToll || 0) +
                        (breakup.extraHill || 0) +
                        (breakup.extraPermitCharge || 0) +
                        (breakup.extraDriverBeta || 0) +
                        (breakup.extraPerKmCharge || 0); +
                            (breakup.additionalExtraKmCharge || 0);

                    const commissionAmount = baseFare || 0;
                    const commissionTax = breakup.commissionTax || 0;

                    adminCommission = Math.ceil((commissionAmount * vendorCommissionRate) / 100);
                    extraPriceAdminCommission = Math.ceil((totalExtraCharges * 10) / 100);

                    vendorEarned =
                        driverDeduction.deductionAmount -
                        adminCommission -
                        commissionTax -
                        gst -
                        booking.convenienceFee -
                        extraPriceAdminCommission;

                    vendorCommission = {
                        baseKmPrice: breakup.baseKmPrice,
                        gst,
                        commissionPercentage: driverCommissionRate - vendorCommissionRate,
                        commissionTax,
                        adminCommission,
                        convenienceFee: booking.convenienceFee,
                        extraPriceAdminCommission,
                        adminCommissionPercentage: vendorCommissionRate,
                        vendorCommission: vendorEarned
                    };
                }
            } else {
                const [_, __, recordId] = booking.packageId.split("-");
                const hourlyPackage = await HourlyPackage.findOne({
                    where: { id: recordId, adminId: booking.adminId }
                });

                if (hourlyPackage) {
                    hourlyPackagePrice = hourlyPackage.price || 0;
                    const afterDistance = tripCompletedDistance;
                    const packageDistance = hourlyPackage.distanceLimit || 0;
                    const extraPricePerKm = hourlyPackage.extraPrice || 0;

                    if (afterDistance > packageDistance) {
                        const extraKm = afterDistance - packageDistance;
                        extraKmCharge = extraKm * extraPricePerKm;
                    }

                    baseFare = hourlyPackage.price + extraKmCharge || 0;
                    booking.discountAmount = discounts ? (discounts?.type === "Flat" ? discounts?.value : Math.ceil((baseFare * discounts?.value) / 100)) : 0;
                    taxAmount = Math.ceil(((baseFare) * booking.taxPercentage) / 100);
                    gst = taxAmount || booking.tripCompletedTaxAmount;
                    const driverChargesTotal = sumSingleObject(booking.driverCharges || {});
                    const extraChargesTotal = sumSingleObject(booking.extraCharges || {});
                    const commissionAmount = Math.ceil(((baseFare) * driverCommissionRate) / 100);
                    const CommissionTaxPct = companyCommissionPercentage;
                    const commissionTax = Math.ceil((commissionAmount * CommissionTaxPct) / 100);

                    const totalCommission = commissionAmount + commissionTax;

                    const deductionAmount =
                        totalCommission +
                        extraChargesTotal +
                        gst +
                        booking.convenienceFee

                    finalPayOut =
                        hourlyPackagePrice +
                        extraKmCharge +
                        gst +
                        driverBeta +
                        booking.convenienceFee +
                        driverChargesTotal +
                        extraChargesTotal;

                    finalPayOut -= booking.discountAmount + booking.advanceAmount;

                    const additionalChanges = filterObject(booking.extraCharges);
                    driverDeduction = {
                        driverCommissionBreakup: {
                            baseKmPrice: baseFare,
                            extraPricePerKmCharge: extraPricePerKm,
                            commissionPercentage: driverCommissionRate,
                            extraCharge: extraKmCharge,
                            commissionTaxPercentage: CommissionTaxPct,
                            commissionTax,
                            commissionAmount,
                            gst: gst,
                            totalDeduction: deductionAmount,
                            convenienceFee: booking.convenienceFee,
                            ...additionalChanges
                        },
                        deductionAmount: deductionAmount,
                        baseKmPrice: baseFare
                    }

                    adminCommission = driverDeduction.deductionAmount;
                }
            }
        } else {
            // Fare
            let km: number = service?.name === "Round trip" ?
                Math.max(tripCompletedDistance, ((booking.minKm || 0) * days))
                : Math.max(tripCompletedDistance, (booking.minKm || 0));
            baseFare = km * (booking.pricePerKm + (booking.extraPricePerKm || 0));
            booking.discountAmount = discounts ? (discounts?.type === "Flat" ? discounts?.value : Math.ceil((baseFare * discounts?.value) / 100)) : 0;
            taxAmount = Math.ceil((baseFare * booking.taxPercentage) / 100);
            gst = taxAmount || booking.tripCompletedTaxAmount;
            const driverChargesTotal = sumSingleObject(booking.driverCharges || {});
            const extraChargesTotal = sumSingleObject(booking.extraCharges || {});
            finalPayOut =
                baseFare +
                taxAmount +
                extraKmCharge +
                hourlyPackagePrice +
                driverChargesTotal +
                extraChargesTotal +
                tripCompletedDriverBeta +
                booking.convenienceFee;

            finalPayOut -= booking.discountAmount + booking.advanceAmount;

            driverDeduction = await driverCommissionCalculation({
                commissionTaxPercentage: companyCommissionPercentage,
                normalFare: booking.normalFare,
                modifiedFare: booking.modifiedFare,
                gst,
                extraToll: booking.extraToll || 0,
                extraHill: booking.extraHill || 0,
                extraPermitCharge: booking.extraPermitCharge || 0,
                extraDriverBeta: booking.extraDriverBeta * days || 0,
                tripCompletedDistance: Math.max(tripCompletedDistance, (booking.minKm || 0) * days),
                driverCommissionPercentage: driverCommissionRate,
                pricePerKm: booking.pricePerKm,
                extraPricePerKm: booking.extraPricePerKm,
                extraCharges: booking.extraCharges,
                driverCharges: booking.driverCharges,
                createdBy: booking.createdBy,
                convenienceFee: booking.convenienceFee,
            });

            adminCommission = driverDeduction.deductionAmount;

            if (booking.createdBy === "Vendor" && driverDeduction.driverCommissionBreakup) {
                const breakup = driverDeduction.driverCommissionBreakup;
                const totalExtraCharges =
                    (breakup.extraToll || 0) +
                    (breakup.extraHill || 0) +
                    (breakup.extraPermitCharge || 0) +
                    (breakup.extraDriverBeta || 0) +
                    (breakup.extraPerKmCharge || 0);

                const commissionAmount = baseFare || 0;
                const commissionTax = breakup.commissionTax || 0;

                adminCommission = Math.ceil((commissionAmount * vendorCommissionRate) / 100);
                extraPriceAdminCommission = Math.ceil((totalExtraCharges * 10) / 100);

                vendorEarned =
                    driverDeduction.deductionAmount -
                    adminCommission -
                    commissionTax -
                    gst -
                    booking.convenienceFee -
                    extraPriceAdminCommission;

                vendorCommission = {
                    baseKmPrice: breakup.baseKmPrice,
                    gst,
                    commissionPercentage: driverCommissionRate - vendorCommissionRate,
                    commissionTax,
                    adminCommission,
                    convenienceFee: booking.convenienceFee,
                    extraPriceAdminCommission,
                    adminCommissionPercentage: vendorCommissionRate,
                    vendorCommission: vendorEarned
                };
            }
        }

        // Persist booking updates
        await booking.update({
            adminCommission,
            vendorCommission: vendorEarned,
            vendorCommissionBreakup: vendorCommission,
            tripCompletedDuration: formattedDuration,
            tripCompletedDriverBeta,
            driverDeductionAmount: driverDeduction.deductionAmount,
            driverCommissionBreakup: driverDeduction.driverCommissionBreakup,
            vendorDeductionAmount: 0,
            tripCompletedDistance,
            discountAmount: booking.discountAmount,
            driverCharges: booking.driverCharges,
            tripCompletedFinalAmount: Math.ceil(finalPayOut),
            tripCompletedEstimatedAmount: Math.ceil(baseFare),
            tripCompletedTaxAmount: taxAmount,
            days: days.toString(),
            commissionTaxPercentage: companyCommissionPercentage,
            minKm: booking.minKm || 0
        });
        await booking.save();

        return {
            success: true,
            message: "Fare calculated successfully",
            data: {
                extraKmCharge,
                hourlyPackagePrice,
                baseFare,
                totalBaseFare: baseFare,
                finalPayOut,
                tripCompletedDistance
            }
        };
    } catch (error) {
        console.error("Error in calculateBookingFare:", error);
        return {
            success: false,
            message:
                (error as Error).message ||
                "An error occurred while calculating fare",
            data: {
                extraKmCharge: 0,
                hourlyPackagePrice: 0,
                baseFare: 0,
                totalBaseFare: 0,
                finalPayOut: 0,
                tripCompletedDistance: 0
            }
        };
    }
};
