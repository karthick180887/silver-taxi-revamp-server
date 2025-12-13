import { Request, Response } from "express";
import {
    Driver, Admin,
    DriverWallet,
    WalletTransaction,
    Vehicle,
    DriverBookingLog,
    DriverWalletRequest
} from "../../core/models"; // Ensure the import path is correct
import fs from 'fs/promises';
import { uploadFileToMiniIOS3 } from "../../../utils/minio.image";
import { sequelize } from "../../../common/db/postgres";
import { Op } from "sequelize";
import { sendToSingleToken } from "../../../common/services/firebase/appNotify";
import { createDriverNotification } from "../../core/function/notificationCreate";
import { debugLogger as debug, infoLogger as log } from "../../../utils/logger";
import { generateTransactionId } from "../../core/function/commissionCalculation";
import { walletBulkRequestSchema } from "../../../common/validations/driverSchema";
import { publishDriverWork } from "../../../common/services/rabbitmq/publisher";


// Get all drivers
export const getAllDrivers = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        console.log(`[Drivers] Fetching drivers for adminId: ${adminId}`);

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Driver",
            });
            return;
        }
        const drivers = await Driver.findAll({
            where: { adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [{
                model: DriverWallet,
                as: 'wallet',
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
            },
            {
                model: Vehicle,
                as: 'vehicle',
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
            }]
        });

        console.log(`[Drivers] Found ${drivers.length} drivers.`);

        const driversCount = {
            total: drivers.length,
            active: drivers.filter(d => d.isActive).length,
            inactive: drivers.filter(d => !d.isActive).length
        };

        res.status(200).json({
            success: true,
            message: "Drivers retrieved successfully",
            data: {
                drivers: drivers,
                driversCount: driversCount,
                total: drivers.length, // Added for frontend pagination compatibility
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalCount: drivers.length,
                    hasNext: false,
                    hasPrev: false,
                    limit: drivers.length
                }
            }
        });

    } catch (error) {
        console.error("Error fetching drivers:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching drivers",
        });
    }
};

// Get Driver Locations (for Map)
export const getDriverLocations = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        if (!adminId) {
            res.status(400).json({ success: false, message: "adminId is required" });
            return;
        }

        const drivers = await Driver.findAll({
            where: {
                adminId,
                isActive: true,
                geoLocation: { [Op.ne]: null } // Ensure location exists
            },
            attributes: ['id', 'driverId', 'name', 'phone', 'geoLocation', 'isOnline'],
        });

        console.log(`[DriverLocations] AdminId: ${adminId}, Found: ${drivers.length} drivers with location`);

        res.status(200).json({
            success: true,
            message: "Driver locations retrieved",
            data: drivers
        });
    } catch (error) {
        console.error("Error fetching driver locations:", error);
        res.status(500).json({ success: false, message: "Error fetching driver locations" });
    }
};

// Get all active drivers
export const getActiveDrivers = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const drivers = await Driver.findAll({
            where: { adminId, isActive: true },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [{
                model: DriverWallet,
                as: 'wallet',
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
            }]
        });


        res.status(200).json({
            success: true,
            message: "Active drivers retrieved successfully",
            data: drivers
        });
    } catch (error) {
        console.error("Error fetching active drivers:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching active drivers"
        });
    }
}

// Get a single driver by ID
export const getDriverById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const driver = await Driver.findOne({
            where: { driverId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [{
                model: DriverWallet,
                as: 'wallet',
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
            },
            {
                model: Vehicle,
                as: 'vehicle',
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
            },
            ]
        });


        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Driver retrieved successfully",
            data: driver,
        });
    } catch (error) {
        console.error("Error fetching driver:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching driver",
        });
    }
};

