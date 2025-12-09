import { Request, Response } from "express";
import { Vendor } from "../../core/models/vendor"; // Import the Vendor model
import { VendorWallet } from "../../core/models/vendorWallets";
import { WalletTransaction } from "../../core/models/walletTransaction";
import { Admin } from "../../core/models/admin";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import { VendorBankDetails } from "../../core/models/vendorBankDetails";
import { QueryParams } from "common/types/global.types";

// Get all vendors
export const getAllVendors = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            page = 1,
            limit = 25,
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        }: QueryParams = req.query;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Vendor",
            });
            return;
        }

        const offset = (page - 1) * limit;

        const whereClause: any = { adminId };

        const searchConditions: any[] = [];

        if (search) {
            searchConditions.push(
                { vendorId: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
            );
            if (search === 'active' || search === 'inactive') {
                searchConditions.push({ isLogin: search === 'active' ? true : false });
            }
        }

        if (searchConditions.length > 0) {
            whereClause[Op.or] = searchConditions;
        }

        const [criticalResults, countResults] = await Promise.all([
            Promise.all([
                Vendor.findAll({
                    where: whereClause,
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    include: [
                        {
                            model: VendorWallet,
                            as: 'wallet',
                            attributes: { exclude: ['id', 'updatedAt', 'deletedAt', 'driverId'] }
                        },
                    ],
                    order: [[sortBy, sortOrder]],
                    limit: parseInt(limit as any),
                    offset: offset
                }),
                Vendor.count({ where: whereClause })
            ]),
            Promise.allSettled([
                Vendor.count({ where: { ...whereClause, isLogin: true } }),
                Vendor.count({ where: { ...whereClause, isLogin: false } }),
                Vendor.count({ where: whereClause })
            ])
        ]);

        const [vendors, count] = criticalResults;

        const vendorsCount = {
            active: countResults[0].status === 'fulfilled' ? countResults[0]?.value : 0,
            inactive: countResults[1].status === 'fulfilled' ? countResults[1].value : 0,
            total: countResults[2].status === 'fulfilled' ? countResults[2].value : 0,
        }

        const totalPages = Math.ceil(count / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        res.status(200).json({
            success: true,
            message: "Vendors retrieved successfully",
            data: {
                vendors,
                vendorsCount,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Number(totalPages),
                    totalCount: count,
                    hasNext,
                    hasPrev,
                    limit: Number(limit)
                }
            },
        });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendors",
        });
    }
};

// Get a single vendor by ID
export const getVendorById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findOne({
            where: { vendorId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [
                {
                    model: VendorWallet,
                    as: 'wallet',
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt', 'driverId'] }
                },
            ]
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Vendor retrieved successfully",
            data: vendor,
        });
    } catch (error) {
        console.error("Error fetching vendor:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor",
        });
    }
};

