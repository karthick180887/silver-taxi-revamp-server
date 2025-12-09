import { Request, Response } from "express";
import { Offers } from "../../core/models/offers";

export const offersController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.query.adminId as string;

        const offers = await Offers.findAll({
            where: { adminId, status: true }
        });

        res.status(200).json({
            success: true,
            message: "Offers fetched successfully",
            data: offers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

