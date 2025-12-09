import { Request, Response } from "express";
import { Notification, NotificationTemplates, Customer, Driver, Vendor } from "../../core/models"; // Import the Notification model
import { sendCustomNotifications } from "../../../common/services/firebase/appNotify";
import fs from 'fs/promises';
import { uploadFileToDOS3 } from "../../../utils/minio.image";
import { Op } from "sequelize";
import dayjs from "../../../utils/dayjs";
import {
    createCustomNotificationSchema,
    updateCustomNotificationSchema,
    getCustomNotificationsQuerySchema,
    customNotificationIdSchema,
    sendCustomNotificationSchema,
    filterCustomNotificationsSchema
} from "../../../common/validations/customNotificationSchema";
import { channel } from "diagnostics_channel";
import { publishNotification } from "../../../common/services/rabbitmq/publisher";
import { getAllRedisDrivers, getDriverFcmToken } from "../../../utils/redis.configs";

// Helper function to format date for display
const formatDateForDisplay = (date: Date | string) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

// Helper function to validate and parse date
const parseAndValidateDate = (dateString: string) => {
    const parsed = dayjs(dateString);
    return parsed.isValid() ? parsed.toDate() : null;
};

// Helper function to get current timestamp in different formats
const getCurrentTimestamp = () => {
    return {
        unix: dayjs().unix(),
        valueOf: dayjs().valueOf(),
        iso: dayjs().toISOString(),
        formatted: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
};

// Get all notifications
export const getAllNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId; // Assuming notifications are user-specific


        const notifications = await Notification.findAll({
            where: { adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            order: [['createdAt', 'DESC']],
            limit: 30
        });

        const unreadNotifications = await Notification.count({ where: { adminId, read: false } });

        res.status(200).json({
            success: true,
            message: "Notifications retrieved successfully",
            data: notifications,
            unReadCount: unreadNotifications
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching notifications",
        });
    }
};

export const getAllOffsetNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId; // Assuming notifications are user-specific

        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 15;
        const totalNotifications = await Notification.count({ where: { adminId } });

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

        const notifications = await Notification.findAll({
            where: { adminId },
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
        });
    }
};

export const getAllVendorNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

        const notifications = await Notification.findAll({
            where: { adminId, vendorId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            order: [['createdAt', 'DESC']],
            limit: 30
        });

        const unreadNotifications = await Notification.count({ where: { adminId, vendorId, read: false } });

        res.status(200).json({
            success: true,
            message: "Notifications retrieved successfully",
            data: notifications,
            unReadCount: unreadNotifications
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching notifications",
        });
    }
};

export const getAllVendorOffsetNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId; // Assuming notifications are user-specific
        const vendorId = req.body.vendorId ?? req.query.id;

        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 15;
        const totalNotifications = await Notification.count({ where: { adminId } });

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

        const notifications = await Notification.findAll({
            where: { adminId, vendorId },
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
        });
    }
};

// Mark a notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Notification ID from the request parameters

        const notification = await Notification.findOne({ where: { notificationId: id } });

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
        });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId; // Assuming notifications are user-specific

        await Notification.update(
            { read: true },
            {
                where: { adminId, read: false }
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
        });
    }
};
export const markAllAsVendorRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId; // Assuming notifications are user-specific
        const vendorId = req.body.vendorId ?? req.query.id;

        await Notification.update(
            { read: true },
            {
                where: { adminId, vendorId, read: false }
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
        });
    }
};

// ==================== CUSTOM NOTIFICATION APIs ====================

