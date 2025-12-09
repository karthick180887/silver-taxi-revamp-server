import { Request, Response } from 'express';
import { AllIncludes } from '../../core/models';

// Create a new AllIncludes entry
export const createAllIncludes = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { origin, destination, tollPrice, hillPrice, Km, vehicles } = req.body;

        const newAllIncludes = await AllIncludes.create({
            adminId,
            origin: origin.toLowerCase(),
            destination : destination.toLowerCase(),
            tollPrice,
            hillPrice,
            Km,
            vehicles,
        });

        newAllIncludes.includeId = `incl-${newAllIncludes.id}`;
        await newAllIncludes.save();

        res.status(201).json({
            success: true,
            message: 'AllIncludes entry created successfully',
            data: newAllIncludes,
        });
    } catch (error) {
        console.error("Error creating AllIncludes:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Get all AllIncludes entries
export const getAllIncludes = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const allIncludes = await AllIncludes.findAll({
            where: {
                adminId
            },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });
        res.status(200).json({
            success: true,
            message: "AllIncludes fetched successfully",
            data: allIncludes,
        });
    } catch (error) {
        console.error("Error fetching AllIncludes:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Get a single AllIncludes entry by ID
export const getAllIncludesById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const allIncludes = await AllIncludes.findOne({
            where: {
                adminId: req.body.adminId ?? req.query.adminId,
                includeId: id,
            },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });

        if (!allIncludes) {
            res.status(404).json({
                success: false,
                message: "AllIncludes entry not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "AllIncludes entry fetched successfully",
            data: allIncludes,
        });
    } catch (error) {
        console.error("Error fetching AllIncludes by ID:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Update an AllIncludes entry
export const updateAllIncludes = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const { origin, destination, tollPrice, hillPrice, Km, vehicles } = req.body;

        const allIncludes = await AllIncludes.findOne({
            where: {
                adminId,
                includeId: id,
            },
        });

        if (!allIncludes) {
            res.status(404).json({
                success: false,
                message: "AllIncludes entry not found",
            });
            return;
        }

        await allIncludes.update({
            adminId,
            origin: origin.toLowerCase(),
            destination: destination.toLowerCase(),
            tollPrice,
            hillPrice,
            Km,
            vehicles,
        });

        res.status(200).json({
            success: true,
            message: "AllIncludes entry updated successfully",
            data: allIncludes,
        });
    } catch (error) {
        console.error("Error updating AllIncludes:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Delete an AllIncludes entry
export const deleteAllIncludes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;
        const allIncludes = await AllIncludes.findOne({
            where: {
                adminId,
                includeId: id,
            },
        });
        if (!allIncludes) {
            res.status(404).json({
                success: false,
                message: "AllIncludes entry not found",
            });
            return;
        }

        await allIncludes.destroy({force: true});

        res.status(200).json({
            success: true,
            message: "AllIncludes entry deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting AllIncludes:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting AllIncludes",
        });
    }
};
