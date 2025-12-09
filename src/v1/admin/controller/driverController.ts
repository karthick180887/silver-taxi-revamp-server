import { Request, Response } from "express";
import { randomUUID } from "crypto";
import {
    Driver, Admin,
    DriverWallet,
    WalletTransaction,
    Vehicle,
    DriverBookingLog,
    DriverWalletRequest
} from "../../core/models"; // Ensure the import path is correct
import { VehicleAttributes } from "../../core/models/vehicles";
import fs from 'fs/promises';
import { uploadFileToDOS3 } from "../../../utils/minio.image";
import { sequelize } from "../../../common/db/postgres";
import { Op } from "sequelize";
import { sendToSingleToken } from "../../../common/services/firebase/appNotify";
import { createDriverNotification } from "../../core/function/notificationCreate";
import { debugLogger as debug, infoLogger as log } from "../../../utils/logger";
import { generateTransactionId } from "../../core/function/commissionCalculation";
import { walletBulkRequestSchema } from "../../../common/validations/driverSchema";
import { QueryParams } from "../../../common/types/global.types";
import { getAllRedisDrivers, getDriverFcmToken, getRedisDrivers, setRedisDrivers } from "../../../utils/redis.configs";
import { publishDriverWork } from "../../../common/services/rabbitmq/publisher";

// Get all drivers


export const getAllDrivers = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            page = 1,
            limit = 25,
            search = '',
            status = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        }: QueryParams = req.query;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Driver",
            });
            return;
        }

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause: any = { adminId };

        // Add status filter if provided
        if (status) {
            whereClause.status = status;
        }

        // Build search conditions
        const searchConditions: any[] = [];
        if (search) {
            searchConditions.push(
                { driverId: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } }
            );
        }

        // Add search conditions to where clause if they exist
        if (searchConditions.length > 0) {
            whereClause[Op.or] = searchConditions;
        }

        // Define sort order mapping
        const order: any[] = [];
        if (sortBy === 'walkerBalance') {
            // Sort by associated model field
            order.push([{ model: DriverWallet, as: 'wallet' }, 'balance', sortOrder]);
        } else {
            // Sort by driver field
            order.push([sortBy, sortOrder]);
        }

        // Execute query with pagination
        const { count, rows: drivers } = await Driver.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [{
                model: DriverWallet,
                as: 'wallet',
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
            }],
            order,
            limit: parseInt(limit as any),
            offset: offset,
            distinct: true // Important for count with includes
        });

        const [active, inactive] = await Promise.all([
            Driver.count({ where: { ...whereClause, isActive: true } }),
            Driver.count({ where: { ...whereClause, isActive: false } })
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(count / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        res.status(200).json({
            success: true,
            message: "Drivers retrieved successfully",
            data: {
                drivers,
                driversCount: {
                    active,
                    inactive,
                    total: count
                },
                pagination: {
                    currentPage: parseInt(page as any),
                    totalPages,
                    totalCount: count,
                    hasNext,
                    hasPrev,
                    limit: parseInt(limit as any)
                }
            },
        });

    } catch (error) {
        console.error("Error fetching drivers:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching drivers",
        });
    }
};