// 1. Create custom notification
export const createCustomNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get adminId and vendorId from query parameters (following existing pattern)
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.vendorId;
        const bannerImage = req.file; // Get uploaded file

        console.log("Body", req.body)
        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required",
            });
            return;
        }

        // Validate request body
        const validationResult = createCustomNotificationSchema.safeParse(req.body);
        console.log("Validation Result", validationResult.error)
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationResult.error.errors.map((error) => error.message)
            });
            return;
        }

        const {
            title,
            message,
            target,
            type,
            route,
            particularIds,
            targetAudience,
            targetCustomerIds,
            scheduledAt,
            time
        } = validationResult.data;

        // Set status based on scheduledAt
        const status = scheduledAt ? false : true; // true = active/draft, false = scheduled

        const customNotification = await NotificationTemplates.create({
            adminId,
            templateId: `custom_${dayjs().valueOf()}`, // Generate unique template ID using DayJS timestamp
            title,
            message,
            target,
            type,
            route: route || undefined,
            status,
            particularIds,
            data: {},
            // time: time || scheduledAt || undefined
        });

        // Handle image upload if provided
        if (bannerImage) {
            try {
                // Read the file from the temporary path
                const imageBuffer = await fs.readFile(bannerImage.path);

                // Upload to MinIO
                const imageUrl = await uploadFileToDOS3(imageBuffer, `notification/${customNotification.id}.webp`);

                // Update notification with image URL
                customNotification.image = imageUrl ?? '';
                await customNotification.save();

                // Clean up: Delete the temporary file
                await fs.unlink(bannerImage.path).catch((err: Error) =>
                    console.error("Error deleting temporary file:", err)
                );
            } catch (error) {
                console.error("Error processing banner image:", error);
                // Continue with notification creation even if image upload fails
            }
        }

        res.status(201).json({
            success: true,
            message: "Custom notification created successfully",
            data: {
                ...customNotification.toJSON(),
                createdAtFormatted: formatDateForDisplay(customNotification.createdAt),
                updatedAtFormatted: formatDateForDisplay(customNotification.updatedAt)
            }
        });

    } catch (error) {
        console.error("Error creating custom notification:", error);
        res.status(500).json({
            success: false,
            message: "Error creating custom notification",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// 2. Edit custom notification
export const editCustomNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { templateId } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.vendorId;
        const bannerImage = req.file; // Get uploaded file

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required",
            });
            return;
        }

        // Validate request body
        const validationResult = updateCustomNotificationSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationResult.error.errors.map((error) => error.message)
            });
            return;
        }

        const {
            title,
            message,
            target,
            type,
            route,
            particularIds,
            targetAudience,
            targetCustomerIds,
            scheduledAt,
            time
        } = validationResult.data;

        // Find the notification (excludes soft-deleted records)
        const customNotification = await NotificationTemplates.findOne({
            where: { templateId, adminId, type: 'custom_notification' }
        });

        if (!customNotification) {
            res.status(404).json({
                success: false,
                message: "Custom notification not found"
            });
            return;
        }

        // Check if notification is already sent (status = false means scheduled/sent)
        // if (!customNotification.status) {
        //     res.status(400).json({
        //         success: false,
        //         message: "Cannot edit a notification that has already been sent"
        //     });
        //     return;
        // }

        // Update fields
        const updateData: any = {};
        if (title) updateData.title = title;
        if (message) updateData.message = message;
        if (target) updateData.target = target;
        if (type) updateData.type = type;
        if (route !== undefined) updateData.route = route || undefined;
        if (particularIds !== undefined) updateData.particularIds = particularIds;
        if (time) updateData.time = time;

        // Update data object
        const currentData = customNotification.data || {};
        const updatedData = { ...currentData };
        if (targetAudience) updatedData.targetAudience = targetAudience;
        if (targetCustomerIds) updatedData.targetCustomerIds = targetCustomerIds;
        if (vendorId) updatedData.vendorId = vendorId;
        if (scheduledAt) {
            updatedData.scheduledAt = dayjs(scheduledAt).toDate();
            updateData.status = false; // scheduled
            updateData.time = time || scheduledAt;
        }
        updateData.data = updatedData;

        await customNotification.update(updateData);

        // Handle image upload if provided
        if (bannerImage) {
            try {
                // Read the file from the temporary path
                const imageBuffer = await fs.readFile(bannerImage.path);

                // Upload to MinIO
                const imageUrl = await uploadFileToDOS3(imageBuffer, `notification/${customNotification.id}.webp`);

                // Update notification with image URL
                customNotification.image = imageUrl ?? '';
                await customNotification.save();

                // Clean up: Delete the temporary file
                await fs.unlink(bannerImage.path).catch((err: Error) =>
                    console.error("Error deleting temporary file:", err)
                );
            } catch (error) {
                console.error("Error processing banner image:", error);
                // Continue with notification update even if image upload fails
            }
        }

        res.status(200).json({
            success: true,
            message: "Custom notification updated successfully",
            data: {
                ...customNotification.toJSON(),
                createdAtFormatted: formatDateForDisplay(customNotification.createdAt),
                updatedAtFormatted: formatDateForDisplay(customNotification.updatedAt)
            }
        });

    } catch (error) {
        console.error("Error updating custom notification:", error);
        res.status(500).json({
            success: false,
            message: "Error updating custom notification",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// 3. View all custom notifications
export const getAllCustomNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get adminId and vendorId from query parameters (following existing pattern)
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.vendorId;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required",
            });
            return;
        }

        // Validate query parameters
        const validationResult = getCustomNotificationsQuerySchema.safeParse(req.query);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationResult.error.errors.map((error) => error.message)
            });
            return;
        }

        const { target, type } = validationResult.data;

        // const whereClause: any = { adminId, type: type || 'custom_notification' };
        // if (vendorId) {
        //     whereClause['$data.vendorId$'] = vendorId;
        // }
        // if (target) {
        //     whereClause.target = target;
        // }

        const notifications = await NotificationTemplates.findAll({
            where: {
                adminId
                // type: 'custom_notification'
            },
            order: [['createdAt', 'DESC']]
        });

        // Add formatted dates to each notification
        const notificationsWithFormattedDates = notifications.map(notification => ({
            ...notification.toJSON(),
            createdAtFormatted: formatDateForDisplay(notification.createdAt),
            updatedAtFormatted: formatDateForDisplay(notification.updatedAt)
        }));

        res.status(200).json({
            success: true,
            message: "Custom notifications retrieved successfully",
            data: notificationsWithFormattedDates
        });

    } catch (error) {
        console.error("Error fetching custom notifications:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching custom notifications",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// 4. View individual custom notification
export const getCustomNotificationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { templateId } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required",
            });
            return;
        }

        // Validate templateId parameter
        const validationResult = customNotificationIdSchema.safeParse({ templateId });
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationResult.error.errors.map((error) => error.message)
            });
            return;
        }

        const customNotification = await NotificationTemplates.findOne({
            where: { templateId, adminId, type: 'custom_notification' }
        });

        if (!customNotification) {
            res.status(404).json({
                success: false,
                message: "Custom notification not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Custom notification retrieved successfully",
            data: {
                ...customNotification.toJSON(),
                createdAtFormatted: formatDateForDisplay(customNotification.createdAt),
                updatedAtFormatted: formatDateForDisplay(customNotification.updatedAt)
            }
        });

    } catch (error) {
        console.error("Error fetching custom notification:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching custom notification",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// 5. Delete custom notification (soft delete)
export const deleteCustomNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { templateId } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required",
            });
            return;
        }

        // Validate templateId parameter
        const validationResult = customNotificationIdSchema.safeParse({ templateId });
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationResult.error.errors.map((error) => error.message)
            });
            return;
        }

        const customNotification = await NotificationTemplates.findOne({
            where: { templateId, adminId, type: 'custom_notification' }
        });

        if (!customNotification) {
            res.status(404).json({
                success: false,
                message: "Custom notification not found"
            });
            return;
        }

        // Check if notification is already sent (status = false means scheduled/sent)
        if (!customNotification.status) {
            res.status(400).json({
                success: false,
                message: "Cannot delete a notification that has already been sent"
            });
            return;
        }

        // Soft delete the notification
        await customNotification.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: "Custom notification deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting custom notification:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting custom notification",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};



