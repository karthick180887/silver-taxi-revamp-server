import { Request, Response } from "express";
import { Offers } from "../../core/models"; // Import the Offer model
import { Op } from "sequelize";
import schedule from 'node-schedule';
import { logger } from "../../../utils/logger";
import fs from 'fs/promises';
import { uploadFileToDOS3 } from "../../../utils/minio.image";
const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
};

export const getAllOffers = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        // Automatically expire offers that have passed their end date
        await Offers.update(
            { status: false },
            {
                where: {
                    adminId,
                    endDate: { [Op.lt]: new Date() },
                    status: true
                }
            }
        );

        // Retrieve all active offers
        const offers = await Offers.findAll({
            where: { adminId },
            attributes: { exclude: ['id', 'deletedAt'] },
            order: [['createdAt', 'DESC']] // Optional: sort by creation date
        });

        res.status(200).json({
            success: true,
            message: "Offers retrieved successfully",
            data: offers,
        });
    } catch (error) {
        console.error("Error fetching offers:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching offers",
        });
    }
};

// Get offer by ID
export const getOfferById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const offer = await Offers.findOne(
            {
                where: { id },
                attributes: { exclude: ['id', 'deletedAt'] }
            });


        if (!offer) {
            res.status(404).json({
                success: false,
                message: "Offer not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Offer retrieved successfully",
            data: offer,
        });
    } catch (error) {
        console.error("Error fetching offer:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching offer",
        });
    }
};

// Create a new offer
export const createOffer = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const bannerImage = req.file;
        const {
            offerName,
            category,
            title,
            description,
            keywords,
            type,
            value,
            status = true, // Default to true
            startDate,
            endDate,
            limit
        } = req.body;

        if (!offerName || !category || !type) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (offerName, category, type)",
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
        const validateOffer = () => {
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

        const validationResult = validateOffer();
        if (!validationResult.success) {
            res.status(400).json(validationResult);
            return;
        }

        // Check for active offers only if creating an active offer
        if (status) {
            const today = new Date();
            const existingOffer = await Offers.findOne({
                where: {
                    category,
                    status: true,
                    endDate: { [Op.gte]: today },
                },
            });
            if (existingOffer) {
                res.status(400).json({
                    success: false,
                    message: "An active offer already exists for this category. Please deactivate it or wait until its end date before creating a new one.",
                });
                return;
            }
        }

        // Create the new offer
        const newOffer = await Offers.create({
            adminId,
            offerName,
            title: title || "",
            category,
            description,
            keywords,
            type,
            value,
            status,
            startDate: start,
            endDate: end,
            usedCount: 0,
            limit: limit || 1,
        });

        newOffer.offerId = `offer-${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}-${newOffer.id}`;
        await newOffer.save();

        if (bannerImage) {
            try {
                // Read the file from the temporary path
                const imageBuffer = await fs.readFile(bannerImage.path);

                // Upload to MinIO
                const imageUrl = await uploadFileToDOS3(imageBuffer, `offer/${newOffer.offerId}.webp`);

                // Update offer with image URL
                newOffer.bannerImage = imageUrl ?? '';
                await newOffer.save();

                // Clean up: Delete the temporary file
                await fs.unlink(bannerImage.path).catch((err: Error) =>
                    console.error("Error deleting temporary file:", err)
                );
            } catch (error) {
                console.error("Error processing banner image:", error);
                // Continue with offer creation even if image upload fails
            }
        }

        res.status(201).json({
            success: true,
            message: "Offer created successfully",
            data: newOffer,
        });
    } catch (error) {
        console.error("Error creating offer:", error);
        res.status(500).json({
            success: false,
            message: "Error creating offer",
        });
    }
};

// Update an offer
export const updateOffer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            offerName,
            category,
            title,
            bannerImage,
            description,
            keywords,
            type,
            value,
            usedCount,
            status,
            limit
        } = req.body;

        const offer = await Offers.findOne({ where: { offerId: id } });
        if (!offer) {
            res.status(404).json({
                success: false,
                message: "Offer not found",
            });
            return;
        }

        // Update the offer
        const updatedOffer = await offer.update({
            offerName,
            category,
            title: title || "",
            bannerImage,
            description,
            keywords,
            type,
            value,
            usedCount,
            status,
            limit
        });


        res.status(200).json({
            success: true,
            message: "Offer updated successfully",
            data: updatedOffer,
        });
    } catch (error) {
        console.error("Error updating offer:", error);
        res.status(500).json({
            success: false,
            message: "Error updating offer",
        });
    }
};


// Delete an offer
export const deleteOffer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const offer = await Offers.findOne(
            { where: { offerId: id } }
        );

        if (!offer) {
            res.status(404).json({
                success: false,
                message: "Offer not found",
            });
            return;
        }

        await offer.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: "Offer deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting offer:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting offer",
        });
    }
};


export const multiDeleteOffers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { offerIds } = req.body;

        if (!Array.isArray(offerIds) || offerIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: offerIds must be an array of offer IDs",
            });
            return;
        }

        const offers = await Offers.findAll({
            where: { offerId: offerIds }
        });

        if (offers.length === 0) {
            res.status(404).json({
                success: false,
                message: "No offers found with the provided IDs",
            });
            return;
        }

        await Promise.all(offers.map(offer => offer.destroy({ force: true })));

        res.status(200).json({
            success: true,
            message: "Offers deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting ipTrackings:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting offers",
        });
    }
};

export const toggleChanges = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Find the offer by ID
        const offer = await Offers.findOne({ where: { offerId: id } });
        if (!offer) {
            res.status(404).json({
                success: false,
                message: "Offer not found",
            });
            return;
        }

        // Check for existing active offer in the same category
        if (status) {
            const today = new Date();
            const existingOffer = await Offers.findOne({
                where: {
                    category: offer.category,
                    status: true,
                    endDate: { [Op.gte]: today },
                },
            });

            if (existingOffer) {
                res.status(400).json({
                    success: false,
                    message: "An active offer already exists for this category. Please deactivate it or wait until its end date before creating a new one.",
                });
                return;
            }
        }

        // Update the offer status
        await offer.update({ status });

        res.status(200).json({
            success: true,
            message: "Offer status updated successfully",
        });
    } catch (error) {
        console.error("Error updating offer status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating offer status",
        });
    }
};

const startOfferExpirationJob = () => {
    schedule.scheduleJob('0 0 * * *', async () => {
        try {
            await Offers.update(
                { status: false },
                {
                    where: {
                        endDate: { [Op.lt]: new Date() },
                        status: true
                    }
                }
            );
            logger.info(`Daily offer expiration completed Date: ${new Date().toLocaleString()} Time: ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            logger.error(`Offer expiration job error: ${error} Date: ${new Date().toLocaleString()} Time: ${new Date().toLocaleTimeString()}`);
        }
    });
};

// Initialize when the module loads
startOfferExpirationJob();
