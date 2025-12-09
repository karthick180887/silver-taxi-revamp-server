import { Request, Response } from "express";
import { PromoCode } from "../../../core/models/promoCodes";
import dayjs from "../../../../utils/dayjs";
import { debugLog as debug, infoLog } from "../../../../utils/logger";
import { Op, Sequelize } from "sequelize";
import { Offers } from "../../../core/models/offers";
import { PromoCodeUsage } from "../../../core/models/promoCodeUsage";


export const getPromoCodes = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const customerId = req.body.customerId ?? req.query.customerId;

    try {
        if (!customerId) {
            res.status(404).json({
                success: false,
                message: "Customer ID is required"
            });
            return;
        }

        const currentDate = dayjs().toDate();

        // Build where clause conditionally
        // Only return promos that have started (startDate <= now) and haven't expired (endDate > now)
        const whereClause: any = {
            status: true,
            startDate: { [Op.lte]: currentDate },
            endDate: { [Op.gt]: currentDate },
        };

        // Only add adminId filter if it's provided
        if (adminId) {
            whereClause.adminId = adminId;
        }

        const promoCodes = await PromoCode.findAll({
            where: whereClause,
            include: [
                {
                    model: PromoCodeUsage,
                    as: "promoCodeUsage",
                    required: false,
                    attributes: [], // don't fetch usage rows, just count them
                    where: { customerId },
                },
            ],
            attributes: {
                include: [
                    [Sequelize.fn("COUNT", Sequelize.col("promoCodeUsage.id")), "usageCount"],
                ],
            },
            group: [Sequelize.col("PromoCode.id")],
            having: Sequelize.literal(`COUNT("promoCodeUsage"."id") < "PromoCode"."limit"`)
        });

        if (promoCodes.length === 0) {
            res.status(200).json({
                success: false,
                message: "No valid promo codes found",
                data: []
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Promo codes fetched",
            data: promoCodes
        });
    }
    catch (err) {
        debug(`Error while fetching promo codes ${err}`);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Error while fetching promo codes ",
            error: err
        });
    }
};

export const getPromoCodeById = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const customerId = req.body.customerId ?? req.query.customerId;
    const { id } = req.params;

    try {
        if (!customerId) {
            res.status(404).json({
                success: false,
                message: "Customer ID is required"
            });
            return;
        }

        const promoCode = await PromoCode.findOne({
            where: {
                adminId,
                codeId: id?.toString(),
                startDate: {
                    [Op.lte]: dayjs().toDate()
                },
                endDate: {
                    [Op.or]: [
                        { [Op.gt]: dayjs().toDate() },
                    ]
                }
            }
        })

        if (!promoCode) {
            res.status(404).json({
                success: false,
                message: "No valid promo code found "
            });
            return;
        }



        res.status(200).json({
            success: true,
            message: "Promo code fetched",
            data: promoCode
        });
    }
    catch (err) {
        debug(`Error while fetching promo code ${err}`);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Error while fetching promo code ",
            error: err
        });
    }
};