export const getVendorUPI = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { id } = req.params;

    try {
        const vendor = await VendorBankDetails.findOne({
            where: {
                adminId,
                vendorId: id,
                isPrimary: true,
                isActive: true
            }
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Vendor retrieved successfully",
            data: vendor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
        return;
    }
};



export const getVendorWalletTransByVendor = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const vendorId = req.body.vendorId ?? req.query.id;

    try {
        const walletTrans = await WalletTransaction.findAll({
            where: {
                adminId,
                vendorId: vendorId,
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

export const getVendorWalletTrans = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { id } = req.params;
    try {
        const walletTrans = await WalletTransaction.findAll({
            where: {
                adminId,
                vendorId: id,
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

export const walletTransactionStatusUpdate = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const { id } = req.params;
    const { reason } = req.body;
    try {

        console.log("id and reason >> ", id, reason);
        const walletTrans = await WalletTransaction.findOne({
            where: {
                adminId,
                transactionId: id
            },
        });

        if (!walletTrans) {
            res.status(404).json({
                success: false,
                message: "Wallet transaction not found",
            });
            return;
        }

        walletTrans.status = "Paid";
        walletTrans.reason = reason;
        await walletTrans.save();

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


export const getAllVendorWalletTrans = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;

    try {
        const walletTrans = await WalletTransaction.findAll({
            where: {
                adminId,
                driverId: {
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

// Create a new vendor
export const createVendor = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            name,
            email,
            phone,
            password,
            remark,
            walletAmount,
            isLogin,
            website
        } = req.body;

        console.log("isLogin-->", isLogin)

        if (!name || !phone || !password) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (name, phone, password)",
            });
            return;
        }


        const existingVender = await Vendor.findOne({
            where: { phone }
        })

        if (existingVender) {
            res.status(409).json({
                success: false,
                message: "Vendor already exists",
            })
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newVendor = await Vendor.create({
            adminId,
            name,
            email: email || hashedPassword.slice(0, 10),
            phone,
            password: hashedPassword,
            remark,
            isLogin: true, // Default value
            website
        });



        newVendor.vendorId = `SLTV${phone.slice(5, 10)}${newVendor.id}`;; // Assign a unique vendorId
        await newVendor.save();

        // Create a wallet for the new vendor
        const wallet = await VendorWallet.create({
            adminId: newVendor.adminId,
            vendorId: newVendor.vendorId,
            balance: walletAmount || 0,
            startAmount: walletAmount || 0,
        });

        wallet.walletId = `wlt-${wallet.id}`; // Assign a unique walletId
        await wallet.save();

        newVendor.walletId = wallet.walletId; // Link wallet to vendor
        await newVendor.save();

        res.status(201).json({
            success: true,
            message: "Vendor created successfully",
            data: newVendor,
        });
    } catch (error) {
        console.error("Error creating vendor:", error);
        res.status(500).json({
            success: false,
            message: "Error creating vendor",
        });
    }
};

// Update an existing vendor
export const updateVendor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            phone,
            password: newPassword,
            remark,
            isLogin,
            website
        } = req.body;

        const vendor = await Vendor.findOne({
            where: { vendorId: id }
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedVendor = await vendor.update({
            name,
            email,
            phone,
            password: newPassword ? hashedPassword : vendor.password,
            remark,
            isLogin,
            website
        });

        res.status(200).json({
            success: true,
            message: "Vendor updated successfully",
            data: updatedVendor,
        });
    } catch (error) {
        console.error("Error updating vendor:", error);
        res.status(500).json({
            success: false,
            message: "Error updating vendor",
        });
    }
};

// Toggle vendor status
export const toggleVendorStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        console.log("isLogin-->", req.body)

        const vendor = await Vendor.findOne({
            where: { vendorId: id }
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        if (status === false) {
            if (!reason || reason.trim() === "") {
                res.status(400).json({
                    success: false,
                    message: "Reason is required when blocking a vendor",
                });
                return;
            }
        }

        vendor.isLogin = status;
        vendor.reason = reason || null;
        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Vendor status updated successfully",
        });
    } catch (error) {
        console.error("Error toggling vendor status:", error);
        res.status(500).json({
            success: false,
            message: "Error toggling vendor status",
        });
    }
};


// Delete a vendor
export const deleteVendor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const vendor = await Vendor.findOne({
            where: { vendorId: id }
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        const wallet = await VendorWallet.findOne({
            where: { walletId: vendor.walletId }
        });

        const vendorBank = await VendorBankDetails.findOne({
            where: { vendorId: vendor.vendorId }
        });

        if (vendorBank) {
            await vendorBank.destroy({ force: true });
        }

        if (wallet) {
            await wallet.destroy({ force: true });
        }

        await vendor.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: "Vendor deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting vendor:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting vendor",
        });
    }
};


// Get vendor wallet amount
export const getVendorWalletAmount = async (req: Request, res: Response): Promise<void> => {
    try {
        const vendorId = req.body.vendorId ?? req.query.id;

        // console.log("vendorId ---> ", vendorId);

        const vendor = await Vendor.findOne({
            where: { vendorId: vendorId },
            include: [
                {
                    model: VendorWallet,
                    as: 'wallet',
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                }
            ]
        });

        // console.log("vendor ---> ", vendor);

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        const walletAmount = (vendor as any).wallet?.balance ?? 0;

        res.status(200).json({
            success: true,
            message: "Vendor wallet amount retrieved successfully",
            data: {
                walletAmount,
                totalEarnings: vendor.totalEarnings,
            },
        });
    } catch (error) {
        console.error("Error fetching vendor wallet amount:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor wallet amount",
        });
    }
}



// Get vendor wallet
export const getVendorWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findOne({
            where: { vendorId: id }
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        const wallet = await VendorWallet.findOne({
            where: { walletId: vendor.walletId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
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
            message: "Vendor wallet retrieved successfully",
            data: wallet,
        });
    } catch (error) {
        console.error("Error fetching vendor wallet:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor wallet",
        });
    }
};

// Add wallet amount to vendor
export const addVendorWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, remark } = req.body;

        if (!remark) {
            res.status(400).json({
                success: false,
                message: "Remark is required",
            });
            return;
        }

        const vendor = await Vendor.findOne({
            where: { vendorId: id }
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        const wallet = await VendorWallet.findOne({
            where: { walletId: vendor.walletId }
        });


        if (!wallet) {
            res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
            return;
        }

        wallet.balance += amount;
        wallet.plusAmount += amount;
        wallet.totalAmount = String(Number(wallet.totalAmount) + Number(amount));
        await wallet.save();

        const { customAlphabet } = await import('nanoid');

        const now = new Date().toISOString().replace(/[-:.TZ]/g, '');
        const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
        const customId = `Txn-${nanoid()}_${now}`;

        const admin = await Admin.findOne({
            where: { adminId: vendor.adminId }
        });
        const vendorName = `${vendor.name} ${vendor.phone}`;
        const adminName = admin?.name ?? "Silver Taxi";


        const transaction = await WalletTransaction.create({
            adminId: vendor.adminId,
            transactionId: customId,
            initiatedBy: adminName,
            initiatedTo: vendorName,
            amount,
            type: "Credit",
            date: new Date(),
            description: "Wallet amount added",
            vendorId: vendor.vendorId,
            remark: remark ?? null,
            ownedBy: "Vendor",
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: "Wallet amount added successfully",
            data: wallet,
        });
    } catch (error) {
        console.error("Error adding wallet amount:", error);
        res.status(500).json({
            success: false,
            message: "Error adding wallet amount",
        });
    }
};

// Minus wallet amount from vendor
export const minusVendorWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, remark } = req.body;

        if (!remark) {
            res.status(400).json({
                success: false,
                message: "Remark is required",
            });
            return;
        }

        const vendor = await Vendor.findOne({
            where: { vendorId: id }
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
            return;
        }

        const wallet = await VendorWallet.findOne({
            where: { walletId: vendor.walletId }
        });


        if (!wallet) {
            res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
            return;
        }

        wallet.balance -= amount;
        wallet.minusAmount += amount;
        wallet.totalAmount = String(Number(wallet.totalAmount) - Number(amount));
        await wallet.save();

        const { customAlphabet } = await import('nanoid');

        const now = new Date().toISOString().replace(/[-:.TZ]/g, '');
        const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
        const customId = `Txn-${nanoid()}_${now}`;

        const admin = await Admin.findOne({
            where: { adminId: vendor.adminId }
        });
        const vendorName = vendor.name;
        const adminName = admin?.name ?? "Silver Taxi";


        const transaction = await WalletTransaction.create({
            adminId: vendor.adminId,
            transactionId: customId,
            initiatedBy: adminName,
            initiatedTo: vendorName,
            amount,
            type: "Debit",
            date: new Date(),
            description: "Wallet amount subtracted",
            vendorId: vendor.vendorId,
            remark: remark ?? null,
            ownedBy: "Vendor",
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: "Wallet amount subtracted successfully",
            data: wallet,
        });
    } catch (error) {
        console.error("Error subtracting wallet amount:", error);
        res.status(500).json({
            success: false,
            message: "Error subtracting wallet amount",
        });
    }
};

export const multiDeleteVendors = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vendorIds } = req.body;

        if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: vendorIds must be an array of vendor IDs",
            });
            return;
        }

        const vendors = await Vendor.findAll({
            where: { vendorId: vendorIds }
        });

        if (vendors.length === 0) {
            res.status(404).json({
                success: false,
                message: "No vendors found with the provided IDs",
            });
            return;
        }

        const wallets = await VendorWallet.findAll({
            where: { walletId: vendors.map(vendor => vendor.walletId) }
        });

        if (wallets.length > 0) {
            await Promise.all(wallets.map(wallet => wallet.destroy({ force: true })));
        }

        await Promise.all(vendors.map(vendor => vendor.destroy({ force: true })));

        res.status(200).json({
            success: true,
            message: "Vendors deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting vendors:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting vendors",
        });
    }
};