export const getAllDriverWalletTrans = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;

    try {
        const walletTrans = await WalletTransaction.findAll({
            where: {
                adminId,
                vendorId: {
                    [Op.is]: null
                },
            } as any,
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json({
            success: true,
            message: "Wallet transactions fetched successfully",
            data: walletTrans
        });
        return;
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
        return;
    }
};

export const getDriverWalletTrans = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { id } = req.params;
    try {
        const walletTrans = await WalletTransaction.findAll({
            where: {
                adminId,
                driverId: id,
            },
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json({
            success: true,
            message: "Wallet transactions fetched successfully",
            data: walletTrans
        });
        return;
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
        return;
    }
};






export const verificationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const tenantId = req.body.tenantId ?? req.query.tenantId;
        const { id } = req.params;
        const { vehicleId } = req.body;

        if (!vehicleId) {
            res.status(400).json({
                success: false,
                message: "vehicleId is required",
            });
            return;
        }

        const driver = await Driver.findOne({
            where: { adminId, driverId: id },
            include: [{
                model: Vehicle,
                as: 'vehicle',
                where: { vehicleId },
                order: [['createdAt', 'ASC']],
            }],
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: 'Driver or vehicle is not found'
            });
            return;
        }

        const {
            vehicleProfileVerified, profileVerified,
            remark, vehicleRemark,
            panCardVerified, panCardRemark,
            aadharImageFrontVerified, aadharImageFrontRemark,
            aadharBackVerified, aadharBackRemark,
            licenseImageFrontVerified, licenseImageFrontRemark,
            licenseImageBackVerified, licenseImageBackRemark,
            rcFrontVerified, rcFrontRemark,
            rcBackVerified, rcBackRemark,
            pollutionImageVerified, pollutionImageRemark,
            insuranceVerified, insuranceRemark,
        } = req.body;

        console.log("Request body:", req.body);


        const driverUpdateFields: any = {};
        const vehicleUpdateFields: any = {};


        function handleVerificationUpdate(
            verifiedValue: any,
            verifiedField: string,
            remarkField: string,
            target: any,
            isProfileField: boolean

        ) {
            if (verifiedValue !== undefined) {
                target[verifiedField] = verifiedValue;
                if (verifiedValue === "accepted") {
                    target[remarkField] = null;
                }
                if (verifiedValue === "rejected") {
                    if (isProfileField) {
                        target.profileVerified = "rejected";
                    } else {
                        target.documentVerified = "rejected";
                    }
                }
            }
        }


        // Only update fields present in the request
        handleVerificationUpdate(profileVerified, 'profileVerified', 'profileRemark', driverUpdateFields, true);
        if (remark !== undefined && profileVerified !== "accepted") driverUpdateFields.remark = remark;

        handleVerificationUpdate(panCardVerified, 'panCardVerified', 'panCardRemark', driverUpdateFields, false);
        if (panCardRemark !== undefined && panCardVerified !== "accepted") driverUpdateFields.panCardRemark = panCardRemark;

        handleVerificationUpdate(aadharImageFrontVerified, 'aadharImageFrontVerified', 'aadharImageFrontRemark', driverUpdateFields, false);
        if (aadharImageFrontRemark !== undefined && aadharImageFrontVerified !== "accepted") driverUpdateFields.aadharImageFrontRemark = aadharImageFrontRemark;

        handleVerificationUpdate(aadharBackVerified, 'aadharImageBackVerified', 'aadharImageBackRemark', driverUpdateFields, false);
        if (aadharBackRemark !== undefined && aadharBackVerified !== "accepted") driverUpdateFields.aadharImageBackRemark = aadharBackRemark;

        handleVerificationUpdate(licenseImageFrontVerified, 'licenseImageFrontVerified', 'licenseImageFrontRemark', driverUpdateFields, false);
        if (licenseImageFrontRemark !== undefined && licenseImageFrontVerified !== "accepted") driverUpdateFields.licenseImageFrontRemark = licenseImageFrontRemark;

        handleVerificationUpdate(licenseImageBackVerified, 'licenseImageBackVerified', 'licenseImageBackRemark', driverUpdateFields, false);
        if (licenseImageBackRemark !== undefined && licenseImageBackVerified !== "accepted") driverUpdateFields.licenseImageBackRemark = licenseImageBackRemark;




        handleVerificationUpdate(vehicleProfileVerified, 'profileVerified', 'remark', vehicleUpdateFields, true);
        if (vehicleRemark !== undefined && vehicleProfileVerified !== "accepted") vehicleUpdateFields.remark = vehicleRemark;


        handleVerificationUpdate(rcFrontVerified, 'rcFrontVerified', 'rcFrontRemark', vehicleUpdateFields, false);
        if (rcFrontRemark !== undefined && rcFrontVerified !== "accepted") vehicleUpdateFields.rcFrontRemark = rcFrontRemark;

        handleVerificationUpdate(rcBackVerified, 'rcBackVerified', 'rcBackRemark', vehicleUpdateFields, false);
        if (rcBackRemark !== undefined && rcBackVerified !== "accepted") vehicleUpdateFields.rcBackRemark = rcBackRemark;

        handleVerificationUpdate(pollutionImageVerified, 'pollutionImageVerified', 'pollutionImageRemark', vehicleUpdateFields, false);
        if (pollutionImageRemark !== undefined && pollutionImageVerified !== "accepted") vehicleUpdateFields.pollutionImageRemark = pollutionImageRemark;

        handleVerificationUpdate(insuranceVerified, 'insuranceVerified', 'insuranceRemark', vehicleUpdateFields, false);
        if (insuranceRemark !== undefined && insuranceVerified !== "accepted") vehicleUpdateFields.insuranceRemark = insuranceRemark;

        for (const [key, value] of Object.entries(driverUpdateFields)) {
            if (typeof value === "string" && value.toLowerCase() === "rejected" && key.endsWith("Verified")) {
                driverUpdateFields.isUpdated = true;
                break;
            }
        }
        for (const [key, value] of Object.entries(vehicleUpdateFields)) {
            if (typeof value === "string" && value.toLowerCase() === "rejected" && key.endsWith("Verified")) {
                vehicleUpdateFields.isUpdated = true;
                break;
            }
        }

        const driverDocumentFields = [
            panCardVerified || driver.panCardVerified,
            aadharImageFrontVerified || driver.aadharImageFrontVerified,
            aadharBackVerified || driver.aadharImageBackVerified,
            licenseImageFrontVerified || driver.licenseImageFrontVerified,
            licenseImageBackVerified || driver.licenseImageBackVerified,
        ];
        const allDriverDocsAccepted = driverDocumentFields.every(field => field === "accepted");

        // Check if all vehicle docs are accepted
        const vehicleDocumentFields = [
            rcFrontVerified || (driver as any)?.vehicle?.[0]?.rcFrontVerified,
            rcBackVerified || (driver as any)?.vehicle?.[0]?.rcBackVerified,
            pollutionImageVerified || (driver as any)?.vehicle?.[0]?.pollutionImageVerified,
            insuranceVerified || (driver as any)?.vehicle?.[0]?.insuranceVerified,
        ];

        console.log("Vehicle Document Fields:", vehicleDocumentFields);
        const allVehicleDocsAccepted = vehicleDocumentFields.every(field => field === "accepted");

        // Add auto-set for documentVerified and vehicleDocumentVerified
        if (allDriverDocsAccepted) {
            driverUpdateFields.documentVerified = "accepted";
            driverUpdateFields.documentRemark = null;
        }
        if (allVehicleDocsAccepted) {
            vehicleUpdateFields.documentVerified = "accepted";
            vehicleUpdateFields.documentRemark = null;
        }

        console.log("Driver Update Fields:", allDriverDocsAccepted);
        console.log("Vehicle Update Fields:", allVehicleDocsAccepted);

        // Set adminVerified = accepted if everything is accepted


        if (
            allDriverDocsAccepted &&
            allVehicleDocsAccepted
        ) {
            driverUpdateFields.adminVerified = "Approved";
            driverUpdateFields.isActive = true;
            vehicleUpdateFields.adminVerified = "Approved";
        }


        const t = await sequelize.transaction();
        try {
            if (Object.keys(driverUpdateFields).length > 0) {
                await driver.update(driverUpdateFields, { transaction: t });
            }

            if ((driver as any)?.vehicle?.[0]?.vehicleId && Object.keys(vehicleUpdateFields).length > 0) {
                await Vehicle.update(vehicleUpdateFields, {
                    where: { vehicleId: vehicleId },
                    transaction: t
                });
            }

            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }

        const updatedDriver = await driver.reload({
            include: [{
                model: Vehicle,
                as: 'vehicle',
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                order: [['createdAt', 'DESC']]
            }],
        });

        res.status(200).json({
            success: true,
            message: 'Verification field(s) updated successfully',
            updatedFields: updatedDriver,
        });

    } catch (error) {
        console.error("Error updating verification status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating verification status",
            error,
        });
    }
};


