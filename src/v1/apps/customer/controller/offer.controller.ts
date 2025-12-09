import { Request, Response } from "express";
import dayjs from "../../../../utils/dayjs";
import { debugLog, infoLog } from "../../../../utils/logger";
import { Op } from "sequelize";
import { Offers } from "../../../core/models/offers";
import { OfferUsage } from "../../../core/models/offerUsage";

export const getAllOffers = async (req: Request, res: Response): Promise<void> => {
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

        const offers = await Offers.findAll({
            where: {
                status: true,
                adminId,
                startDate: { [Op.lte]: dayjs().toDate() },
                endDate: { [Op.gt]: dayjs().toDate() },
            },
        });

        const offerUsages = await OfferUsage.findAll({
            where: {
                customerId,
                offerId: { [Op.in]: offers.map((o) => o.offerId) },
            },
            raw: true,
        });

        const validOffers = offers.filter((offer: any) => {
            const usedCount = offerUsages.filter(u => u.offerId === offer.offerId).length;
            const limit = offer.limit ?? 1;
            return usedCount <= limit;
        });

        if (validOffers.length === 0) {
            res.status(200).json({
                success: false,
                message: "No offers available (limit reached)",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Offer fetched",
            data: validOffers
        });
    } catch (err) {
        debugLog(`Error while fetching offer ${err}`);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Error while fetching offer",
            error: err
        });
    }
};



export const getOfferById = async (req: Request, res: Response): Promise<void> => {
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

        const offer = await Offers.findOne({
            where: {
                adminId,
                offerId: id?.toString(),
                status: true,
                endDate: {
                    [Op.or]: [
                        { [Op.gt]: dayjs().toDate() },
                    ]
                },
                startDate: {
                    [Op.lte]: dayjs().toDate()
                }
            }
        });

        if (!offer) {
            res.status(404).json({
                success: false,
                message: "No valid offer found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Offer fetched",
            data: offer
        });
    } catch (err) {
        debugLog(`Error while fetching offer ${err}`);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Error while fetching offer",
            error: err
        });
    }
};