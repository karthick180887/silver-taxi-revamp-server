import { Response, Request } from "express";
import { Vendor } from "../../../core/models/vendor";
import { WalletTransaction } from "../../../core/models/walletTransaction";
import { Booking } from "../../../core/models/booking";
import { VendorWallet } from "../../../core/models";
import { debugLogger as debug, infoLogger as log, } from "../../../../utils/logger";
import { vendorPaymentDetailsSchema } from "../../../../common/validations/vendorSchema";
import { VendorBankDetails } from "../../../core/models/vendorBankDetails";

export const getVendorProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const vendorId = req.query.vendorId ?? req.body.vendorId;
        const adminId = req.query.adminId ?? req.body.adminId;

        const vendor = await Vendor.findOne({
            where: {
                vendorId,
                adminId,
            },
            attributes: {
                exclude: ["password", "createdAt", "updatedAt"],
            },
        });

        const totalEarnings = await VendorWallet.findOne({
            where: {
                vendorId,
                adminId
            },
            attributes: ["vendorId", "balance"]
        });

        const bookings = await Booking.findAll({
            where: {
                vendorId,
                adminId,
            },
        });

        res.json({
            success: true,
            message: "Vendor profile retrieved successfully",
            data: {
                vendor: {
                    ...vendor?.toJSON(),
                    totalTrips: bookings.length,
                    totalEarnings: totalEarnings?.balance
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getVendorWalletTransactions = async (
    req: Request,
    res: Response
) => {
    try {
        const vendorId = req.query.vendorId ?? req.body.vendorId;
        const adminId = req.query.adminId ?? req.body.adminId;

        const transactions = await WalletTransaction.findAll({
            where: { vendorId: vendorId, adminId: adminId },
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({
            success: true,
            message: "Vendor Transactions fetched successfully",
            data: transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};



export const fcmTokenUpdate = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const vendorId = req.body.vendorId ?? req.query.vendorId;
    const { fcmToken } = req.body

    if (!vendorId) {
        res.status(401).json({
            success: false,
            message: "Vendor id is required",
        });
        return;
    }

    try {
        const vendor = await Vendor.findOne({
            where: { vendorId, adminId },
        });

        if (!fcmToken) {
            res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
            return;
        }

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        vendor.fcmToken = fcmToken;
        await vendor.save();
        res.status(200).json({
            success: true,
            message: "FCM token updated successfully",
            data: {
                vendorId: vendor.vendorId,
                fcmToken: vendor.fcmToken

            },
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



export const vendorPaymentDetailsGet = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const vendorId = req.body.vendorId ?? req.query.vendorId;



    if (!vendorId) {
        res.status(401).json({
            success: false,
            message: "Vendor id is required",
        });
        return;
    }

    try {
        log.info(`Fetching vendor payment details for vendorId: ${vendorId} entry $>>`);

        const vendorPaymentDetails = await VendorBankDetails.findAll({
            where: { adminId, vendorId },
            attributes: {
                exclude: ['id', 'updatedAt', 'deletedAt'],
            },
            order: [['createdAt', 'DESC']],
        });

        if (vendorPaymentDetails.length === 0) {
            res.status(400).json({
                success: false,
                message: "Vendor payment details not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Vendor payment details fetched successfully",
            data: vendorPaymentDetails,
        });

        log.info(`Vendor payment details fetched successfully for vendorId: ${vendorId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error fetching vendor payment details for vendorId: ${vendorId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor payment details",
            error,
        });
        return;
    }
}

export const vendorPaymentDetailsGetById = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const vendorId = req.body.vendorId ?? req.query.vendorId;
    const id = req.params.id;


    if (!vendorId) {
        res.status(401).json({
            success: false,
            message: "Vendor id is required",
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
        log.info(`Fetching vendor payment details for vendorId: ${vendorId} and id: ${id} entry $>>`);

        const vendorPaymentDetails = await VendorBankDetails.findOne({
            where: { adminId, vendorId, paymentDetailsId: id },
            attributes: {
                exclude: ['id', 'updatedAt', 'deletedAt'],
            },
        });

        if (!vendorPaymentDetails) {
            res.status(400).json({
                success: false,
                message: "Vendor payment details not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Vendor payment details fetched successfully by id",
            data: vendorPaymentDetails,
        });

        log.info(`Vendor payment details fetched successfully for vendorId: ${vendorId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error fetching vendor payment details for vendorId: ${vendorId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor payment details",
            error,
        });
        return;
    }
}

export const vendorPaymentDetailsCreate = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const vendorId = req.body.vendorId ?? req.query.vendorId;


    if (!vendorId) {
        res.status(401).json({
            success: false,
            message: "Vendor id is required",
        });
        return;
    }

    try {
        log.info(`Creating vendor payment details for vendorId: ${vendorId} entry $>>`);

        const validatedData = vendorPaymentDetailsSchema.safeParse(req.body);

        if (!validatedData.success) {
            const errors = validatedData.error.errors.map((err: any) => ({
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

        const existingVendorPaymentDetails = await VendorBankDetails.findAll({
            where: { adminId, vendorId },
        });

        const SetIsPrimary = existingVendorPaymentDetails.length === 0 ? true : false;
        const vendorPaymentDetails = await VendorBankDetails.create({
            adminId,
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
            vendorId,
            bankDetailsVerified
        })
        vendorPaymentDetails.paymentDetailsId = `PAY${vendorPaymentDetails.id.toString().padStart(6, "0")}`;
        vendorPaymentDetails.save();

        res.status(200).json({
            success: true,
            message: "Vendor payment details created successfully",
            data: vendorPaymentDetails,
        });

        log.info(`Vendor payment details created successfully for vendorId: ${vendorId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error creating vendor payment details for vendorId: ${vendorId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error creating vendor payment details",
            error,
        });
        return;
    }
}

export const vendorPaymentDetailsUpdate = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const vendorId = req.body.vendorId ?? req.query.vendorId;
    const { id } = req.params;

    if (!vendorId) {
        res.status(401).json({
            success: false,
            message: "Vendor id is required",
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
        log.info(`Updating vendor payment details for vendorId: ${vendorId} entry $>>`);

        const validatedData = vendorPaymentDetailsSchema.safeParse(req.body);

        const vendorPaymentDetails = await VendorBankDetails.findOne({
            where: { adminId, vendorId, paymentDetailsId: id },
        });

        if (!vendorPaymentDetails) {
            res.status(400).json({
                success: false,
                message: "Vendor payment details not found",
            });
            return;
        }

        if (!validatedData.success) {
            const errors = validatedData.error.errors.map((err: any) => ({
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
            upiId,
            upiNumber,
            accountDescription,
        } = validatedData.data;

        const updatedVendorPaymentDetails = await vendorPaymentDetails.update({
            accountName,
            bankBookImage,
            bankName,
            bankAccountNumber,
            ifscCode,
            accountHolderName,
            upiId,
            upiNumber,
            accountDescription,
        });

        await updatedVendorPaymentDetails.save();

        res.status(200).json({
            success: true,
            message: "Vendor payment details updated successfully",
            data: updatedVendorPaymentDetails,
        });

        log.info(`Vendor payment details updated successfully for vendorId: ${vendorId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error updating vendor payment details for vendorId: ${vendorId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error updating vendor payment details",
            error,
        });
        return;
    }
}

export const vendorPaymentDetailsToggle = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const vendorId = req.body.vendorId ?? req.query.vendorId;
    const { id, type } = req.params;

    if (!vendorId) {
        res.status(401).json({
            success: false,
            message: "Vendor id is required",
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
        log.info(`Toggling vendor payment details for vendorId: ${vendorId} entry $>>`);


        let vendorPaymentDetails = await VendorBankDetails.findOne({
            where: { adminId, vendorId, paymentDetailsId: id },
        });

        if (!vendorPaymentDetails) {
            res.status(400).json({
                success: false,
                message: "Vendor payment details not found",
            });
            return;
        }

        switch (type.toLowerCase()) {
            case "active":
                vendorPaymentDetails.isActive = !vendorPaymentDetails.isActive;
                await VendorBankDetails.update({
                    isActive: !vendorPaymentDetails.isActive
                }, {
                    where: { vendorId, paymentDetailsId: id }
                });
                await vendorPaymentDetails.save();
                break;
            case "inactive":
                vendorPaymentDetails.isActive = !vendorPaymentDetails.isActive;
                await VendorBankDetails.update({
                    isActive: !vendorPaymentDetails.isActive
                }, {
                    where: { vendorId, paymentDetailsId: id }
                });
                await vendorPaymentDetails.save();
                break;
            case "primary":
                if (!vendorPaymentDetails.isPrimary) {
                    await VendorBankDetails.update(
                        { isPrimary: false },
                        { where: { vendorId, isPrimary: true } }
                    );

                    vendorPaymentDetails.isPrimary = true;
                    await VendorBankDetails.update({
                        isPrimary: true
                    }, {
                        where: { vendorId, paymentDetailsId: id }
                    });
                    await vendorPaymentDetails.save();
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
            message: `Vendor payment details ${type} successfully`,
            data: vendorPaymentDetails,
        });

        log.info(`Vendor payment details toggled successfully for vendorId: ${vendorId} exit <<$`);
        return;
    } catch (error) {
        debug.error(`Error updating vendor payment details for vendorId: ${vendorId} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Error toggling vendor payment details",
            error,
        });
        return;
    }
}