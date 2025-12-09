import { Request, Response } from "express";
import { PromoCode } from "../../core/models"; // Import the promo code model
import { Op } from "sequelize";
import schedule from 'node-schedule';
import { logger } from "../../../utils/logger";
import fs from 'fs/promises';
import { uploadFileToDOS3 } from "../../../utils/minio.image";
import { configDotenv } from "dotenv";
const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
};

export const getAllPromoCodes = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        // Automatically expire promo codes that have passed their end date
        await PromoCode.update(
            { status: false },
            {
                where: {
                    adminId,
                    endDate: { [Op.lt]: new Date() },
                    status: true
                }
            }
        );

        // Retrieve all active promo codes
        const promoCodes = await PromoCode.findAll({
            where: { adminId },
            attributes: { exclude: ['id', 'deletedAt'] },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: "Promo codes retrieved successfully",
            data: promoCodes,
        });
    } catch (error) {
        console.error("Error fetching promo codes:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching promo codes",
        });
    }
};

// Get promo code by ID
export const getPromoCodeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const promoCode = await PromoCode.findOne(
            {
                where: { id },
                attributes: { exclude: ['id', 'deletedAt'] }
            });


        if (!promoCode) {
            res.status(404).json({
                success: false,
                message: "Promo code not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Promo code retrieved successfully",
            data: promoCode,
        });
    } catch (error) {
        console.error("Error fetching promo code:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching promo code",
        });
    }
};

// Create a new promo code
export const createPromoCode = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const bannerImage = req.file;
        const {
            promoName,
            title,
            code,
            category,
            description,
            keywords,
            minAmount,
            maxDiscount,
            usageLimit,
            usedCount,
            type,
            value,
            status = true,
            startDate,
            endDate,
            limit
        } = req.body;
        console.log("promo codes", req.body);

        if (!code || !category || !type) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (code, category, type)",
            });
            return;
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isValidDate(start) || !isValidDate(end)) {
            res.status(400).json({
                success: false,
                message: "Invalid start or end date",
            });
            return;
        }

        // Custom validation
        const validPromoCode = () => {
            if (type === "Percentage" && (value < 0 || value > 100)) {
                return { success: false, message: "Percentage value must be between 0 and 100" };
            }
            if (type === "Flat" && value < 0) {
                return { success: false, message: "Flat value must be greater than 0" };
            }
            if (start > end) {
                return { success: false, message: "Start date must be before end date" };
            }
            return { success: true };
        };

        const validationResult = validPromoCode();
        if (!validationResult.success) {
            res.status(400).json(validationResult);
            return;
        }

        // Check for active promo codes only if creating an active promo code
        // if (status) {
        //     const today = new Date();
        //     const existingPromoCode = await PromoCode.findOne({
        //         where: {
        //             category,
        //             status: true,
        //             endDate: { [Op.gte]: today },
        //         },
        //     });
        //     if (existingPromoCode) {
        //         res.status(400).json({
        //             success: false,
        //             message: "An active promo code already exists for this category. Please deactivate it or wait until its end date before creating a new one.",
        //         });
        //         return;
        //     }
        // }

        // Create the new promo code
        const newPromoCode = await PromoCode.create({
            adminId,
            promoName,
            title,
            code,
            category,
            description,
            keywords: keywords || "",
            minAmount: minAmount || 0,
            maxDiscount: maxDiscount || 0,
            usageLimit: usageLimit || 0,
            usedCount: usedCount || 0,
            type,
            value,
            status,
            startDate: start,
            endDate: end,
            limit: limit || 1

        });

        newPromoCode.codeId = `promo-${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}-${newPromoCode.id}`;
        await newPromoCode.save();

        if (bannerImage) {
            try {
                // Read the file from the temporary path
                const imageBuffer = await fs.readFile(bannerImage.path);

                // Upload to MinIO
                const imageUrl = await uploadFileToDOS3(imageBuffer, `promo-codes/${newPromoCode.codeId}.webp`);

                // Update promo code with image URL
                newPromoCode.bannerImage = imageUrl ?? '';
                await newPromoCode.save();

                // Clean up: Delete the temporary file
                await fs.unlink(bannerImage.path).catch((err: Error) =>
                    console.error("Error deleting temporary file:", err)
                );
            } catch (error) {
                console.error("Error processing banner image:", error);
                // Continue with promo code creation even if image upload fails
            }
        }

        res.status(201).json({
            success: true,
            message: "Promo code created successfully",
            data: newPromoCode,
        });
    } catch (error) {
        console.error("Error creating promo code:", error);
        res.status(500).json({
            success: false,
            message: "Error creating promo code",
        });
    }
};