// Create a new driver
export const createDriver = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const licenseImage = req.file;
        // console.log("licenseImage--->", licenseImage);
        // console.log("req.body--->", req.body);
        const {
            name, phone,
            email, address,
            license, licenseValidity, aadharNumber,
            vehicleId, isActive,
            remark, walletAmount
        } = req.body;


        if (!name || !phone || !license) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (name, phone, license)",
            });
            return;
        }
        const newDriver = await Driver.create({
            adminId,
            name,
            phone,
            email,
            address,
            isActive: isActive ?? true,
            licenseValidity,
            vehicleId: vehicleId ?? null,
            remark,
            createdBy: "Admin" as "Admin",
        });

        newDriver.driverId = `drv-${newDriver.id}`;
        await newDriver.save();

        if (licenseImage) {
            try {
                const imageBuffer = await fs.readFile(licenseImage.path);

                // Upload to MinIO
                const imageUrl = await uploadFileToMiniIOS3(imageBuffer, `driver/${newDriver.driverId}.webp`);

                // Update offer with image URL
                // newDriver.licenseImage = imageUrl ?? '';
                await newDriver.save();

                // Clean up: Delete the temporary file
                await fs.unlink(licenseImage.path).catch((err: Error) =>
                    console.error("Error deleting temporary file:", err)
                );
            } catch (error) {
                console.error("Error processing driver image:", error);
                // Continue with offer creation even if image upload fails
            }
        }

        const wallet = await DriverWallet.create({
            adminId: newDriver.adminId,
            driverId: newDriver.driverId,
            balance: Number(walletAmount) ?? 0,
            startAmount: Number(walletAmount) ?? 0,
        });

        wallet.walletId = `drv-wlt-${wallet.id}`;
        await wallet.save();

        newDriver.walletId = wallet.walletId;
        await newDriver.save();

        res.status(201).json({
            success: true,
            message: "Driver created successfully",
            data: newDriver,
        });

    } catch (error) {
        console.error("Error creating driver:", error);
        res.status(500).json({
            success: false,
            message: "Error creating driver",
        });
    }
};

