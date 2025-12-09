import { Request, Response } from 'express';
import { DynamicRoute } from '../../core/models';

// Create a new AllIncludes entry
export const createDynamicRoute = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { title, link, image } = req.body;

        // console.log(title, link)

        const newDynamicRoutes = await DynamicRoute.create({
            adminId,
            title,
            link,
            status: true,
            image,
        })

        newDynamicRoutes.routeId = `route-${newDynamicRoutes.id}`
        await newDynamicRoutes.save()

        res.status(201).json({
            success: true,
            message: 'DynamicRoute created successfully',
            data: newDynamicRoutes,
        });
    } catch (error) {
        console.error("Error creating DynamicRoute:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Get all AllIncludes entries
export const getAllDynamicRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const dynamicRoutes = await DynamicRoute.findAll({
            where: { adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });
        res.status(200).json({
            success: true,
            message: "DynamicRoutes fetched successfully",
            data: dynamicRoutes,
        });
    } catch (error) {
        console.error("Error fetching DynamicRoutes:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Get a single AllIncludes entry by ID
export const getDynamicRouteById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;
        const dynamicRoute = await DynamicRoute.findOne({
            where: {
                adminId,
                routeId: id,
            },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });

        if (!dynamicRoute) {
            res.status(404).json({
                success: false,
                message: "DynamicRoute not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "DynamicRoute fetched successfully",
            data: dynamicRoute,
        });
    } catch (error) {
        console.error("Error fetching DynamicRoute by ID:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Update an AllIncludes entry
export const updateDynamicRoute = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const { title, link, image } = req.body;

        const dynamicRoute = await DynamicRoute.findOne({
            where: {
                adminId,
                routeId: id,
            },
        });

        if (!dynamicRoute) {
            res.status(404).json({
                success: false,
                message: "DynamicRoute not found",
            });
            return;
        }

        const updatedDynamicRoute = await dynamicRoute.update({
            title,
            link,
            image,
        });


        res.status(200).json({
            success: true,
            message: "DynamicRoute updated successfully",
            data: updatedDynamicRoute,
        });
    } catch (error) {
        console.error("Error updating DynamicRoute:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Delete an AllIncludes entry
export const deleteDynamicRoute = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;
        const dynamicRoute = await DynamicRoute.findOne({
            where: {
                adminId,
                routeId: id,
            },
        });

        if (!dynamicRoute) {
            res.status(404).json({
                success: false,
                message: "DynamicRoute not found",
            });
            return;
        }

        await dynamicRoute.destroy();

        res.status(200).json({
            success: true,
            message: "DynamicRoute deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting DynamicRoute:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting DynamicRoute",
        });
    }
};


export const multiDeleteDynamicRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { dynamicRouteIds } = req.body;

        if (!Array.isArray(dynamicRouteIds) || dynamicRouteIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: dynamicRouteIds must be an array of dynamicRoute IDs",
            });
            return;
        }

        const dynamicRoutes = await DynamicRoute.findAll({
            where: { routeId: dynamicRouteIds }
        });

        if (dynamicRoutes.length === 0) {
            res.status(404).json({
                success: false,
                message: "No dynamicRoutes found with the provided IDs",
            });
            return;
        }

        await Promise.all(dynamicRoutes.map(dynamicRoute => dynamicRoute.destroy()));

        res.status(200).json({
            success: true,
            message: "DynamicRoutes deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting enquiries:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting dynamicRoutes",
        });
    }
};