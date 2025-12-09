import { Request, Response } from "express";
import { IPTracking } from "../../core/models/ipTracking"; // Ensure the import path is correct

// Get all IP tracking records
export const getAllIPTrackings = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const ipTrackings = await IPTracking.findAll({
            where: { adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        res.status(200).json({
            success: true,
            message: "IP tracking records retrieved successfully",
            data: ipTrackings,
        });
    } catch (error) {
        console.error("Error fetching IP tracking records:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching IP tracking records",
        });
    }
};

// Get a single IP tracking record by ID
export const getIPTrackingById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const ipTracking = await IPTracking.findOne({
            where: { ipAddressId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });


        if (!ipTracking) {
            res.status(404).json({
                success: false,
                message: "IP tracking record not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "IP tracking record retrieved successfully",
            data: ipTracking,
        });
    } catch (error) {
        console.error("Error fetching IP tracking record:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching IP tracking record",
        });
    }
};

// Create a new IP tracking record
export const createIPTracking = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { ipAddress, visitTime, ipRange, userAgent, pageVisited } = req.body;



        if (!ipAddress) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (ipAddress)",
            });
            return;
        }

        const newIPTracking = await IPTracking.create({
            adminId,
            ipAddress,
            visitTime: visitTime ?? new Date(),
            ipRange: ipRange ?? null,
            userAgent: userAgent ?? null,
            pageVisited: pageVisited ?? null

        });
        newIPTracking.ipAddressId = `ip-${newIPTracking.id}`;
        await newIPTracking.save();

        res.status(201).json({
            success: true,
            message: "IP tracking record created successfully",
            data: newIPTracking,
        });
    } catch (error) {
        console.error("Error creating IP tracking record:", error);
        res.status(500).json({
            success: false,
            message: "Error creating IP tracking record",
        });
    }
};

// Update an existing IP tracking record
export const updateIPTracking = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const { ipAddress, ipRange, userAgent, pageVisited } = req.body;


        const ipTracking = await IPTracking.findOne({
            where: { ipAddressId: id },
        });

        if (!ipTracking) {
            res.status(404).json({
                success: false,
                message: "IP tracking record not found",
            });
            return;
        }

        const updatedIPTracking = await ipTracking.update({
            adminId,
            ipAddress,
            ipRange,
            userAgent,
            pageVisited
        });

        res.status(200).json({
            success: true,
            message: "IP tracking record updated successfully",
            data: updatedIPTracking,
        });
    } catch (error) {
        console.error("Error updating IP tracking record:", error);
        res.status(500).json({
            success: false,
            message: "Error updating IP tracking record",
        });
    }
};

// Delete an IP tracking record
export const deleteIPTracking = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const ipTracking = await IPTracking.findOne({
            where: { ipAddressId: id }
        });

        if (!ipTracking) {
            res.status(404).json({
                success: false,
                message: "IP tracking record not found",
            });
            return;
        }

        await ipTracking.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: "IP tracking record deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting IP tracking record:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting IP tracking record",
        });
    }
};


export const multiDeleteIPTrackings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ipTrackingIds } = req.body;

        if (!Array.isArray(ipTrackingIds) || ipTrackingIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: ipTrackingIds must be an array of ipTracking IDs",
            });
            return;
        }

        const ipTrackings = await IPTracking.findAll({
            where: { ipAddressId: ipTrackingIds }
        });

        if (ipTrackings.length === 0) {
            res.status(404).json({
                success: false,
                message: "No ipTrackings found with the provided IDs",
            });
            return;
        }

        await Promise.all(ipTrackings.map(ipTracking => ipTracking.destroy({ force: true })));

        res.status(200).json({
            success: true,
            message: "IP Trackings deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting ipTrackings:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting ipTrackings",
        });
    }
};