// Update an existing driver
export const updateDriver = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            name, phone, email,
            driverImageUrl, address, isActive,
            aadharNumber, license, licenseValidity,
            licenseImage, vehicleId, remark,
        } = req.body;


        const driver = await Driver.findOne({
            where: { driverId: id }
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        const updatedDriver = await driver.update({
            name,
            phone,
            email,
            driverImageUrl: driverImageUrl ?? null,
            address,
            isActive,
            // license,
            licenseValidity,
            // aadharNumber,
            // licenseImage: licenseImage ?? null,
            vehicleId: vehicleId ?? null,
            remark,
            createdBy: "Admin" as "Admin",
        });

        res.status(200).json({
            success: true,
            message: "Driver updated successfully",
            data: updatedDriver,
        });
    } catch (error) {
        console.error("Error updating driver:", error);
        res.status(500).json({
            success: false,
            message: "Error updating driver",
        });
    }
};

// Delete a driver
export const deleteDriver = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const driver = await Driver.findOne({
            where: { driverId: id },
            transaction: t,
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        const vehicles = await Vehicle.findAll({
            where: { driverId: driver.driverId, adminId },
            transaction: t,
            paranoid: false
        })

        const driverBookingLog = await DriverBookingLog.findAll({
            where: { driverId: driver.driverId, adminId },
            transaction: t,
        })

        const wallet = await DriverWallet.findOne({
            where: { walletId: driver.walletId },
            transaction: t,
            paranoid: false
        });

        if (wallet) {
            await wallet.destroy({ transaction: t, force: true });
        }

        if (driverBookingLog.length > 0) {
            await Promise.all(driverBookingLog.map(async (bookingLog) => {
                await bookingLog.destroy({ transaction: t, force: true });
            }));
        }

        for (const vehicle of vehicles) {
            await vehicle.destroy({ transaction: t, force: true });
        }

        await driver.destroy({ transaction: t, force: true });

        await t.commit();

        res.status(200).json({
            success: true,
            message: "Driver deleted successfully",
        });
    } catch (error) {
        await t.rollback();
        console.error("Error deleting driver:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting driver",
        });
    }
};


