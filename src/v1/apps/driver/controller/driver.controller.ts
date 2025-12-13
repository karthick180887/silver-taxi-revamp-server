import { Response, Request } from "express";
import {
    DriverBookingLog,
    Driver,
    CompanyProfile,
    DriverBankDetails
} from "../../../core/models";
import dayjs from "../../../../utils/dayjs";
import { driverPaymentDetailsSchema, driverPaymentDetailsUpdateSchema } from "../../../../common/validations/driverSchema";
import { infoLogger as log, debugLogger as debug } from "../../../../utils/logger";
import { driverLocationUpdate } from "../../../core/function/driverFunctions";
import { getConfigKey } from "../../../../common/services/node-cache";


export const getDriverDetails = async (req: Request, res: Response) => {

    const adminId = req.query.adminId ?? req.body.adminId;
    const driverId = req.query.driverId ?? req.body.driverId;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    const driver = await Driver.findOne({
        where: { driverId, adminId },
        attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
    });

    res.status(200).json({
        success: true,
        message: "Driver details fetched successfully",
        data: driver
    });
    return;
}

export const getAdminDetails = async (req: Request, res: Response) => {

    const adminId = req.query.adminId ?? req.body.adminId;
    const driverId = req.query.driverId ?? req.body.driverId;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    const profile = await CompanyProfile.findOne({
        where: { adminId },
        attributes: {
            exclude: [
                'id', 'updatedAt',
                'deletedAt', 'driverWalletAmount',
                'vendorId', 'vendorWalletAmount',
            ]
        }
    });


    res.status(200).json({
        success: true,
        message: "Admin details fetched successfully",
        data: profile
    });
    return;
}


export const fcmTokenUpdate = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { fcmToken } = req.body

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        const driver = await Driver.findOne({
            where: { driverId },
        });

        if (!fcmToken) {
            res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
            return;
        }

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        driver.fcmToken = fcmToken;
        await driver.save();
        res.status(200).json({
            success: true,
            message: "FCM token updated successfully",
            data: driver,
        });

    } catch (error) {
        console.error("Error updating FCM token:", error);
        res.status(500).json({
            success: false,
            message: "Error updating FCM token",
            error,
        });
        return;
    }
}


export const onlineStatusUpdate = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { isOnline } = req.body;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver ID is required",
        });
        return;
    }

    try {
        const driver = await Driver.findOne({ where: { driverId } });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        if (driver.isOnline === isOnline) {
            res.status(200).json({
                success: true,
                message: "Given online status is the same",
            });
            return;
        }

        const currentDateTime = dayjs();
        const minuteId = currentDateTime.format("DD-MM-YYYY");

        if (isOnline === true && !driver.onlineTime) {
            driver.onlineTime = currentDateTime.toDate();
            console.log("Driver came online:", driver.onlineTime);
        }

        if (isOnline === false && driver.onlineTime) {
            const onlineStart = dayjs(driver.onlineTime);
            const onlineEnd = currentDateTime;

            let sessionMinutes = 0;
            if (onlineEnd.isAfter(onlineStart)) {
                sessionMinutes = Number((onlineEnd.diff(onlineStart, "second") / 60).toFixed(2));

            } else {
                console.warn(`Invalid time range for driver ${driverId}: onlineStart (${onlineStart}) is after onlineEnd (${onlineEnd})`);
            }

            const existingLog = await DriverBookingLog.findOne({
                where: {
                    driverId,
                    minuteId,
                },
            });

            if (existingLog) {

                const onlineTime = onlineStart.toDate()
                const offlineTime = onlineEnd.toDate()
                existingLog.onlineTimes = [...existingLog.onlineTimes, onlineTime]
                existingLog.offlineTimes = [...existingLog.offlineTimes, offlineTime]
                existingLog.onlineMinutes = Number(existingLog.onlineMinutes || 0) + sessionMinutes;
                await existingLog.save();
            } else {

                await DriverBookingLog.create({
                    driverId,
                    adminId,
                    minuteId,
                    onlineMinutes: sessionMinutes,
                    offlineTimes: [onlineEnd.toDate()],
                    onlineTimes: [onlineStart.toDate()],
                });
            }

            driver.onlineTime = null;
            driver.offlineTime = null;
        }


        driver.isOnline = isOnline;
        await driver.save();

        res.status(200).json({
            success: true,
            message: "Driver online/offline status updated successfully",
            data: driver,
        });
        return;
    } catch (error) {
        console.error("Error updating online status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating online status",
            error,
        });
        return;
    }
};

