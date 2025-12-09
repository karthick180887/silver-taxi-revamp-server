import { Response, Request } from "express";
import { VehicleTypes, Vehicle } from "../../..//core/models";
import { vehicleSchema, vehicleUpdateSchema } from "../../../../common/validations/driverSchema";
import { vehicleUpdateWithDocumentStatus } from "../../../core/function/driverFunctions";



export const getVehicles = async (req: Request, res: Response) => {

    const adminId = req.query.adminId ?? req.body.adminId;
    const driverId = req.query.driverId ?? req.body.driverId;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    const vehicles = await Vehicle.findAll({
        where: { driverId, adminId },
        attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
    });

    res.status(200).json({
        success: true,
        message: "Driver vehicles fetched successfully",
        data: vehicles
    });
    return;
}


export const getVehicleTypes = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;

    const vehicleTypes = await VehicleTypes.findAll({
        where: { adminId },
        attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
    });

    res.status(200).json({
        success: true,
        message: "Vehicle types retrieved successfully",
        data: vehicleTypes,
    });

}

export const deleteVehicleTypes = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { type } = req.params;

    console.log("vehicle type delete :", type);

    const vehicleTypes = await VehicleTypes.findOne({
        where: { adminId, name: type.trim().toLowerCase() },
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
        message: "Vehicle types retrieved successfully",
        data: vehicleTypes,
    });

}


export const createVehicle = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;

    try {
        if (!driverId) {
            res.status(401).json({
                success: false,
                message: "Driver ID is required"
            });
            return;
        }

        const validation = vehicleSchema.safeParse(req.body);
        if (!validation.success) {

            const formattedErrors = validation.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: formattedErrors
            });
            return;
        }

        const {
            vehicleName, vehicleType, vehicleNumber,
            vehicleYear, fuelType, rcBookImageFront,
            rcBookImageBack, rcExpiryDate, insuranceImage,
            insuranceExpiryDate, pollutionImage, pollutionExpiryDate
        } = validation.data;

        const createVehicle = await Vehicle.create({
            adminId,
            driverId,
            isActive: false,
            isAdminVehicle: false,
            name: vehicleName,
            type: vehicleType,
            vehicleNumber: vehicleNumber,
            vehicleYear: vehicleYear,
            fuelType: fuelType,
            rcBookImageFront: rcBookImageFront,
            rcBookImageBack: rcBookImageBack,
            rcExpiryDate: rcExpiryDate ? new Date(rcExpiryDate) : undefined,
            insuranceImage: insuranceImage,
            insuranceExpiryDate: insuranceExpiryDate,
            pollutionImage: pollutionImage,
            pollutionExpiryDate: pollutionExpiryDate ? new Date(pollutionExpiryDate) : undefined,
        });



        createVehicle.vehicleId = `veh-${createVehicle.id}`;
        await createVehicle.save();
        res.status(200).json({
            success: true,
            message: "Vehicle created successfully",
            data: createVehicle
        });
        return;
        // }
        // else {
        //     res.status(400).json({
        //         success: false,
        //         message: "Vehicle already exists for this driver",
        //     });
        //     return;
        // }

    }

    catch (error) {
        console.error("Error in vehicle creation:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }



}


export const updateVehicle = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { vehicleId } = req.body;

    try {
        if (!vehicleId) {
            res.status(401).json({
                success: false,
                message: "Vehicle ID is required"
            });
            return;
        }

        if (!driverId) {
            res.status(401).json({
                success: false,
                message: "Driver ID is required"
            });
            return;
        }

        const vehicle = await Vehicle.findOne({
            where: {
                vehicleId,
                driverId,
                adminId
            }
        });

        if (!vehicle) {
            res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
            return;
        }

        const validation = vehicleUpdateSchema.safeParse(req.body);
        if (!validation.success) {

            const formattedErrors = validation.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: formattedErrors
            });
            return;
        }

        const validatedData = validation.data;
        const updateData: any = { ...validatedData };

        // Convert dates to Date objects if present
        if (validatedData.rcExpiryDate) {
            updateData.rcExpiryDate = new Date(validatedData.rcExpiryDate);
        }
        if (validatedData.insuranceExpiryDate) {
            updateData.insuranceExpiryDate = new Date(validatedData.insuranceExpiryDate);
        }
        if (validatedData.pollutionExpiryDate) {
            updateData.pollutionExpiryDate = new Date(validatedData.pollutionExpiryDate);
        }

        // Define document fields to update
        const documentFields = [
            'rcBookImageFront',
            'rcBookImageBack',
            'insuranceImage',
            'pollutionImage'
        ];

        // Use the utility function to update document statuses
        vehicleUpdateWithDocumentStatus(vehicle, updateData, documentFields, true);

        // Update the model with validated data including dates
        await vehicle.update(updateData);

        // Set additional fields
        if (Object.keys(updateData).length > 0) {
            vehicle.isUpdated = true;
        }

        // Save all changes
        await vehicle.save();

        res.status(200).json({
            success: true,
            message: "Vehicle updated successfully",
            data: vehicle
        });
        return;

    } catch (error) {
        console.error("Error in vehicle update:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
}

export const setVehicleStatus = async (req: Request, res: Response) => {
    const adminId = req.query.adminId ?? req.body.adminId;
    const driverId = req.query.driverId ?? req.body.driverId;
    const { vehicleId } = req.body;
    try {

        if (!vehicleId) {
            res.status(404).json({
                success: false,
                message: " Vehicle ID is required."
            });
            return;
        }
        if (!driverId) {
            res.status(404).json({
                success: false,
                message: "Driver ID is required.",
            });
            return;
        }
        const vehicles = await Vehicle.findAll({
            where: {
                driverId
            },
            attributes: [
                "id",
                "vehicleId",
                "isActive"
            ]
        });

        if (vehicles.length === 0) {
            res.status(404).json({
                success: false,
                message: "No vehicles found for this driver."
            });
            return;
        }

        await Promise.all(
            vehicles.map(vehicle => {
                return vehicle.update({
                    isActive: vehicle.vehicleId === vehicleId
                });
            })
        );

        res.status(200).json({
            success: true,
            message: "Vehicle active status updated successfully."
        });
        return;
    }
    catch (error) {
        console.error("Error while update vehicle status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
        return;
    }
}