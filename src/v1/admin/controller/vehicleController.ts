import { Request, Response } from "express";
import { Vehicle } from "../../core/models/vehicles";
import { Tariff, VehicleTypes } from "../../core/models";
import fs from 'fs/promises';
import { uploadFileToMiniIOS3 } from "../../../utils/minio.image";
import { Op } from "sequelize";



// Get all vehicles
export const getAllVehicles = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { unassigned } = req.query;

        const where: any = { adminId };
        // Default to unassigned vehicles (driverId is null) unless explicitly requested otherwise
        // STRICT REQUIREMENT: driverId is NULL AND imageUrl is NOT NULL
        if (unassigned !== 'false') {
            where.driverId = null;
            where.imageUrl = { [Op.ne]: null };
        }

        const vehicles = await Vehicle.findAll({
            where,
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }

        });
        res.status(200).json({
            success: true,
            message: "Vehicles retrieved successfully",
            data: vehicles,
        });
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vehicles",
        });
    }
};

// Get all vehicles admin
export const getAllVehiclesAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vehicles = await Vehicle.findAll({
            where: { adminId, isAdminVehicle: true },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            order: [['order', 'ASC']]

        });
        res.status(200).json({
            success: true,
            message: "Vehicles retrieved successfully",
            data: vehicles,
        });
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vehicles",
        });
    }
};


// Get all active vehicles
export const getActiveVehicles = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vehicles = await Vehicle.findAll({
            where: { adminId, isActive: true },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });
        res.status(200).json({
            success: true,
            message: "Active vehicles retrieved successfully",
            data: vehicles,
        });
    } catch (error) {
        console.error("Error fetching active vehicles:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching active vehicles",
        });
    }
}


// Get a single vehicle by ID
export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findOne({
            where: { vehicleId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        if (!vehicle) {
            res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Vehicle retrieved successfully",
            data: vehicle,
        });

    } catch (error) {
        console.error("Error fetching vehicle:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vehicle",

        });

    }
};

// Create a new vehicle
export const createVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
        // console.log("Request body:", req.body);
        // console.log("Uploaded file:", req.file); // Check if file is received correctly

        const adminId = req.body.adminId ?? req.query.adminId;
        const imageUrl = req.file;  // Ensure this exists
        const {
            name, type, fuelType, isActive,
            seats, bags, order, permitCharge,
        } = req.body;

        if (!name || !type) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (name, type)",
            });
            return;
        }

        const vehicleOrderExists = await Vehicle.findOne({
            where: { adminId, order }
        });

        if (vehicleOrderExists) {
            await vehicleOrderExists.update({
                order: 0
            })
        }


        const newVehicle = await Vehicle.create({
            adminId,
            name,
            type,
            fuelType: fuelType ?? 'Petrol',
            isActive: isActive ?? true,
            seats: seats ?? 0,
            bags: bags ?? 0,
            order: order ?? null,
            permitCharge: permitCharge ?? 0,
            isAdminVehicle: true
        });

        newVehicle.vehicleId = `veh-${newVehicle.id}`;
        await newVehicle.save();

        if (imageUrl) {
            console.log("Processing image upload...");
            try {
                const imageBuffer = await fs.readFile(imageUrl.path);
                const uploadedImageUrl = await uploadFileToMiniIOS3(imageBuffer, `vehicle/${newVehicle.vehicleId}.webp`);

                newVehicle.imageUrl = uploadedImageUrl ?? '';
                await newVehicle.save();

                // Delete temp file
                await fs.unlink(imageUrl.path).catch(err =>
                    console.error("Error deleting temporary file:", err)
                );
            } catch (error) {
                console.error("Error processing vehicle image:", error);
            }
        }


        res.status(201).json({
            success: true,
            message: "Vehicle created successfully",
            data: newVehicle,
        });
    } catch (error) {
        console.error("Error creating vehicle:", error);
        res.status(500).json({
            success: false,
            message: "Error creating vehicle",
        });
    }
};


// Update an existing vehicle
export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            name, type, fuelType,
            imageUrl, seats, bags,
            order, permitCharge,
            isActive
        } = req.body;


        const vehicle = await Vehicle.findOne({
            where: { vehicleId: id }
        });

        if (!vehicle) {
            res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
            return;
        }

        const vehicleOrderExists = await Vehicle.findOne({
            where: { order }
        });

        if (vehicleOrderExists) {
            await vehicleOrderExists.update({
                order: 0
            });
        }

        const updatedVehicle = await vehicle.update({
            name,
            type,
            fuelType,
            imageUrl: imageUrl ?? null,
            seats,
            bags,
            order,
            permitCharge: permitCharge ?? 0,
            isActive: isActive ?? true,
        });

        res.status(200).json({
            success: true,
            message: "Vehicle updated successfully",
            data: updatedVehicle,
        });
    } catch (error) {
        console.error("Error updating vehicle:", error);
        res.status(500).json({
            success: false,
            message: "Error updating vehicle",

        });
    }
};