export const locationUpdate = async (req: Request, res: Response) => {
    const driverId = req.body.driverId ?? req.query.driverId;
    const { lat, lng } = req.body;


    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        log.info(`Updating location for driverId: ${driverId} latitude: ${lat} longitude: ${lng} entry $>>`);
        const driver = await Driver.findOne({ where: { driverId } });
        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        driver.geoLocation = {
            latitude: lat,
            longitude: lng,
            timestamp: new Date(),
        };
        await driver.save();

        res.status(200).json({
            success: true,
            message: "Driver location updated successfully",
            data: driver,
        });
        log.info(`Driver location updated successfully for driverId: ${driverId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error updating location for driverId: ${driverId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error updating location",
            error,
        });
        return;
    }
}

// Driver Payment Details
export const driverPaymentDetailsGet = async (req: Request, res: Response) => {
    const driverId = req.body.driverId ?? req.query.driverId;


    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        log.info(`Fetching driver payment details for driverId: ${driverId} entry $>>`);

        const driverPaymentDetails = await DriverBankDetails.findAll({
            where: { driverId },
            attributes: {
                exclude: ['id', 'updatedAt', 'deletedAt'],
            },
            order: [['createdAt', 'DESC']],
        });

        if (driverPaymentDetails.length === 0) {
            res.status(200).json({
                success: false,
                message: "Driver payment details not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Driver payment details fetched successfully",
            data: driverPaymentDetails,
        });

        log.info(`Driver payment details fetched successfully for driverId: ${driverId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error fetching driver payment details for driverId: ${driverId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error fetching driver payment details",
            error,
        });
        return;
    }
}

