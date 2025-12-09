import { Request, Response } from "express";
import { PopularRoutes } from "../../core/models"; // Make sure to create this model

// Get all popular routes
export const getAllPopularRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const popularRoutes = await PopularRoutes.findAll({
            where: { adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        res.status(200).json({
            success: true,
            message: "Popular routes retrieved successfully",
            data: popularRoutes,
        });
    } catch (error) {
        console.error("Error fetching popular routes:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching popular routes",
        });
    }
};

// Get a single popular route by ID
export const getPopularRouteById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const popularRoute = await PopularRoutes.findOne({
            where: { routeId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        if (!popularRoute) {
            res.status(404).json({
                success: false,
                message: "Popular route not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Popular route retrieved successfully",
            data: popularRoute,
        });
    } catch (error) {
        console.error("Error fetching popular route:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching popular route",
        });
    }
};

// Create a new popular route
export const createPopularRoute = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            from,
            to,
            fromImage,
            toImage,
            distance,
            duration,
            price,
            status
        } = req.body;

        const fields = ["from", "to"];
        const missingFields = fields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            });
            return;
        }

        const newRoute = await PopularRoutes.create({
            adminId,
            from,
            to,
            fromImage,
            toImage,
            distance,
            duration,
            price,
            status
        });

        res.status(201).json({
            success: true,
            message: "Popular route created successfully",
            data: newRoute,
        });
    } catch (error) {
        console.error("Error creating popular route:", error);
        res.status(500).json({
            success: false,
            message: "Error creating popular route",
        });
    }
};

// Update an existing popular route
export const updatePopularRoute = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            from,
            to,
            distance,
            fromImage,
            toImage,
            duration,
            price,
            status
        } = req.body;

        const popularRoutes = await PopularRoutes.findOne({
            where: { routeId: id }
        });

        if (!popularRoutes) {
            res.status(404).json({
                success: false,
                message: "Popular route not found",
            });
            return;
        }

        const updatedRoute = await popularRoutes.update({
            from,
            to,
            fromImage,
            toImage,
            distance,
            duration,
            price,
            status
        });

        await updatedRoute.save();

        res.status(200).json({
            success: true,
            message: "Popular route updated successfully",
            data: updatedRoute,
        });
    } catch (error) {
        console.error("Error updating popular route:", error);
        res.status(500).json({
            success: false,
            message: "Error updating popular route",
        });
    }
};

// Delete a popular route
export const deletePopularRoute = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const popularRoute = await PopularRoutes.findOne({
            where: { routeId: id }
        });

        if (!popularRoute) {
            res.status(404).json({
                success: false,
                message: "Popular route not found",
            });
            return;
        }

        await popularRoute.destroy({force: true});

        res.status(200).json({
            success: true,
            message: "Popular route deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting popular route:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting popular route",
        });
    }
};

// Multi-delete popular routes
export const multiDeletePopularRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { routeIds } = req.body;

        if (!Array.isArray(routeIds) || routeIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: routeIds must be an array of route IDs",
            });
            return;
        }

        const popularRoutes = await PopularRoutes.findAll({
            where: { routeId: routeIds }
        });

        if (popularRoutes.length === 0) {
            res.status(404).json({
                success: false,
                message: "No popular routes found with the provided IDs",
            });
            return;
        }

        await Promise.all(popularRoutes.map(route => route.destroy({ force: true })));

        res.status(200).json({
            success: true,
            message: "Popular routes deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting popular routes:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting popular routes",
        });
    }
};