// Delete a vehicle
export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findOne({
            where: { vehicleId: id }
        });

        if (!vehicle) {
            res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
            return;
        }

        if (vehicle.vehicleId) {
            const tariff = await Tariff.findOne({
                where: {
                    adminId: vehicle.adminId,
                    vehicleId: vehicle.vehicleId
                }
            })

            if (tariff) {
                await tariff.destroy({ force: true });
            }
        }

        await vehicle.destroy({ force: true });


        res.status(200).json({
            success: true,
            message: "Vehicle deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting vehicle",

        });
    }
};

// Multi delete vehicles
export const multiDeleteVehicles = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vehicleIds } = req.body;

        if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: vehicleIds must be an array of vehicle IDs",
            });
            return;
        }

        const vehicles = await Vehicle.findAll({
            where: { vehicleId: vehicleIds }
        });

        if (vehicles.length === 0) {
            res.status(404).json({
                success: false,
                message: "No vehicles found with the provided IDs",
            });
            return;
        }

        await Promise.all(vehicles.map(vehicle => vehicle.destroy()));

        res.status(200).json({
            success: true,
            message: "Vehicles deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting vehicles:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting vehicles",
        });
    }
};

// Get all vehicle types
export const getVehicleTypes = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;

    const vehicleTypes = await VehicleTypes.findAll({
        where: { adminId, isActive: true },
        attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        message: "Vehicle types retrieved successfully",
        data: vehicleTypes,
    });

}

// Create a new vehicle type
export const createVehicleTypes = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { name } = req.body;


    if (!name) {
        res.status(404).json({
            success: false,
            message: "Missing required fields (name)",
        });
        return;
    }

    const vehicleType = await VehicleTypes.findOne({
        where: { name: name.trim().toLowerCase(), adminId }
    });

    if (vehicleType) {
        res.status(404).json({
            success: false,
            message: "Vehicle type already exists",
        });
        return;
    }

    const vehicleTypes = await VehicleTypes.create({
        name: name.trim().toLowerCase(),
        adminId
    });

    vehicleTypes.vTypeId = `vtype-${vehicleTypes.id}`
    await vehicleTypes.save();

    // console.log("vehicleTypes created",vehicleTypes);

    res.status(200).json({
        success: true,
        message: "Vehicle types retrieved successfully",
        data: vehicleTypes,
    });
    return;
}


// Accept vehicle types
export const acceptVehicleTypes = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { name } = req.params;
    const { acceptedVehicleTypes } = req.body;

    if (!name || !acceptedVehicleTypes) {
        res.status(400).json({
            success: false,
            message: "Missing required fields (name, acceptedVehicleTypes)",
        });
        return;
    }

    try {
        const vehicleType = await VehicleTypes.findOne({
            where: { name: name.trim().toLowerCase(), adminId }
        });

        if (!vehicleType) {
            res.status(404).json({
                success: false,
                message: "Vehicle type not found",
            });
            return;
        }

        vehicleType.acceptedVehicleTypes = acceptedVehicleTypes;
        await vehicleType.save();

        res.status(200).json({
            success: true,
            message: "Vehicle type config updated successfully",
            data: vehicleType,
        });
        return;
    } catch (error) {
        console.error("Error updating vehicle type config:", error);
        res.status(500).json({
            success: false,
            message: "Error updating vehicle type config",
        });
        return;
    }
}

// Get all vehicle types
export const deleteVehicleTypes = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { name } = req.params;

    console.log("vehicle type delete :", name);

    try {
        const vehicleTypes = await VehicleTypes.findOne({
            where: { adminId, name: name.trim().toLowerCase() }
        });

        if (!vehicleTypes) {
            res.status(404).json({
                success: false,
                message: "Vehicle type not found",
            });
            return;
        }

        await vehicleTypes.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: "Vehicle type deleted successfully",
            data: vehicleTypes,
        });
    } catch (error) {
        console.error("Error deleting vehicle type:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting vehicle type",
        });
    }

}
