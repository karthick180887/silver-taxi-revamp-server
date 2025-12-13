import { Request, Response } from "express";
import { Service } from "../../../core/models/services";
import { getConfigKey } from "../../../../common/services/node-cache";


export const getServices = async (req: Request, res: Response) => {
    const adminId = req.query.adminId ?? req.body.adminId;
    const customerId = req.query.customerId ?? req.body.customerId;

    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Customer id is required",
        });
        return;
    }

    const services = await Service.findAll({
        where: { adminId },
        attributes: ["serviceId", "name", "isActive", "minKm"]
    });

    res.status(200).json({
        success: true,
        message: "fetched services successfully",
        data: services
    });
    return;
}

export const getConfigKeys = async (req: Request, res: Response) => {
    const adminId = req.query.adminId ?? req.body.adminId;
    const customerId = req.query.customerId ?? req.body.customerId;

    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Customer id is required",
        });
        return;
    }

    try {
        const keys = ["google_map_key", "razorpay_key"]; // whitelist
        const result: Record<string, string | null> = {};

        for (const key of keys) {
            result[key] = await getConfigKey(key);
        }

        res.status(200).json({
            success: true,
            message: "key fetch successfully",
            data: {
                google_maps_key: result["google_map_key"],
                razorpay_key: result["razorpay_key"]
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal error"
        });
    }
}