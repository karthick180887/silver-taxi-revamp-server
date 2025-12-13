import { Request, Response } from "express";
import { DriverNotification } from "../../../core/models/index"; // Import the Notification model
import { Op } from "sequelize";

// Get all notifications
export const getAllNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId; // Assuming notifications are user-specific
        const driverId = req.body.driverId ?? req.query.id;

        const notifications = await DriverNotification.findAll({
            where: { adminId, driverId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.status(200).json({
            success: true,
            message: "Notifications retrieved successfully",
            data: notifications,
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching notifications",
            error: error
        });
    }
};

export const getSingleNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const driverId = req.body.driverId ?? req.query.id;
        const { id } = req.params;

        const notifications = await DriverNotification.findAll({
            where: { adminId, driverId, notifyId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        res.status(200).json({
            success: true,
            message: "Notifications retrieved successfully",
            data: notifications,
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching notifications",
            error: error
        });
    }
};

export const getAllOffsetNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId; // Assuming notifications are user-specific
        const driverId = req.body.driverId ?? req.query.id;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 15;
        let offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;

        if (!req.query.offset && req.query.page) {
            offset = (page - 1) * limit;
        }
        const totalNotifications = await DriverNotification.count({
            where: { adminId, driverId }
        });

        // Ensure offset is not greater than totalNotifications
        if (offset >= totalNotifications) {
            res.status(200).json({
                success: true,
                message: "No more notifications to retrieve",
                data: [],
                total: totalNotifications,
                offset: 0
            });
            return;
        }

        const notifications = await DriverNotification.findAll({
            where: { adminId, driverId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            order: [['createdAt', 'DESC']],
            offset,
            limit
        });

        res.status(200).json({
            success: true,
            message: "Offset Notifications retrieved successfully",
            data: notifications,
            total: totalNotifications,
            offset: offset + notifications.length // Update offset based on the number of notifications retrieved
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching notifications",
            error: error
        });
    }
};

// Mark a notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const driverId = req.body.driverId ?? req.query.id; // Assuming driverId is passed in the request body or query
        const { id } = req.params; // Notification ID from the request parameters

        const notification = await DriverNotification.findOne({
            where: { notifyId: id, adminId, driverId }
        });

        if (!notification) {
            res.status(404).json({
                success: false,
                message: "Notification not found",
            });
            return;
        }

        notification.read = true; // Assuming there's a 'read' field in the Notification model
        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read successfully",
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({
            success: false,
            message: "Error marking notification as read",
            error: error
        });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const driverId = req.body.driverId ?? req.query.id;
        await DriverNotification.update(
            { read: true },
            {
                where: { adminId, read: false, driverId },
            }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read successfully",
        });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({
            success: false,
            message: "Error marking all notifications as read",
            error: error
        });
    }
};


export const bulkDeleteNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const driverId = req.body.driverId ?? req.query.id;
        const { ids } = req.body; // Assuming ids are passed in the request body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({
                success: false,
                message: "No notification IDs provided for deletion",
            });
            return;
        }

        const notifications = await DriverNotification.findAll({
            where: {
                notifyId: { [Op.in]: ids },
                adminId,
                driverId
            },
        });
        if (notifications.length === 0) {
            res.status(404).json({
                success: false,
                message: "No notifications found with the provided IDs",
            });
            return;
        }

        await Promise.all(notifications.map(notification => notification.destroy({ force: true })))
            .catch(error => {
                console.error("Error deleting notifications:", error);
            });

        res.status(200).json({
            success: true,
            message: "Notifications deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting notifications:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting notifications",
            error: error
        });
    }
}