// get driver wallet
export const getDriverWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const driver = await Driver.findOne({
            where: { driverId: id }
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        const wallet = await DriverWallet.findOne({
            where: { walletId: driver.walletId }
        });


        if (!wallet) {
            res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Driver wallet retrieved successfully",
            data: wallet,
        });

    } catch (error) {
        console.error("Error fetching driver wallet:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching driver wallet",
        });
    }
}


// add wallet amount to driver

export const addDriverWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, remark } = req.body;

        log.info(`Driver wallet for driverId: ${id} added with amount: ${amount} entry $>>`);

        if (!remark) {
            res.status(400).json({
                success: false,
                message: "Remark is required",
            });
            return;
        }

        const driver = await Driver.findOne({
            where: { driverId: id }
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        const wallet = await DriverWallet.findOne({
            where: { walletId: driver.walletId }
        });


        if (!wallet) {
            res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
            return;
        }
        const currentWalletBalance = wallet.balance;
        wallet.balance += amount;
        wallet.plusAmount += amount;
        wallet.totalAmount = String(Number(wallet.totalAmount) + Number(amount));
        await wallet.save();

        const { customAlphabet } = await import('nanoid');

        const now = new Date().toISOString().replace(/[-:.TZ]/g, '');
        const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
        const customId = `Txn-${nanoid()}_${now}`;

        const admin = await Admin.findOne({
            where: { adminId: driver.adminId }
        });
        const driverName = `${driver.name} ${driver.phone}`;
        const adminName = admin?.name ?? "Silver Taxi";

        const fareBreakup = {
            previousWalletBalance: currentWalletBalance,
            amount: amount,
            prefix: "+",
            postWalletBalance: currentWalletBalance + amount,
        }

        const transaction = await WalletTransaction.create({
            adminId: driver.adminId,
            transactionId: customId,
            initiatedBy: adminName,
            initiatedTo: driverName,
            amount,
            type: "Credit",
            date: new Date(),
            tnxPaymentMethod: "Admin",
            tnxPaymentStatus: "Success",
            isShow: true,
            description: "Wallet amount added",
            driverId: driver.driverId,
            ownedBy: "Driver",
            remark: remark ?? null,
            fareBreakdown: fareBreakup,
        });
        await transaction.save();

        try {
            const walletNotification = await createDriverNotification({
                title: `wallet Credit : ${amount}`,
                message: `Admin had added amount to your wallet`,
                ids: {
                    adminId: driver.adminId,
                    driverId: driver.driverId,
                },
                type: "wallet"
            });

            if (walletNotification) {
                try {
                    if (driver.fcmToken) {
                        const tokenResponse = await sendToSingleToken(driver.fcmToken, {
                            ids: {
                                adminId: driver.adminId,
                                driverId: driver.driverId,
                            },
                            data: {
                                title: `wallet Credit : ${amount}`,
                                message: `Admin had added amount to your wallet`,
                                type: "wallet",
                                channelKey: "other_channel",
                            }
                        });
                        debug.info(`wallet FCM Notification Response: ${tokenResponse}`);
                    }
                } catch (err: any) {
                    debug.info(`wallet FCM Notification Send Error: ${err}`)
                }
            }
        } catch (err: any) {
            debug.info(`Wallet Notification Send Error : ${err}`)
        }

        log.info(`Driver wallet for driverId: ${id} added with amount: ${amount} exit <<$`);

        res.status(200).json({
            success: true,
            message: "Wallet amount added successfully",
            data: wallet,
        });
    } catch (error) {
        debug.info(`Error adding wallet amount >> ${error}`);
        res.status(500).json({
            success: false,
            message: "Error adding wallet amount",
        });
    }
}