export const getAllDriversWithLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const drivers = await getAllRedisDrivers(adminId);
        res.status(200).json({
            success: true,
            message: "Drivers with location fetched successfully",
            data: drivers
        });
    } catch (error) {
        console.error("Error fetching drivers with location:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching drivers with location",
        });
    }
}

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
    const limit = Number(req.query.limit ?? 30);
    const offset = Number(req.query.offset ?? 0);
    try {
        const walletTrans = await WalletTransaction.findAll({
            where: {
                adminId,
                driverId: id,
            },
            order: [["createdAt", "DESC"]],
            limit: limit,
            offset: offset,
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


// Constants for verification status values
const VERIFICATION_STATUS = {
    PENDING: "pending",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
} as const;

const ADMIN_VERIFICATION_STATUS = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
} as const;

type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];
type AdminVerificationStatus = typeof ADMIN_VERIFICATION_STATUS[keyof typeof ADMIN_VERIFICATION_STATUS];

interface VerificationUpdateFields {
    [key: string]: string | boolean | null | undefined;
}

interface VehicleVerificationFields {
    vehicleProfileVerified?: VerificationStatus;
    vehicleRemark?: string;
    rcFrontVerified?: VerificationStatus;
    rcFrontRemark?: string;
    rcBackVerified?: VerificationStatus;
    rcBackRemark?: string;
    insuranceVerified?: VerificationStatus;
    insuranceRemark?: string;
}

interface DriverVerificationFields {
    profileVerified?: VerificationStatus;
    remark?: string;
    aadharImageFrontVerified?: VerificationStatus;
    aadharImageFrontRemark?: string;
    aadharBackVerified?: VerificationStatus;
    aadharBackRemark?: string;
    licenseImageFrontVerified?: VerificationStatus;
    licenseImageFrontRemark?: string;
    licenseImageBackVerified?: VerificationStatus;
    licenseImageBackRemark?: string;
}

/**
 * Updates driver and/or vehicle verification status
 * @param req - Express request object containing verification fields
 * @param res - Express response object
 * @returns Promise<void>
 */
export const verificationStatus = async (req: Request, res: Response): Promise<void> => {
    const transaction = await sequelize.transaction();
    
    try {
        // Extract and validate required parameters
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id: driverId } = req.params;
        const { vehicleId } = req.body;

        if (!adminId) {
            await transaction.rollback();
            res.status(400).json({
                success: false,
                message: "adminId is required",
            });
            return;
        }

        if (!driverId) {
            await transaction.rollback();
            res.status(400).json({
                success: false,
                message: "driverId is required in URL parameters",
            });
            return;
        }

        // Extract verification fields from request body
        const driverFields: DriverVerificationFields = {
            profileVerified: req.body.profileVerified,
            remark: req.body.remark,
            aadharImageFrontVerified: req.body.aadharImageFrontVerified,
            aadharImageFrontRemark: req.body.aadharImageFrontRemark,
            aadharBackVerified: req.body.aadharBackVerified,
            aadharBackRemark: req.body.aadharBackRemark,
            licenseImageFrontVerified: req.body.licenseImageFrontVerified,
            licenseImageFrontRemark: req.body.licenseImageFrontRemark,
            licenseImageBackVerified: req.body.licenseImageBackVerified,
            licenseImageBackRemark: req.body.licenseImageBackRemark,
        };

        const vehicleFields: VehicleVerificationFields = {
            vehicleProfileVerified: req.body.vehicleProfileVerified,
            vehicleRemark: req.body.vehicleRemark,
            rcFrontVerified: req.body.rcFrontVerified,
            rcFrontRemark: req.body.rcFrontRemark,
            rcBackVerified: req.body.rcBackVerified,
            rcBackRemark: req.body.rcBackRemark,
            insuranceVerified: req.body.insuranceVerified,
            insuranceRemark: req.body.insuranceRemark,
        };

        debug.info("Verification status update request", { adminId, driverId, vehicleId, driverFields, vehicleFields });

        // Check if any vehicle-related fields are being updated
        const hasVehicleFields = Object.values(vehicleFields).some(value => value !== undefined);

        // Only require vehicleId if vehicle fields are being updated
        if (hasVehicleFields && !vehicleId) {
            await transaction.rollback();
            res.status(400).json({
                success: false,
                message: "vehicleId is required when updating vehicle verification fields",
            });
            return;
        }

        // Build the driver query with conditional vehicle inclusion
        const driverQuery: any = {
            where: { adminId, driverId },
            include: [{
                model: Vehicle,
                as: 'vehicle',
                required: false, // Left join to allow driver without vehicle
                ...(vehicleId && { where: { vehicleId } }),
                order: [['createdAt', 'ASC']],
            }],
        };

        const driver = await Driver.findOne(driverQuery);

        if (!driver) {
            await transaction.rollback();
            res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
            return;
        }

        const vehicle = (driver as any)?.vehicle?.[0] as VehicleAttributes | undefined;

        // Validate vehicle exists if vehicle fields are being updated
        if (hasVehicleFields && !vehicle) {
            await transaction.rollback();
            res.status(404).json({
                success: false,
                message: 'Vehicle not found for this driver',
            });
            return;
        }

        // Use vehicleId from request or from vehicle object
        const actualVehicleId = vehicleId || vehicle?.vehicleId;

        // Process driver verification updates
        const driverUpdateFields: VerificationUpdateFields = {};
        const vehicleUpdateFields: VerificationUpdateFields = {};

        /**
         * Handles verification status update logic
         */
        const handleVerificationUpdate = (
            verifiedValue: VerificationStatus | undefined,
            verifiedField: string,
            remarkField: string,
            target: VerificationUpdateFields,
            isProfileField: boolean
        ): void => {
            if (verifiedValue !== undefined) {
                target[verifiedField] = verifiedValue;
                
                // Clear remark when accepted
                if (verifiedValue === VERIFICATION_STATUS.ACCEPTED) {
                    target[remarkField] = null;
                }
                
                // Set parent verification status when rejected
                if (verifiedValue === VERIFICATION_STATUS.REJECTED) {
                    if (isProfileField) {
                        target.profileVerified = VERIFICATION_STATUS.REJECTED;
                    } else {
                        target.documentVerified = VERIFICATION_STATUS.REJECTED;
                    }
                }
            }
        };

        // Update driver fields
        handleVerificationUpdate(
            driverFields.profileVerified,
            'profileVerified',
            'profileRemark',
            driverUpdateFields,
            true
        );
        if (driverFields.remark !== undefined && driverFields.profileVerified !== VERIFICATION_STATUS.ACCEPTED) {
            driverUpdateFields.remark = driverFields.remark;
        }

        handleVerificationUpdate(
            driverFields.aadharImageFrontVerified,
            'aadharImageFrontVerified',
            'aadharImageFrontRemark',
            driverUpdateFields,
            false
        );
        if (driverFields.aadharImageFrontRemark !== undefined && 
            driverFields.aadharImageFrontVerified !== VERIFICATION_STATUS.ACCEPTED) {
            driverUpdateFields.aadharImageFrontRemark = driverFields.aadharImageFrontRemark;
        }

        handleVerificationUpdate(
            driverFields.aadharBackVerified,
            'aadharImageBackVerified',
            'aadharImageBackRemark',
            driverUpdateFields,
            false
        );
        if (driverFields.aadharBackRemark !== undefined && 
            driverFields.aadharBackVerified !== VERIFICATION_STATUS.ACCEPTED) {
            driverUpdateFields.aadharImageBackRemark = driverFields.aadharBackRemark;
        }

        handleVerificationUpdate(
            driverFields.licenseImageFrontVerified,
            'licenseImageFrontVerified',
            'licenseImageFrontRemark',
            driverUpdateFields,
            false
        );
        if (driverFields.licenseImageFrontRemark !== undefined && 
            driverFields.licenseImageFrontVerified !== VERIFICATION_STATUS.ACCEPTED) {
            driverUpdateFields.licenseImageFrontRemark = driverFields.licenseImageFrontRemark;
        }

        handleVerificationUpdate(
            driverFields.licenseImageBackVerified,
            'licenseImageBackVerified',
            'licenseImageBackRemark',
            driverUpdateFields,
            false
        );
        if (driverFields.licenseImageBackRemark !== undefined && 
            driverFields.licenseImageBackVerified !== VERIFICATION_STATUS.ACCEPTED) {
            driverUpdateFields.licenseImageBackRemark = driverFields.licenseImageBackRemark;
        }

        // Update vehicle fields
        if (hasVehicleFields && vehicle) {
            handleVerificationUpdate(
                vehicleFields.vehicleProfileVerified,
                'profileVerified',
                'remark',
                vehicleUpdateFields,
                true
            );
            if (vehicleFields.vehicleRemark !== undefined && 
                vehicleFields.vehicleProfileVerified !== VERIFICATION_STATUS.ACCEPTED) {
                vehicleUpdateFields.remark = vehicleFields.vehicleRemark;
            }

            handleVerificationUpdate(
                vehicleFields.rcFrontVerified,
                'rcFrontVerified',
                'rcFrontRemark',
                vehicleUpdateFields,
                false
            );
            if (vehicleFields.rcFrontRemark !== undefined && 
                vehicleFields.rcFrontVerified !== VERIFICATION_STATUS.ACCEPTED) {
                vehicleUpdateFields.rcFrontRemark = vehicleFields.rcFrontRemark;
            }

            handleVerificationUpdate(
                vehicleFields.rcBackVerified,
                'rcBackVerified',
                'rcBackRemark',
                vehicleUpdateFields,
                false
            );
            if (vehicleFields.rcBackRemark !== undefined && 
                vehicleFields.rcBackVerified !== VERIFICATION_STATUS.ACCEPTED) {
                vehicleUpdateFields.rcBackRemark = vehicleFields.rcBackRemark;
            }

            handleVerificationUpdate(
                vehicleFields.insuranceVerified,
                'insuranceVerified',
                'insuranceRemark',
                vehicleUpdateFields,
                false
            );
            if (vehicleFields.insuranceRemark !== undefined && 
                vehicleFields.insuranceVerified !== VERIFICATION_STATUS.ACCEPTED) {
                vehicleUpdateFields.insuranceRemark = vehicleFields.insuranceRemark;
            }
        }

        // Set isUpdated flag if any document is rejected
        const hasRejectedDriverDoc = Object.entries(driverUpdateFields).some(
            ([key, value]) => typeof value === "string" && 
                              value.toLowerCase() === VERIFICATION_STATUS.REJECTED && 
                              key.endsWith("Verified")
        );
        if (hasRejectedDriverDoc) {
            driverUpdateFields.isUpdated = true;
        }

        const hasRejectedVehicleDoc = Object.entries(vehicleUpdateFields).some(
            ([key, value]) => typeof value === "string" && 
                              value.toLowerCase() === VERIFICATION_STATUS.REJECTED && 
                              key.endsWith("Verified")
        );
        if (hasRejectedVehicleDoc) {
            vehicleUpdateFields.isUpdated = true;
        }

        // Check if all driver documents are accepted
        const driverDocumentFields: (VerificationStatus | undefined)[] = [
            driverFields.aadharImageFrontVerified ?? driver.aadharImageFrontVerified,
            driverFields.aadharBackVerified ?? driver.aadharImageBackVerified,
            driverFields.licenseImageFrontVerified ?? driver.licenseImageFrontVerified,
            driverFields.licenseImageBackVerified ?? driver.licenseImageBackVerified,
        ];
        const allDriverDocsAccepted = driverDocumentFields.every(
            field => field === VERIFICATION_STATUS.ACCEPTED
        );

        // Check if all vehicle documents are accepted (if vehicle exists)
        let allVehicleDocsAccepted = true;
        if (vehicle) {
            const vehicleDocumentFields: (VerificationStatus | undefined)[] = [
                vehicleFields.rcFrontVerified ?? vehicle.rcFrontVerified,
                vehicleFields.rcBackVerified ?? vehicle.rcBackVerified,
                vehicleFields.insuranceVerified ?? vehicle.insuranceVerified,
            ];
            allVehicleDocsAccepted = vehicleDocumentFields.every(
                field => field === VERIFICATION_STATUS.ACCEPTED
            );
            debug.info("Vehicle document verification status", { vehicleDocumentFields, allVehicleDocsAccepted });
        }

        // Auto-set documentVerified status
        if (allDriverDocsAccepted) {
            driverUpdateFields.documentVerified = VERIFICATION_STATUS.ACCEPTED;
            driverUpdateFields.documentRemark = null;
        }

        if (vehicle && allVehicleDocsAccepted) {
            vehicleUpdateFields.documentVerified = VERIFICATION_STATUS.ACCEPTED;
            vehicleUpdateFields.documentRemark = null;
        }

        debug.info("Document verification status", { 
            allDriverDocsAccepted, 
            allVehicleDocsAccepted,
            hasVehicle: !!vehicle 
        });

        // Set adminVerified = Approved if everything is accepted
        const shouldApproveDriver = vehicle 
            ? (allDriverDocsAccepted && allVehicleDocsAccepted)
            : allDriverDocsAccepted;

        if (shouldApproveDriver) {
            driverUpdateFields.adminVerified = ADMIN_VERIFICATION_STATUS.APPROVED;
            driverUpdateFields.isActive = true;
            
            if (vehicle) {
                vehicleUpdateFields.adminVerified = ADMIN_VERIFICATION_STATUS.APPROVED;
            }

            // Update Redis cache
            await setRedisDrivers(driver.adminId, driver.driverId, {
                driverId: driver.driverId,
                adminId: driver.adminId,
                name: driver.name,
                phone: driver.phone,
                adminVerified: ADMIN_VERIFICATION_STATUS.APPROVED,
                geoLocation: null,
                isActive: true,
                fcmToken: driver.fcmToken,
                walletId: driver.walletId,
            });
        }

        // Perform database updates within transaction
        if (Object.keys(driverUpdateFields).length > 0) {
            await driver.update(driverUpdateFields, { transaction });
        }

        if (vehicle && actualVehicleId && Object.keys(vehicleUpdateFields).length > 0) {
            await Vehicle.update(vehicleUpdateFields, {
                where: { vehicleId: actualVehicleId },
                transaction
            });
        }

        // Commit transaction
        await transaction.commit();

        // Reload driver with updated data
        const updatedDriver = await driver.reload({
            include: [{
                model: Vehicle,
                as: 'vehicle',
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                required: false,
                order: [['createdAt', 'DESC']]
            }],
        });

        log.info(`Verification status updated successfully for driver ${driverId}`, { adminId, vehicleId });

        res.status(200).json({
            success: true,
            message: 'Verification field(s) updated successfully',
            updatedFields: updatedDriver,
        });

    } catch (error: any) {
        // Rollback transaction on error
        await transaction.rollback();
        
        const errorMessage = error?.message || "Error updating verification status";
        const errorStack = error?.stack;
        
        log.error("Error updating verification status", { 
            error: errorMessage, 
            stack: errorStack,
            driverId: req.params.id,
            adminId: req.body.adminId ?? req.query.adminId 
        });

        res.status(500).json({
            success: false,
            message: "Error updating verification status",
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
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
                const imageUrl = await uploadFileToDOS3(imageBuffer, `driver/${newDriver.driverId}.webp`);

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
                    const redisFcmToken = driver.adminId
                        ? await getDriverFcmToken(String(driver.adminId), String(driver.driverId))
                        : null;
                    const targetFcmToken = redisFcmToken || driver.fcmToken;

                    if (targetFcmToken) {
                        const tokenResponse = await sendToSingleToken(targetFcmToken, {
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
                    } else {
                        debug.info(`wallet credit notification skipped due to missing FCM token for driver ${driver.driverId}`);
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
                    const redisFcmToken = driver.adminId
                        ? await getDriverFcmToken(String(driver.adminId), String(driver.driverId))
                        : null;
                    const targetFcmToken = redisFcmToken || driver.fcmToken;

                    if (targetFcmToken) {
                        const tokenResponse = await sendToSingleToken(targetFcmToken, {
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
                    } else {
                        debug.info(`wallet debit notification skipped due to missing FCM token for driver ${driver.driverId}`);
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

                if (walletNotification) {
                    const redisFcmToken = driver.adminId
                        ? await getDriverFcmToken(String(driver.adminId), String(driver.driverId))
                        : null;
                    const targetFcmToken = redisFcmToken || driver.fcmToken;

                    if (targetFcmToken) {
                        await sendToSingleToken(targetFcmToken, {
                            ids: { adminId: driver.adminId, driverId: driver.driverId },
                            data: {
                                title,
                                message,
                                type: "wallet",
                                channelKey: "other_channel",
                            }
                        });
                    } else {
                        debug.info(`wallet request notification skipped due to missing FCM token for driver ${driver.driverId}`);
                    }
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

        const whereClause: any = {
            adminId,
            walletId: {
                [Op.ne]: null
            }
        };

        if (typeof status === "boolean") {
            whereClause.isActive = status;
        }

        if (days && days > 0) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            whereClause.lastActiveDate = {
                [Op.lte]: cutoffDate
            };
        }

        const totalDrivers = await Driver.count({ where: whereClause });

        if (totalDrivers === 0) {
            res.status(404).json({
                success: false,
                message: "No drivers found for the provided filters",
            });
            return;
        }

        const chunkSize = 500;
        const jobId = `wallet-bulk-${randomUUID()}`;
        let offset = 0;
        let chunkIndex = 1;
        let publishedChunks = 0;

        while (offset < totalDrivers) {
            const drivers = await Driver.findAll({
                where: whereClause,
                attributes: ["driverId", "walletId", "adminId", "name", "phone"],
                order: [["id", "ASC"]],
                limit: chunkSize,
                offset,
            });

            if (!drivers.length) {
                break;
            }

            // Enrich with FCM tokens from Redis
            const driversWithFcmTokens = await Promise.all(
                drivers.map(async (driver) => {
                    const redisFcmToken = driver.adminId
                        ? await getDriverFcmToken(String(driver.adminId), String(driver.driverId))
                        : null;
                    return {
                        driverId: driver.driverId,
                        walletId: driver.walletId,
                        adminId: driver.adminId,
                        name: driver.name,
                        phone: driver.phone,
                        fcmToken: redisFcmToken ?? null,
                    };
                })
            );

            await publishDriverWork("driver.wallet.bulk", {
                jobId,
                adminId,
                chunk: {
                    index: chunkIndex,
                    size: drivers.length,
                    total: totalDrivers,
                },
                request: {
                    amount,
                    reason,
                    days,
                    adjustmentType,
                    statusFilter: status ?? null,
                },
                drivers: driversWithFcmTokens,
            });

            offset += drivers.length;
            chunkIndex += 1;
            publishedChunks += 1;
        }

        log.info(`Wallet bulk request ${jobId} published in ${publishedChunks} chunks`);
        res.status(202).json({
            success: true,
            message: "Wallet bulk request sent to queue",
            data: {
                jobId,
                chunks: publishedChunks,
                totalDrivers,
            }
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