// Update an promo code
export const updatePromoCode = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            // offerName,
            // category,
            // bannerImage,
            // description,
            // keywords,
            // type,
            // value,
            // claimedCount,
            // status,
            adminId,
            code,
            category,
            description,
            keywords,
            minAmount,
            maxDiscount,
            usageLimit,
            usedCount,
            type,
            value,
            status,
            startDate: start,
            endDate: end,
            limit
        } = req.body;

        const promoCode = await PromoCode.findOne({ where: { codeId: id } });
        if (!promoCode) {
            res.status(404).json({
                success: false,
                message: "Promo code not found",
            });
            return;
        }

        // Update the promo code
        const updatedPromoCode = await promoCode.update({
            adminId,
            code,
            category,
            description,
            keywords,
            minAmount,
            maxDiscount,
            usageLimit,
            usedCount,
            type,
            value,
            status,
            startDate: start,
            endDate: end,
            limit
        });


        res.status(200).json({
            success: true,
            message: "Promo code updated successfully",
            data: updatedPromoCode,
        });
    } catch (error) {
        console.error("Error updating promo code:", error);
        res.status(500).json({
            success: false,
            message: "Error updating promo code",
        });
    }
};


// Delete an promo code
export const deletePromoCode = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const promoCode = await PromoCode.findOne(
            { where: { codeId: id } }
        );

        if (!promoCode) {
            res.status(404).json({
                success: false,
                message: "Promo code not found",
            });
            return;
        }

        await promoCode.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: "Promo code deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting promo code:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting promo code",
        });
    }
};


export const multiDeletePromoCodes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { codeIds } = req.body;

        if (!Array.isArray(codeIds) || codeIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: codeIds must be an array of promo code IDs",
            });
            return;
        }

        const promoCodes = await PromoCode.findAll({
            where: { codeId: codeIds }
        });

        if (promoCodes.length === 0) {
            res.status(404).json({
                success: false,
                message: "No promo codes found with the provided IDs",
            });
            return;
        }

        await Promise.all(promoCodes.map(promoCodes => promoCodes.destroy({ force: true })));

        res.status(200).json({
            success: true,
            message: "Promo codes deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting promo codes:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting promo codes",
        });
    }
};

export const toggleChanges = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Find the promo code by ID
        const promoCode = await PromoCode.findOne({ where: { codeId: id } });
        if (!promoCode) {
            res.status(404).json({
                success: false,
                message: "Promo code not found",
            });
            return;
        }

        // Check for existing active promo code in the same category
        // if (status) {
        //     const today = new Date();
        //     const existingPromoCode = await PromoCode.findOne({
        //         where: {
        //             category: promoCode.category,
        //             status: true,
        //             endDate: { [Op.gte]: today },
        //         },
        //     });

        //     if (existingPromoCode) {
        //         res.status(400).json({
        //             success: false,
        //             message: "An active promo code already exists for this category. Please deactivate it or wait until its end date before creating a new one.",
        //         });
        //         return;
        //     }
        // }

        // Update the promo code status
        await promoCode.update({ status });

        res.status(200).json({
            success: true,
            message: "Promo code status updated successfully",
        });
    } catch (error) {
        console.error("Error updating promo code status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating promo code status",
        });
    }
};

const startPromoCodeExpirationJob = () => {
    schedule.scheduleJob('0 0 * * *', async () => {
        try {
            await PromoCode.update(
                { status: false },
                {
                    where: {
                        endDate: { [Op.lt]: new Date() },
                        status: true
                    }
                }
            );
            logger.info(`Daily promo code expiration completed Date: ${new Date().toLocaleString()} Time: ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            logger.error(`Promo code expiration job error: ${error} Date: ${new Date().toLocaleString()} Time: ${new Date().toLocaleTimeString()}`);
        }
    });
};

// Initialize when the module loads
startPromoCodeExpirationJob();