// 5.6. Get all soft-deleted custom notifications
export const getAllDeletedCustomNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required",
            });
            return;
        }

        // Get all soft-deleted notifications
        const deletedNotifications = await NotificationTemplates.findAll({
            where: {
                adminId
            },
            paranoid: false, // Include soft-deleted records
            order: [['deletedAt', 'DESC']]
        });

        // Filter only deleted records and add formatted dates
        const deletedNotificationsWithFormattedDates = deletedNotifications
            .filter(notification => notification.deletedAt) // Only include actually deleted records
            .map(notification => ({
                ...notification.toJSON(),
                createdAtFormatted: formatDateForDisplay(notification.createdAt),
                updatedAtFormatted: formatDateForDisplay(notification.updatedAt),
                deletedAtFormatted: notification.deletedAt ? formatDateForDisplay(notification.deletedAt) : null
            }));

        res.status(200).json({
            success: true,
            message: "Deleted custom notifications retrieved successfully",
            data: deletedNotificationsWithFormattedDates
        });

    } catch (error) {
        console.error("Error fetching deleted custom notifications:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching deleted custom notifications",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};



export const sendCustomNotification = async (req: Request, res: Response) => {
    try {
        const { templateId } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required"
            });
            return;
        }

        if (!templateId) {
            res.status(400).json({
                success: false,
                message: "Template ID is required"
            });
            return;
        }

        const notificationTemplate = await NotificationTemplates.findOne({
            where: {
                templateId,
                adminId
            }
        });
        if (!notificationTemplate) {
            res.status(404).json({
                success: false,
                message: "Notification template not found"
            });
            return;
        }

        const target = notificationTemplate.target

        switch (target) {
            case "driver":

                const redisDrivers = adminId
                    ? await getAllRedisDrivers(String(adminId))
                    : [];

                let targetDrivers = redisDrivers
                    .filter(driver => driver && driver.isActive);

                if (!targetDrivers.length) {
                    const dbDrivers = await Driver.findAll({
                        where: { adminId, isActive: true, adminVerified: "Approved" },
                    });

                    // Enrich with FCM tokens from Redis
                    targetDrivers = await Promise.all(
                        dbDrivers.map(async (driver) => {
                            const redisFcmToken = driver.adminId
                                ? await getDriverFcmToken(String(driver.adminId), String(driver.driverId))
                                : null;
                            return {
                                driverId: driver.driverId,
                                adminId: driver.adminId,
                                name: driver.name,
                                phone: driver.phone,
                                adminVerified: driver.adminVerified,
                                fcmToken: redisFcmToken,
                                walletId: driver.walletId,
                                geoLocation: null,
                                isActive: driver.isActive,
                            };
                        })
                    );
                }

                for (const driver of targetDrivers) {
                    if (!driver.fcmToken || driver.fcmToken.trim() === "") {
                        console.log(`Skipping driver ${driver.driverId} due to missing FCM token`);
                        continue;
                    }

                    const message = {
                        type: "custom",
                        fcmToken: driver.fcmToken,
                        payload: {
                            imageUrl: notificationTemplate.image,
                            title: notificationTemplate.title,
                            message: notificationTemplate.message,
                            ids: {
                                adminId: notificationTemplate.adminId,
                                driverId: driver.driverId,
                                templateId: notificationTemplate.templateId
                            },
                            data: {
                                title: notificationTemplate.title,
                                message: notificationTemplate.message,
                                type: "custom_notification",
                                channelKey: "other_channel",
                            },
                        },
                    };

                    publishNotification("notification.fcm.driver", message);
                    console.log(`FCM Notification queued for driver ${driver.driverId}`);
                }
                break;

            case "customer":

                const customers = await Customer.findAll({
                    where: { adminId },
                })

                // Send queued message to each customer
                for (const customer of customers) {
                    const message = {
                        type: "custom",
                        fcmToken: customer.fcmToken,
                        payload: {
                            imageUrl: notificationTemplate.image,
                            title: notificationTemplate.title,
                            message: notificationTemplate.message,
                            ids: {
                                adminId: notificationTemplate.adminId,
                                customerId: customer.customerId,
                                templateId: notificationTemplate.templateId
                            },
                            data: {
                                title: notificationTemplate.title,
                                message: notificationTemplate.message,
                                type: "custom_notification",
                                channelKey: "other_channel",
                            },
                        },
                    };

                    // Push message to queue
                    publishNotification("notification.fcm.customer", message);
                    console.log(`FCM Notification queued for customer ${customer.customerId}`);
                }

                break;

            case "vendor":

                const vendors = await Customer.findAll({
                    where: { adminId },
                })

                // Send queued message to each vendor
                for (const vendor of vendors) {
                    const message = {
                        type: "custom",
                        fcmToken: vendor.fcmToken,
                        payload: {
                            imageUrl: notificationTemplate.image,
                            title: notificationTemplate.title,
                            message: notificationTemplate.message,
                            ids: {
                                adminId: notificationTemplate.adminId,
                                vendorId: vendor.vendorId,
                                templateId: notificationTemplate.templateId
                            },
                            data: {
                                title: notificationTemplate.title,
                                message: notificationTemplate.message,
                                type: "custom_notification",
                                channelKey: "other_channel",
                            },
                        },
                    };

                    // Push message to queue
                    publishNotification("notification.fcm.vendor", message);
                    console.log(`FCM Notification queued for vendor ${vendor.vendorId}`);
                }

                break;

            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid target"
                });
                return;
        }

        res.status(200).json({
            success: true,
            message: `Notifications sent to ${target} via queue`,
            data: templateId
        });
    } catch (err) {
        console.error("Error sending notification:", err);
        res.status(500).json({
            success: false,
            message: "Error sending notification",
            error: (err as Error).message,
        });
    }
};




// Test endpoint for debugging notification sending
export const testNotificationEndpoint = async (req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json({
            success: true,
            message: "Test endpoint working",
            data: {
                body: req.body,
                params: req.params,
                query: req.query,
                headers: req.headers
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Test endpoint error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