//minus wallet amount from driver
export const minusDriverWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, remark } = req.body;

        log.info(`Driver wallet for driverId: ${id} minus with amount: ${amount} entry $>>`);

        if (!remark) {
            res.status(400).json({
                success: false,
                message: "Remark is required",
            });
            return;
        }


        const driver = await Driver.findOne({
            where: { driverId: id }
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        const wallet = await DriverWallet.findOne({
            where: { walletId: driver.walletId }
        });


        if (!wallet) {
            res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
            return;
        }

        const currentWalletBalance = wallet.balance;
        wallet.balance -= amount;
        wallet.minusAmount += amount;
        wallet.totalAmount = String(Number(wallet.totalAmount) - Number(amount));
        await wallet.save();

        const { customAlphabet } = await import('nanoid');

        const now = new Date().toISOString().replace(/[-:.TZ]/g, '');
        const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
        const customId = `Txn-${nanoid()}_${now}`;

        const admin = await Admin.findOne({
            where: { adminId: driver.adminId }
        });
        const driverName = `${driver.name} ${driver.phone}`;
        const adminName = admin?.name ?? "Silver Taxi";

        const fareBreakup = {
            previousWalletBalance: currentWalletBalance,
            amount: amount,
            prefix: "-",
            postWalletBalance: currentWalletBalance - amount,
        }

        const transaction = await WalletTransaction.create({
            adminId: driver.adminId,
            transactionId: customId,
            initiatedBy: adminName,
            initiatedTo: driverName,
            amount,
            type: "Debit",
            date: new Date(),
            tnxPaymentMethod: "Admin",
            tnxPaymentStatus: "Success",
            isShow: true,
            description: "Wallet amount subtracted",
            driverId: driver.driverId,
            ownedBy: "Driver",
            remark: remark ?? null,
            fareBreakdown: fareBreakup,
        });

        await transaction.save();

        try {
            const walletNotification = await createDriverNotification({
                title: `wallet Debit : ${amount}`,
                message: `Admin has deducted an amount from your wallet`,
                ids: {
                    adminId: driver.adminId,
                    driverId: driver.driverId,
                },
                type: "wallet"
            });

            if (walletNotification) {
                try {
                    if (driver.fcmToken) {
                        const tokenResponse = await sendToSingleToken(driver.fcmToken, {
                            // title: `wallet Debit : ${amount}`,
                            // message: `Admin has deducted an amount from your wallet`,
                            ids: {
                                adminId: driver.adminId,
                                driverId: driver.driverId,
                            },
                            data: {
                                title: `wallet Debit : ${amount}`,
                                message: `Admin has deducted an amount from your wallet`,
                                type: "wallet",
                                channelKey: "other_channel",
                            }
                        });
                        debug.info(`wallet FCM Notification Response: ${tokenResponse}`);
                    }
                } catch (err: any) {
                    debug.info(`wallet FCM Notification Send Error: ${err}`)
                }
            }
        } catch (err: any) {
            debug.info(`Wallet Notification Send Error : ${err}`)
        }

        log.info(`Driver wallet for driverId: ${id} minus with amount: ${amount} exit <<$`);

        res.status(200).json({
            success: true,
            message: "Wallet amount subtracted successfully",
            data: wallet,
        });
    } catch (error) {
        debug.info(`Error subtracting wallet amount >> ${error}`);
        res.status(500).json({
            success: false,
            message: "Error subtracting wallet amount",
        });
    }
}