export const driverPaymentDetailsGetById = async (req: Request, res: Response) => {
    const driverId = req.body.driverId ?? req.query.driverId;
    const id = req.params.id;


    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    if (!id) {
        res.status(401).json({
            success: false,
            message: "Id is required",
        });
        return;
    }

    try {
        log.info(`Fetching driver payment details for driverId: ${driverId} and id: ${id} entry $>>`);

        const driverPaymentDetails = await DriverBankDetails.findOne({
            where: { driverId, paymentDetailsId: id },
            attributes: {
                exclude: ['id', 'updatedAt', 'deletedAt'],
            },
        });

        if (!driverPaymentDetails) {
            res.status(200).json({
                success: false,
                message: "Driver payment details not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Driver payment details fetched successfully by id",
            data: driverPaymentDetails,
        });

        log.info(`Driver payment details fetched successfully for driverId: ${driverId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error fetching driver payment details for driverId: ${driverId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error fetching driver payment details",
            error,
        });
        return;
    }
}

export const driverPaymentDetailsCreate = async (req: Request, res: Response) => {
    const driverId = req.body.driverId ?? req.query.driverId;


    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        log.info(`Creating driver payment details for driverId: ${driverId} entry $>>`);

        const validatedData = driverPaymentDetailsSchema.safeParse(req.body);

        if (!validatedData.success) {
            const errors = validatedData.error.errors.map(err => ({
                field: err.path.join("."),
                message: err.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation error",
                validationErrors: errors,
            });
            return;
        }


        const {
            accountName,
            bankBookImage,
            bankAccountNumber,
            bankName,
            ifscCode,
            accountHolderName,
            bankDetailsVerified,
            upiId,
            upiNumber,
            accountDescription,
        } = validatedData.data;

        const existingDriverPaymentDetails = await DriverBankDetails.findAll({
            where: { driverId },
        });

        const SetIsPrimary = existingDriverPaymentDetails.length === 0 ? true : false;
        const driverPaymentDetails = await DriverBankDetails.create({
            driverId,
            accountName: accountName ?? "",
            bankBookImage,
            bankAccountNumber,
            bankName,
            ifscCode,
            accountHolderName,
            upiId,
            upiNumber,
            accountDescription,
            isActive: true,
            isPrimary: SetIsPrimary,
        })
        driverPaymentDetails.paymentDetailsId = `PAY${driverPaymentDetails.id.toString().padStart(6, "0")}`;
        driverPaymentDetails.save();

        res.status(200).json({
            success: true,
            message: "Driver payment details created successfully",
            data: driverPaymentDetails,
        });

        log.info(`Driver payment details created successfully for driverId: ${driverId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error creating driver payment details for driverId: ${driverId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error creating driver payment details",
            error,
        });
        return;
    }
}

export const driverPaymentDetailsUpdate = async (req: Request, res: Response) => {
    const driverId = req.body.driverId ?? req.query.driverId;
    const { id } = req.params;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    if (!id) {
        res.status(400).json({
            success: false,
            message: "Id is required",
        });
        return;
    }

    try {
        log.info(`Updating driver payment details for driverId: ${driverId} entry $>>`);

        const validatedData = driverPaymentDetailsUpdateSchema.safeParse(req.body);

        const driverPaymentDetails = await DriverBankDetails.findOne({
            where: { driverId, paymentDetailsId: id },
        });

        if (!driverPaymentDetails) {
            res.status(400).json({
                success: false,
                message: "Driver payment details not found",
            });
            return;
        }

        if (!validatedData.success) {
            const errors = validatedData.error.errors.map(err => ({
                field: err.path.join("."),
                message: err.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation error",
                validationErrors: errors,
            });
            return;
        }

        const {
            accountName,
            bankBookImage,
            bankName,
            bankAccountNumber,
            ifscCode,
            accountHolderName,
            bankDetailsVerified,
            upiId,
            upiNumber,
            upiVerified,
            isActive,
            accountDescription,
        } = validatedData.data;

        const updatedDriverPaymentDetails = await driverPaymentDetails.update({
            accountName,
            bankBookImage,
            bankName,
            bankAccountNumber,
            ifscCode,
            accountHolderName,
            bankDetailsVerified,
            upiId,
            upiNumber,
            upiVerified,
            accountDescription,
            isActive,
        });

        await updatedDriverPaymentDetails.save();

        res.status(200).json({
            success: true,
            message: "Driver payment details updated successfully",
            data: updatedDriverPaymentDetails,
        });

        log.info(`Driver payment details updated successfully for driverId: ${driverId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error updating driver payment details for driverId: ${driverId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error updating driver payment details",
            error,
        });
        return;
    }
}

export const driverPaymentDetailsToggle = async (req: Request, res: Response) => {
    const driverId = req.body.driverId ?? req.query.driverId;
    const { id, type } = req.params;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    if (!id) {
        res.status(400).json({
            success: false,
            message: "Id is required",
        });
        return;
    }

    try {
        log.info(`Toggling driver payment details for driverId: ${driverId} entry $>>`);


        let driverPaymentDetails = await DriverBankDetails.findOne({
            where: { driverId, paymentDetailsId: id },
        });

        if (!driverPaymentDetails) {
            res.status(400).json({
                success: false,
                message: "Driver payment details not found",
            });
            return;
        }

        switch (type.toLowerCase()) {
            case "active":
                driverPaymentDetails.isActive = !driverPaymentDetails.isActive;
                await driverPaymentDetails.save();
                break;
            case "inactive":
                driverPaymentDetails.isActive = !driverPaymentDetails.isActive;
                await driverPaymentDetails.save();
                break;
            case "primary":
                if (!driverPaymentDetails.isPrimary) {
                    await DriverBankDetails.update(
                        { isPrimary: false },
                        { where: { driverId, isPrimary: true } }
                    );

                    driverPaymentDetails.isPrimary = true;
                    await driverPaymentDetails.save();
                }
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid type",
                });
                return;
        }

        res.status(200).json({
            success: true,
            message: `Driver payment details ${type} successfully`,
            data: driverPaymentDetails,
        });

        log.info(`Driver payment details toggled successfully for driverId: ${driverId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error updating driver payment details for driverId: ${driverId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error toggling driver payment details",
            error,
        });
        return;
    }
}


export const getConfigKeys = async (req: Request, res: Response) => {
    const adminId = req.query.adminId ?? req.body.adminId;
    const driverId = req.query.driverId ?? req.body.driverId;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        const keys = ["google_map_key", "razorpay_key"]; // whitelist
        const result: Record<string, string | null> = {};

        for (const key of keys) {
            result[key] = await getConfigKey(key);
        }

        res.status(200).json({
            success: true,
            message: "key fetch successfully",
            data: {
                google_maps_key: result["google_map_key"],
                razorpay_key: result["razorpay_key"]
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal error"
        });
    }
}