export const validatePromoCode = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const customerId = req.body.customerId ?? req.query.customerId;
    const {
        estimatedAmount,
        taxAmount,
        driverBeta,
        totalAmount,
        promoCode,
        serviceType,
        offerId,
        actionType // "applyPromo" or "removePromo"
    } = req.body;


    debug(`Request body from promo validation", ${JSON.stringify(req.body, null, 2)}`);
    const today = dayjs();

    const finalAmount = Number(estimatedAmount) + Number(taxAmount) + Number(driverBeta);

    try {

        if (!customerId) {
            res.status(404).json({ success: false, message: "Customer ID is required" });
            return;
        }
        if (!serviceType) {
            res.status(400).json({ success: false, message: "Service type is required" });
            return;
        }

        let promoDiscount = 0;
        let offerDiscount = 0;
        let appliedPromoData: any = null;
        let appliedOfferData: any = null;

        // ==== OFFER HANDLING (if offerId present) ====
        if (offerId) {
            const offerData = await Offers.findOne({ where: { offerId } });
            if (!offerData) {
                res.status(404).json({ success: false, message: "Offer not found" });
                return;
            }
            if (serviceType !== offerData.category) {
                res.status(400).json({ success: false, message: "Offer not applicable for this service" });
                return;
            }
            offerDiscount = (offerData.type === "Percentage")
                ? (finalAmount * offerData.value) / 100
                : offerData.value;


            appliedOfferData = { ...offerData, "Type": "Offer" };
        }

        // ==== APPLY PROMO ====
        if (actionType === "applyPromo") {
            if (!promoCode) {
                res.status(404).json({ success: false, message: "Promo code is required" });
                return;
            }

            const promoCodeData = await PromoCode.findOne({
                where: { adminId, code: promoCode.trim() }
            });
            if (!promoCodeData) {
                res.status(404).json({ success: false, message: "Coupon code not found" });
                return;
            }


            const promoUsage = await PromoCodeUsage.findAll({
                where: {
                    codeId: promoCodeData.codeId,
                    customerId: customerId
                }
            });

            const usageCount = promoUsage.length;

            if (usageCount >= promoCodeData.limit) {
                res.status(400).json({
                    success: false,
                    message: "Promo code already used by this user"
                });
                return;
            }


            // Date validations
            if (dayjs(promoCodeData.startDate).isAfter(today, "day")) {
                res.status(400).json({ success: false, message: "Coupon code is not yet active" });
                return;
            }
            if (!dayjs(promoCodeData.endDate).isSameOrAfter(today, "day")) {
                res.status(400).json({ success: false, message: "Coupon code is expired" });
                return;
            }

            // Service type check
            if (promoCodeData.category !== "All" && serviceType !== promoCodeData.category) {
                res.status(404).json({ success: false, message: "Promo code not applicable for this service" });
                return;
            }

            // If both offer & promo → ignore offer discount in promo calculation
            const amountForPromo = (offerId && offerDiscount > 0)
                ? estimatedAmount // no offer reduction for promo calculation
                : estimatedAmount;

            if (promoCodeData.type === "Percentage") {
                promoDiscount = Math.ceil((amountForPromo * promoCodeData.value) / 100);
                if (promoCodeData.minAmount && promoDiscount < promoCodeData.minAmount) {
                    res.status(400).json({
                        success: false,
                        message: `Minimum discount of ₹${promoCodeData.minAmount} not met for this coupon`
                    });
                    return;
                }
                if (promoCodeData.maxDiscount && promoDiscount > promoCodeData.maxDiscount) {
                    promoDiscount = promoCodeData.maxDiscount;
                }
            } else {
                promoDiscount = promoCodeData.value;
            }

            appliedPromoData = { ...promoCodeData, "Type": "Promo" };
            // When promo is applied with offer, remove offer discount
            if (offerId && offerDiscount > 0) {
                offerDiscount = 0;
            }
        }

        if (actionType === "removePromo") {
            promoDiscount = 0;

            // Ensure we have offer data
            if (offerId) {
                const offerData = await Offers.findOne({ where: { offerId } });

                if (offerData) {
                    offerDiscount = (offerData.type === "Percentage")
                        ? (finalAmount * offerData.value) / 100
                        : offerData.value;
                } else {
                    offerDiscount = 0;
                }
            } else {
                offerDiscount = 0;
            }

        }

        console.log(
            "promoDiscount", promoDiscount
        )

        const discountedAmount = estimatedAmount - (offerDiscount + promoDiscount);
        const finalTotalAmount = discountedAmount + taxAmount + driverBeta;



        res.status(200).json({
            success: true,
            message: actionType === "applyPromo"
                ? "Promo applied successfully"
                : "Promo removed, offer applied if available",
            estimatedAmount: Math.ceil(estimatedAmount),
            offerDiscount: Math.ceil(offerDiscount),
            promoDiscount: Math.ceil(promoDiscount),
            // discountedAmount: Math.ceil(discountedAmount),
            finalAmount: Math.ceil(finalTotalAmount),
            taxAmount: Math.ceil(taxAmount),
            driverBeta: Math.ceil(driverBeta),
            discountDetails: actionType === "applyPromo"
                ? appliedPromoData
                : appliedOfferData,

        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Internal Server Error",
            error: err
        });
    }
};