export const multiDeleteDrivers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { driverIds } = req.body;

        if (!Array.isArray(driverIds) || driverIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: driverIds must be an array of driver IDs",
            });
            return;
        }

        const drivers = await Driver.findAll({
            where: { driverId: driverIds }
        });

        if (drivers.length === 0) {
            res.status(404).json({
                success: false,
                message: "No drivers found with the provided IDs",
            });
            return;
        }

        const wallets = await DriverWallet.findAll({
            where: { walletId: drivers.map(driver => driver.walletId) }
        });

        const vehicles = await Vehicle.findAll({
            where: { driverId: drivers.map(driver => driver.driverId) },
            paranoid: false
        })


        if (wallets.length > 0) {
            await Promise.all(wallets.map(wallet => wallet.destroy({ force: true })));
        }

        if (vehicles.length > 0) {
            await Promise.all(vehicles.map(vehicle => vehicle.destroy({ force: true })));
        }

        await Promise.all(drivers.map(driver => driver.destroy({ force: true })));

        res.status(200).json({
            success: true,
            message: "Drivers deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting drivers:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting drivers",
        });
    }
};


export const getAllDriverWalletRequests = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    if (!adminId) {
        res.status(400).json({
            success: false,
            message: "Admin ID is required",
        });
        return;
    }

    try {

        const requests = await DriverWalletRequest.findAll({
            where: { adminId: adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt', "vendorId"] },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: "Driver wallet requests fetched successfully",
            data: requests,
        });

    } catch (error) {
        debug.info(`Error fetching driver wallet requests >> ${error}`);
        res.status(500).json({
            success: false,
            message: "Error fetching driver wallet requests",
        });
    }
}


