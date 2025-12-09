import { Request, Response } from "express";
import { Tariff, Vehicle, Service } from "../../core/models";
import { Op } from "sequelize";

// Get all tariffs
export const getAllTariffs = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const tariffs = await Tariff.findAll({
            where: { adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [
                {
                    model: Vehicle,
                    as: 'vehicles',
                    // where: { isActive: true },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                },
                {
                    model: Service,
                    as: 'services',
                    where: { isActive: true },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                }
            ],
        });

        const updatedTariffs = tariffs.map((tariff: any) => {
            const updatedPrice = tariff.increasedPrice
                ? tariff.price + tariff.increasedPrice
                : tariff.price;

            return {
                ...tariff.toJSON(),
                price: updatedPrice,
            };
        });
        res.status(200).json({
            success: true,
            message: "Tariffs retrieved successfully",
            data: updatedTariffs,
        });
    } catch (error) {
        console.error("Error fetching tariffs:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tariffs",
        });
    }
};

export const getVendorTariffs = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "vendorId is required in Tariffs",
            });
            return;
        }

        const tariffs = await Tariff.findAll({
            where: { adminId, vendorId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [
                {
                    model: Vehicle,
                    as: 'vehicles',
                    where: { isActive: true },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                },
                {
                    model: Service,
                    as: 'services',
                    where: { isActive: true },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                }
            ],
        });

        const updatedTariffs = tariffs.map((tariff: any) => {
            const updatedPrice = tariff.increasedPrice
                ? tariff.price + tariff.increasedPrice
                : tariff.price;

            return {
                ...tariff.toJSON(),
                price: updatedPrice,
            };
        });

        res.status(200).json({
            success: true,
            message: "Vendor Tariffs retrieved successfully",
            data: updatedTariffs,
        });
    } catch (error) {
        console.error("Error fetching vendor tariffs:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor tariffs",
        });
    }
};

export const getAllActiveTariffs = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const tariffs = await Tariff.findAll({
            where: { adminId, status: true },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            // include: [
            //     {
            //         model: Vehicle,
            //         as: 'vehicles',
            //         where: { isActive: true },
            //         attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
            //     },
            //     {
            //         model: Service,
            //         as: 'services',
            //         where: { isActive: true },
            //         attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
            //     }
            // ],
        });

        res.status(200).json({
            success: true,
            message: "Tariffs retrieved successfully",
            data: tariffs,
        });
    } catch (error) {
        console.error("Error fetching tariffs:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tariffs",
        });
    }
};

// Get a single tariff by ID
export const getTariffById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tariff = await Tariff.findOne({
            where: { tariffId: id },
            include: [
                {
                    model: Vehicle,
                    as: 'vehicles',
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                },
                {
                    model: Service,
                    as: 'services',
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                }
            ]
        });

        if (!tariff) {
            res.status(404).json({
                success: false,
                message: "Tariff not found",
            });
            return;
        }
        const updatedPrice = tariff.increasedPrice
            ? tariff.price + tariff.increasedPrice
            : tariff.price;

        const updatedTariff = {
            ...tariff.toJSON(),
            price: updatedPrice,
        };

        res.status(200).json({
            success: true,
            message: " Tariff retrieved successfully",
            data: updatedTariff,
        });
    } catch (error) {
        console.error("Error fetching tariff:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tariff",
        });
    }
};

// Get a single tariff by vehicle ID
export const getTariffByVehicleId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vehicleId, serviceId, createdBy } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;
        const tariff = await Tariff.findOne({
            where: {
                vehicleId: vehicleId,
                serviceId: serviceId,
                adminId,
                createdBy
            }
        });

        if (!tariff) {
            res.status(404).json({
                success: false,
                message: "Tariff not found",
            });
            return;
        }

        const updatedPrice = tariff.increasedPrice
            ? tariff.price + tariff.increasedPrice
            : tariff.price;

        const updatedTariff = {
            ...tariff.toJSON(),
            price: updatedPrice,
        };

        res.status(200).json({
            success: true,
            message: "Tariff retrieved successfully",
            data: updatedTariff,
        });
    } catch (error) {
        console.error("Error fetching tariff:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tariff",
        });
    }
};

