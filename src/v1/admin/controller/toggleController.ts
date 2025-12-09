import { Request, Response } from "express";
import { toggleStatus } from "../../core/function/toggleStatus";
import { Vehicle, Driver, Service, TableConfig } from "../../core/models"; // Ensure the import path is correct
import { sendToSingleToken } from "../../../common/services/firebase/appNotify";
import { debugLogger as debug } from "../../../utils/logger";

// Driver Toggle Status Controller
export const driverToggleStatusController = async (req: Request, res: Response): Promise<void> => {
    const { id, status, reason } = req.body;

    console.log(id, status, reason);
    if (!id || typeof status !== 'boolean' || status === undefined) {
        res.status(400).json({ message: 'Invalid request data for Driver' });
        return;
    }

    try {
        const { item, newStatus } = await toggleStatus(Driver, "driverId", id, status, reason);
        
        // Send FCM notification when driver status is changed
        if ((item as any).fcmToken) {
            try {
                let notificationTitle: string;
                let notificationMessage: string;
                
                if (newStatus === true) {
                    // Driver activated
                    notificationTitle = "Account Activated";
                    notificationMessage = "Your account has been activated by admin. You can now access the platform.";
                } else {
                    // Driver deactivated
                    notificationTitle = "Account Deactivated";
                    notificationMessage = reason 
                        ? `Your account has been deactivated. Reason: ${reason}`
                        : "Your account has been deactivated by admin. Please contact admin for more details.";
                }
                
                const fcmResponse = await sendToSingleToken((item as any).fcmToken, {
                    ids: {
                        driverId: (item as any).driverId,
                        adminId: (item as any).adminId,
                    },
                    data: {
                        title: notificationTitle,
                        message: notificationMessage,
                        type: "driver-status-change",
                        channelKey: "other_channel",
                    }
                });
                
                debug.info(`FCM notification sent to driver ${(item as any).driverId}: ${fcmResponse}`);
            } catch (fcmError) {
                debug.info(`FCM notification failed for driver ${(item as any).driverId}: ${fcmError}`);
            }
        }
        
        res.status(200).json({
            success: true,
            message: "Driver status toggled successfully",
            data: { item, newStatus }
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


// Vehicle Toggle Status Controller
export const vehicleToggleStatusController = async (req: Request, res: Response): Promise<void> => {
    const { id, status } = req.body;

    if (!id || typeof status !== 'boolean' || status === undefined) {
        res.status(400).json({ message: 'Invalid request data for Vehicle' });
        return;
    }
    try {
        const { item, newStatus } = await toggleStatus(Vehicle, "vehicleId", id, status); // Pass the Vehicle model
        res.status(200).json({
            success: true,
            message: "Vehicle status updated",
            data: { item, newStatus }
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Service Toggle Status Controller
export const serviceToggleStatusController = async (req: Request, res: Response): Promise<void> => {
    const { id, status } = req.body;

    if (!id || typeof status !== 'boolean' || status === undefined) {
        res.status(400).json({ message: 'Invalid request data for Service' });
        return;
    }


    try {
        await toggleStatus(Service, "serviceId", id, status); // Pass the Service model
        res.status(200).json({
            success: true,
            message: "Service status toggled successfully"
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const getColumnVisibilityController = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { table } = req.params;

    if (!table) {
        res.status(400).json({
            success: false,
            message: 'Invalid request data for column visibility'
        });
        return;
    }


    try {
        const columnVisibility = await TableConfig.findOne({
            where: {
                adminId,
                pageName: table,
            },
            attributes: {
                exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt']
            }
        });

        if (!columnVisibility) {
            res.status(200).json({
                success: true,
                message: `No column visibility found for ${table}`,
                data: {}
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Column visibility fetched for ${table}`,
            data: columnVisibility
        });
        return;
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: `Error fetching column visibility for ${table}`,
            error: error.message
        });
        return;
    }
}


export const columnVisibilityController = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { table } = req.params;
    const preferences = req.body;

    if (!preferences) {
        res.status(400).json({
            success: false,
            message: 'Invalid request data for column visibility'
        });
        return;
    }

    try {

        let columnVisibility = await TableConfig.findOne({
            where: {
                adminId,
                pageName: table
            }
        });

        let created = false;
        let newColumnVisibility: any;
        if (!columnVisibility) {
            newColumnVisibility = await TableConfig.create({
                adminId,
                pageName: table,
                preferences
            });
            created = true;
        } else {
            await columnVisibility.update({ preferences });
            created = false;
        }

        res.status(200).json({
            success: true,
            message: `${created ? 'Created' : 'Updated'} column visibility for ${table}`,
            data: created ? newColumnVisibility : columnVisibility
        });
        return;
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: `Error updating column visibility for ${table}`,
            error: error.message
        });
        return;
    }
}
