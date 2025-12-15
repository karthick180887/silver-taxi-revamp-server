import { Request, Response } from "express";
import { Service, Tariff, Vehicle } from "../../../core/models/index";
import { getConfigKey } from "../../../../common/services/node-cache";


export const getServices = async (req: Request, res: Response) => {
    const adminId = req.query.adminId ?? req.body.adminId;


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

export const getVehiclesByService = async (req: Request, res: Response) => {
    const adminId = req.query.adminId ?? req.body.adminId;
    const serviceId = req.query.serviceId as string;

    if (!serviceId) {
        res.status(400).json({
            success: false,
            message: "Service Id is required",
        });
        return;
    }

    try {
        console.log(`DEBUG: Fetching vehicles for serviceId: ${serviceId}, adminId: ${adminId}`);

        const tariffs = await Tariff.findAll({
            where: { serviceId, adminId: String(adminId), status: true },
            include: [
                {
                    model: Vehicle,
                    as: 'vehicles',
                    where: { isActive: true },
                    attributes: ['vehicleId', 'name', 'imageUrl', 'seats', 'isActive']
                }
            ],
            attributes: ['tariffId', 'price', 'increasedPrice', 'extraPrice', 'description', 'vehicleId']
        });

        console.log(`DEBUG: Found ${tariffs.length} tariffs`);

        // Format for frontend
        const data = tariffs.map((t: any) => {
            const vehicle = t.vehicles; // Access via the alias 'vehicles' (which holds a single object here)

            if (!vehicle) {
                console.warn(`DEBUG: Tariff ${t.tariffId} has no associated active vehicle data (vehicleId: ${t.vehicleId})`);
                return null;
            }

            const updatedPrice = t.increasedPrice
                ? Number(t.price) + Number(t.increasedPrice)
                : Number(t.price);

            return {
                id: vehicle.vehicleId,
                tariffId: t.tariffId,
                vehicleId: vehicle.vehicleId,
                name: vehicle.name,
                image: vehicle.imageUrl,
                seaters: vehicle.seats,
                price: updatedPrice,
                originalPrice: Number(t.price),
                description: t.description
            };
        }).filter(item => item !== null); // Remove nulls

        res.status(200).json({
            success: true,
            message: "Vehicles fetched successfully",
            data: data
        });

    } catch (error) {
        console.error("DEBUG: Error in getVehiclesByService:", error);
        res.status(500).json({
            success: false,
            message: "Internal error fetching vehicles",
            error: String(error)
        });
    }
}