// Get a single tariff by service ID
export const getTariffByServiceId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { serviceId } = req.params;
        const tariff = await Tariff.findOne({
            where: { serviceId: serviceId }
        });

        if (!tariff) {
            res.status(404).json({
                success: false,
                message: "Tariff not found",
            });
            return;
        }

        const updatedPrice = tariff.increasedPrice
            ? tariff.price + tariff.increasedPrice
            : tariff.price;

        const updatedTariff = {
            ...tariff.toJSON(),
            price: updatedPrice,
        };

        res.status(200).json({
            success: true,
            message: "Tariff retrieved successfully",
            data: updatedTariff,
        });
    } catch (error) {
        console.error("Error fetching tariff:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tariff",
        });
    }
};

// Create a new tariff
export const createTariff = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;
        const {
            vehicleId,
            serviceId,
            price,
            status, extraPrice,
            includes,
            type,
            createdBy,
            driverBeta,
            description
        } = req.body;

        if (!price || !vehicleId || !serviceId) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (price, vehicleId, serviceId, extraPrice)",
            });
            return;
        }

        let existingTariff;
        if (type !== "" && type !== null && type !== undefined) {
            existingTariff = await Tariff.findOne({
                where: { serviceId, vehicleId, type, createdBy }
            });
        } else {
            existingTariff = await Tariff.findOne({
                where: { serviceId, vehicleId, createdBy }
            });
        }

        if (existingTariff) {

            existingTariff.update({
                price,
                extraPrice,
                includes: includes ?? existingTariff.includes,
                type: type ?? existingTariff.type,
                description: description ?? existingTariff.description
            });

            res.status(200).json({
                success: true,
                message: "Tariff updated successfully",
                data: existingTariff,
            });
            return;
        }

        const newTariff = await Tariff.create({
            adminId,
            vendorId: createdBy === "Vendor" ? vendorId : null,
            serviceId,
            vehicleId,
            price,
            status: status ?? true,
            extraPrice: extraPrice ?? 0,
            includes,
            type: type ?? null,
            createdBy: createdBy ?? "Admin",
            driverBeta: Number(driverBeta) || 0,
            description
        });

        newTariff.tariffId = `tar-${newTariff.id}`;
        await newTariff.save();

        res.status(201).json({
            success: true,
            message: `${createdBy === "Vendor" ? "Vendor" : "Admin"} tariff created successfully`,
            data: newTariff,
        });
    } catch (error) {
        console.error("Error creating tariff:", error);
        res.status(500).json({
            success: false,
            message: "Error creating tariff",
        });
    }
};


// Update an existing tariff
export const updateTariff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            serviceId, vehicleId, status,
            price, extraPrice, includes,
            type, driverBeta, description
        } = req.body;

        // console.log("req.body ---> ", req.body);
        // console.log("req.body ---> ", req.body.tariffData);

        const tariff = await Tariff.findOne({
            where: { tariffId: id }
        });

        if (!tariff) {
            res.status(404).json({
                success: false,
                message: "Tariff not found",
            });
            return;
        }

        const updatedTariff = await tariff.update({
            serviceId,
            vehicleId,
            status: status ?? false,
            price: price - tariff.increasedPrice,
            type,
            extraPrice,
            includes,
            driverBeta,
            description
        });

        res.status(200).json({
            success: true,
            message: "Tariff updated successfully",
            data: updatedTariff,
        });
    } catch (error) {
        console.error("Error updating tariff:", error);
        res.status(500).json({
            success: false,
            message: "Error updating tariff",
        });
    }
};

// Delete a tariff
export const deleteTariff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const tariff = await Tariff.findOne({
            where: { tariffId: id }
        });

        if (!tariff) {
            res.status(404).json({
                success: false,
                message: "Tariff not found",
            });
            return;
        }

        await tariff.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: "Tariff deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting tariff:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting tariff",
        });
    }
};