export const getDriverWalletRequestById = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { id } = req.params;

    if (!adminId || !id) {
        res.status(400).json({
            success: false,
            message: "Admin ID and request ID are required",
        });
        return;
    }

    try {

        const request = await DriverWalletRequest.findOne({
            where: { requestId: id, adminId: adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt', "vendorId"] },
            order: [['createdAt', 'DESC']]
        });

        if (!request) {
            res.status(404).json({
                success: false,
                message: "Request not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "single Driver wallet request fetched successfully",
            data: request,
        });
        return;

    } catch (error) {
        debug.info(`Error fetching driver wallet request >> ${error}`);
        res.status(500).json({
            success: false,
            message: "Error fetching driver wallet request",
        });
    }
}

export const approveOrRejectDriverWalletRequest = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { id } = req.params;
    const {
        status, remark, type,
        paymentMethod, tnxPaymentId
    } = req.body;

    if (!status || !type || !id) {
        res.status(400).json({
            success: false,
            message: "Status, type and id are required",
        });
        return;
    }

    try {
        log.info(`Driver wallet request for driverId: ${id} approve with status: ${status} entry $>>`);

        const driver = await Driver.findOne({
            where: {
                driverId: id,
                adminId: adminId
            }
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        const admin = await Admin.findOne({ where: { adminId: driver.adminId } });

        const request = await DriverWalletRequest.findOne({
            where: {
                driverId: id,
                type,
                status: "pending",
                adminId: adminId
            }
        });
        if (!request) {
            res.status(404).json({
                success: false,
                message: "Request not found",
            });
            return;
        }

        const wallet = await DriverWallet.findOne({ where: { walletId: request.walletId } });
        if (!wallet) {
            res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
            return;
        }

        const driverName = `${driver.name} ${driver.phone}`;
        const adminName = admin?.name ?? "Silver Taxi";

        // Handle Approved Requests
        if (status === "approved") {

            console.log(type, "type")
            const customId = await generateTransactionId();

            let walletTransaction = null;
            if (type === "add") {
                wallet.balance += request.amount;
                wallet.plusAmount += request.amount;
                wallet.totalAmount = String(Number(wallet.totalAmount) + Number(request.amount));

                walletTransaction = await WalletTransaction.create({
                    adminId: driver.adminId,
                    transactionId: customId,
                    initiatedBy: adminName,
                    initiatedTo: driverName,
                    amount: request.amount,
                    type: "Credit",
                    date: new Date(),
                    tnxPaymentMethod: "Admin",
                    tnxPaymentStatus: "Success",
                    isShow: true,
                    description: "Wallet amount added",
                    driverId: driver.driverId,
                    ownedBy: "Driver",
                    remark: `Request ID: ${request.requestId} - ${remark ?? ""}`,
                });
            }

            if (type === "withdraw") {
                wallet.balance -= request.amount;
                wallet.minusAmount += request.amount;

                walletTransaction = await WalletTransaction.create({
                    adminId: driver.adminId,
                    transactionId: customId,
                    initiatedBy: adminName,
                    initiatedTo: driverName,
                    amount: request.amount,
                    type: "Debit",
                    date: new Date(),
                    tnxPaymentMethod: paymentMethod ?? "Admin",
                    tnxPaymentStatus: "Success",
                    isShow: true,
                    description: "Wallet amount subtracted",
                    driverId: driver.driverId,
                    ownedBy: "Driver",
                    remark: `Request ID: ${request.requestId} - ${remark ?? ""}`,
                });
            }

            // Save changes
            request.status = "approved";
            request.remark = remark ?? null;
            request.transId = walletTransaction?.transactionId ?? undefined;
            if (type === "withdraw") {
                request.paymentMethod = paymentMethod ?? null;
                request.tnxPaymentId = tnxPaymentId ?? null;
            }
            await request.save();
            await wallet.save();

            // Send Notification
            try {
                const title = `wallet ${type === "add" ? "Credit" : "Debit"} : ${request.amount}`;
                const message = type === "add" ? "Wallet Request Approved" : "Withdrawal request approved";

                const walletNotification = await createDriverNotification({
                    title,
                    message,
                    ids: { adminId: driver.adminId, driverId: driver.driverId },
                    type: "wallet"
                });

                if (walletNotification && driver.fcmToken) {
                    await sendToSingleToken(driver.fcmToken, {
                        ids: { adminId: driver.adminId, driverId: driver.driverId },
                        data: {
                            title,
                            message,
                            type: "wallet",
                            channelKey: "other_channel",
                        }
                    });
                }
            } catch (err: any) {
                debug.info(`Notification Send Error: ${err}`);
            }

            res.status(200).json({
                success: true,
                message: "Wallet request approved successfully",
                data: wallet,
            });
            return;
        }

        // Handle Rejected Requests
        if (status === "rejected") {
            request.status = "rejected";
            request.remark = remark ?? null;
            request.paymentMethod = paymentMethod ?? null;
            request.tnxPaymentId = tnxPaymentId ?? null;
            await request.save();

            res.status(200).json({
                success: true,
                message: "Wallet request rejected successfully",
                data: request,
            });
            return;
        }

        log.info(`Driver wallet request for driverId: ${id} approve with status: ${status} exit <<$`);

        res.status(400).json({
            success: false,
            message: "Invalid status",
        });
        return;

    } catch (error) {
        debug.info(`Error approving driver wallet request >> ${error}`);
        res.status(500).json({
            success: false,
            message: "Error approving driver wallet request",
        });
        return;
    }
};


export const walletBulkRequest = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;

    if (!adminId) {
        res.status(400).json({
            success: false,
            message: "Admin ID is required",
        });
        return;
    }

    try {
        const validatedData = walletBulkRequestSchema.safeParse(req.body);

        if (!validatedData.success) {
            const errors = validatedData.error.errors.map(err => ({
                field: err.path.join("."),
                message: err.message
            }));

            res.status(400).json({
                success: false,
                message: errors,
                errors: errors,
            });
            return;
        }

        const { amount, reason, days, adjustmentType, status } = validatedData.data;


        publishDriverWork("walletBulkRequest", {
            adminId,
            amount,
            reason,
            days,
            adjustmentType,
            status,
        })

        console.log("Wallet bulk request published to queue");
        res.status(200).json({
            success: true,
            message: "Wallet bulk request sent to queue",
        });
        return;

    } catch (error) {
        debug.info(`Error fetching driver wallet request >> ${error}`);
        res.status(500).json({
            success: false,
            message: "Error fetching driver wallet request",
        });
    }
}
