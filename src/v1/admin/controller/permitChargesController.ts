import { Request, Response } from 'express';
import { PermitCharges } from '../../core/models';

// Create a new PermitCharges entry
export const createPermitCharges = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { permitData } = req.body;

        if (!Array.isArray(permitData)) {
            res.status(400).json({
                success: false,
                message: "Invalid request: permitData must be an array",
            });
            return;
        }
        
        const formattedData = permitData.map(item => ({
            adminId,
            origin: item.origin.toLowerCase().trim(),
            destination: item.destination.toLowerCase().trim(),
            noOfPermits: item.noOfPermits || 0,
        }));

        const newPermitCharges = await PermitCharges.bulkCreate(formattedData);

        res.status(201).json({
            success: true,
            message: 'PermitCharges entry created successfully',
            data: newPermitCharges,
        });
    } catch (error) {
        console.error("Error creating PermitCharges:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Get all PermitCharges entries
export const getPermitCharges = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const permitCharges = await PermitCharges.findAll({
            where: {
                adminId
            },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });
        res.status(200).json({
            success: true,
            message: "PermitCharges fetched successfully",
            data: permitCharges,
        });
    } catch (error) {
        console.error("Error fetching PermitCharges:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Get a single PermitCharges entry by ID
export const getPermitChargesById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const permitCharges = await PermitCharges.findOne({
            where: {
                adminId: req.body.adminId ?? req.query.adminId,
                permitId: id,
            },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });

        if (!permitCharges) {
            res.status(404).json({
                success: false,
                message: "PermitCharges entry not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "PermitCharges entry fetched successfully",
            data: permitCharges,
        });
    } catch (error) {
        console.error("Error fetching PermitCharges by ID:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Update an PermitCharges entry
export const updatePermitCharges = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const { origin, destination, noOfPermits } = req.body;

        const permitCharges = await PermitCharges.findOne({
            where: {
                adminId,
                permitId: id,
            },
        });

        if (!permitCharges) {
            res.status(404).json({
                success: false,
                message: "PermitCharges entry not found",
            });
            return;
        }

        await permitCharges.update({
            adminId,
            origin: origin.toLowerCase().trim(),
            destination: destination.toLowerCase().trim(),
            noOfPermits,
        });

        res.status(200).json({
            success: true,
            message: "PermitCharges entry updated successfully",
            data: permitCharges,
        });
    } catch (error) {
        console.error("Error updating PermitCharges:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Delete an PermitCharges entry
export const deletePermitCharges = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;
        const permitCharges = await PermitCharges.findOne({
            where: {
                adminId,
                permitId: id,
            },
        });
        if (!permitCharges) {
            res.status(404).json({
                success: false,
                message: "PermitCharges entry not found",
            });
            return;
        }

        await permitCharges.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: "PermitCharges entry deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting PermitCharges:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting PermitCharges",
        });
    }
};
export const multiDeletePermitCharges = async (req: Request, res: Response): Promise<void> => {
    try {
        const { permitIds } = req.body;

        if (!Array.isArray(permitIds) || permitIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: permitIds must be an array of permitCharges IDs",
            });
            return;
        }

        const permitCharges = await PermitCharges.findAll({
            where: { permitId: permitIds }
        });

        if (permitCharges.length === 0) {
            res.status(404).json({
                success: false,
                message: "No permitCharges found with the provided IDs",
            });
            return;
        }

        await Promise.all(permitCharges.map(permitCharges => permitCharges.destroy({ force: true })));

        res.status(200).json({
            success: true,
            message: "permitCharges deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting permitCharges:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting permitCharges",
        });
    }
};
