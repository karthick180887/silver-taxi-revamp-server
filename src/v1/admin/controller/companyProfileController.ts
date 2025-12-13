import { Request, Response } from "express";
import { CompanyProfile } from "../../core/models"; // Ensure the import path is correct
import { uploadFileToMiniIOS3 } from "../../../utils/minio.image";
import fs from "fs/promises";

// Get all company profiles
export const getAllCompanyProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const companyProfiles = await CompanyProfile.findAll({
            where: { adminId, createdBy: "Admin" },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        res.status(200).json({
            success: true,
            message: "Company profiles retrieved successfully",
            data: companyProfiles,
        });
    } catch (error) {
        console.error("Error fetching company profiles:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching company profiles",
        });
    }
};
export const getVendorCompanyProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "vendorId is required in Company Profile",
            });
            return;
        }

        const companyProfiles = await CompanyProfile.findAll({
            where: { adminId, createdBy: "Vendor", vendorId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt', 'driverWalletAmount', 'vendorWalletAmount'] }
        });

        res.status(200).json({
            success: true,
            message: "Vendor Company profiles retrieved successfully",
            data: companyProfiles,
        });
    } catch (error) {
        console.error("Error fetching vendor company profiles:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor company profiles",
        });
    }
};

// Get a single company profile by ID
export const getCompanyProfileById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const companyProfile = await CompanyProfile.findOne({
            where: { companyId: id, },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        if (!companyProfile) {
            res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Company profile retrieved successfully",
            data: companyProfile,
        });
    } catch (error) {
        console.error("Error fetching company profile:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching company profile",
        });
    }
};

// Create a new company profile
export const createCompanyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;
        const {
            logo,
            name, email, phone, address, GSTNumber,
            UPI, website, description, whatsappNumber,
            driverWalletAmount, vendorWalletAmount,
            socialLinks, createdBy, customerReferral,
             vendorReferral, driverReferral,
             companyCommission,
             companyCommissionPercentage,
             convenienceFee
        } = req.body;

        console.log("req.body----->", req.body);

        if (!name || !phone || !email) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (name, phone, email)",
            });
            return;
        }


        const newProfile = await CompanyProfile.create({
            adminId,
            vendorId: createdBy === "Vendor" ? vendorId : null,
            name,
            logo,
            email,
            phone,
            whatsappNumber,
            address,
            GSTNumber,
            UPI,
            website,
            description,
            socialLinks,
            driverWalletAmount: createdBy === 'Admin' ? driverWalletAmount : null,
            vendorWalletAmount: createdBy === 'Admin' ? vendorWalletAmount : null,
            customerReferral: createdBy === 'Admin' ? customerReferral : undefined,
            vendorReferral: createdBy === 'Admin' ? vendorReferral : undefined,
            driverReferral: createdBy === 'Admin' ? driverReferral : undefined,
            companyCommission: createdBy === 'Admin' ? companyCommission : undefined,
            companyCommissionPercentage: createdBy === 'Admin' ? companyCommissionPercentage : undefined,
            createdBy: createdBy ?? 'Admin',
            convenienceFee: convenienceFee
        });

        newProfile.companyId = `cmp-${newProfile.id}`;
        await newProfile.save();

        res.status(201).json({
            success: true,
            message: `${createdBy === 'Vendor' ? 'Vendor' : 'Admin'} profile created successfully`,
            data: newProfile,
        });
    } catch (error) {
        console.error("Error creating company profile:", error);
        res.status(500).json({
            success: false,
            message: "Error creating company profile",
        });
    }
};
// Update an existing company profile
export const updateCompanyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            logo, name, email,
            phone, address, GSTNumber,
            UPI, website, description,
            socialLinks, whatsappNumber,
            driverWalletAmount, vendorWalletAmount,
            customerReferral, vendorReferral, driverReferral,
            companyCommission,
            companyCommissionPercentage,
            convenienceFee
        } = req.body;

        const companyProfile = await CompanyProfile.findOne({
            where: { companyId: id }
        });

        if (!companyProfile) {
            res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
            return;
        }

        const updatedProfile = await companyProfile.update({
            logo,
            name,
            email,
            phone,
            whatsappNumber,
            address,
            GSTNumber,
            UPI,
            website,
            description,
            socialLinks,
            driverWalletAmount,
            vendorWalletAmount,
            customerReferral,
            vendorReferral,
            driverReferral,
            companyCommission,
            companyCommissionPercentage,
            convenienceFee
        });

        res.status(200).json({
            success: true,
            message: "Company profile updated successfully",
            data: updatedProfile,
        });
    } catch (error) {
        console.error("Error updating company profile:", error);
        res.status(500).json({
            success: false,
            message: "Error updating company profile",
        });
    }
};

// Delete a company profile
export const deleteCompanyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const companyProfile = await CompanyProfile.findOne({
            where: { companyId: id }
        });

        if (!companyProfile) {
            res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
            return;
        }

        await companyProfile.destroy({force: true});

        res.status(200).json({
            success: true,
            message: "Company profile deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting company profile:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting company profile",
        });
    }
};


export const multiDeleteCompanyProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const { companyIds } = req.body;

        if (!Array.isArray(companyIds) || companyIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: companyIds must be an array of company IDs",
            });
            return;
        }

        const companyProfiles = await CompanyProfile.findAll({
            where: {
                companyId: companyIds,
                createdBy: "Vendor"
            }
        });

        if (companyProfiles.length === 0) {
            res.status(404).json({
                success: false,
                message: "No company profiles found with the provided IDs",
            });
            return;
        }

        await Promise.all(companyProfiles.map(companyProfile => companyProfile.destroy()));

        res.status(200).json({
            success: true,
            message: "Company profiles deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting company profiles:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting company profiles",
        });
    }
};


export const uploadCompanyProfileImage = async (req: Request, res: Response): Promise<void> => {

    console.log("Image------->", req.file);
    try {
        const image = req.file;

        if (!image) {
            res.status(400).json({
                success: false,
                message: "Missing required fields image",
            });
            return;
        }
        console.log("image----->", image); 

        const { nanoid } = await import("nanoid")
        const companyId = nanoid(10);
        const imageBuffer = await fs.readFile(image.path);
        const imageUrl = await uploadFileToMiniIOS3(imageBuffer, `company/${companyId}.webp`);
        await fs.unlink(image.path).catch((err: Error) =>
            console.error("Error deleting temporary file:", err)
        );

        res.status(200).json({
            success: true,
            message: "Company profile image uploaded successfully",
            data: imageUrl,
        });


    } catch (error) {
        console.error("Error uploading company profile image:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading company profile image",
        });
    }
};