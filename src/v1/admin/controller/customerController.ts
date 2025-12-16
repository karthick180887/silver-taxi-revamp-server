import { Request, Response } from "express";
import { Customer } from "../../core/models"; // Import the Customer model
import { Booking } from "../../core/models";
import { CustomerWallet } from "../../core/models/customerWallets";
import { Op, Transaction } from "sequelize";
import { generateReferralCode } from "../../core/function/referCode";
import { sequelize } from "../../../common/db/postgres";


// Create a new customer
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;
        const { name, email, phone, createdBy } = req.body;

        // Validate required fields
        if (!name || !phone) {
            res.status(400).json({
                success: false,
                message: "Name and phone are required",
            });
            return;
        }

        // Check if customer already exists
        let customer = await Customer.findOne({ where: { phone } });
        if (customer) {
            res.status(400).json({
                success: false,
                message: "Customer with this phone number already exists",
                data: customer,
            });
            return;
        }

        // Clean phone number
        let cleanedPhone = phone.replace(/^\+?91|\D/g, '');

        let phoneNumber = cleanedPhone.slice(5, 10);

        // Create new customer
        customer = await Customer.create({
            adminId,
            vendorId: createdBy === "Vendor" ? vendorId : null,
            name,
            email,
            phone: `91 ${cleanedPhone}`,
            createdBy: createdBy == "User" ? "Admin" : createdBy ?? "Admin",
            bookingCount: 0,
            totalAmount: 0,
        });

        // Generate customer ID and referral code
        customer.customerId = `SLTC${phoneNumber}${customer.id}`;
        const { code: referralCode } = generateReferralCode({ userId: customer.id });
        customer.referralCode = referralCode;

        await customer.save();

        // Create customer wallet
        const wallet = await CustomerWallet.create({
            adminId,
            customerId: customer.customerId,
            balance: 0,
            startAmount: 0,
            minusAmount: 0,
            plusAmount: 0,
            totalAmount: 0,
            currency: 'INR',
        });

        // Generate wallet ID
        wallet.walletId = `cus-wlt-${wallet.id}`;
        await wallet.save();

        // Link wallet to customer
        customer.walletId = wallet.walletId;
        await customer.save();

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: {
                ...customer.toJSON(),
                wallet: {
                    walletId: wallet.walletId,
                    balance: wallet.balance,
                    currency: wallet.currency
                }
            },
        });

    } catch (error) {
        console.error("Error creating customer:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// Get all customers
export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        console.log(`[Customers] Fetching all customers for adminId: ${adminId}`);

        if (!adminId) {
            console.log("[Customers] Missing adminId");
        }

        const [customers, totalCustomersCount, newCustomersToday, activeCustomers] = await Promise.all([
            Customer.findAll({
                where: { adminId },
                order: [['createdAt', 'DESC']],
                attributes: { exclude: ['updatedAt', 'deletedAt'] }
            }),
            Customer.count({ where: { adminId } }),
            Customer.count({
                where: {
                    adminId,
                    createdAt: {
                        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                } as any
            }),
            Customer.count({
                where: {
                    adminId,
                    bookingCount: { [Op.gt]: 0 }
                } as any
            })
        ]);

        console.log(`[Customers] Found ${customers.length} records.`);

        res.status(200).json({
            success: true,
            message: "Customers retrieved successfully",
            data: {
                customers: customers,
                stats: {
                    totalCustomers: totalCustomersCount,
                    newCustomersToday: newCustomersToday,
                    activeCustomers: activeCustomers
                },
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalCount: totalCustomersCount,
                    hasNext: false,
                    hasPrev: false,
                    limit: totalCustomersCount
                }
            }
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching customers",
        });
    }
};

export const getVendorCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "vendorId is required in Customers",
            });
            return;
        }

        const customers = await Customer.findAll({
            where: { adminId, vendorId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        res.status(200).json({
            success: true,
            message: "Vendor Customers retrieved successfully",
            data: customers,
        });
    } catch (error) {
        console.error("Error fetching vendor customers:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor customers",
        });
    }
};


export const getBookingsByCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;

        if (!id) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (customerId)",
            });
            return;
        }

        const customer = await Customer.findOne({ where: { customerId: id } });

        if (!customer) {
            res.status(404).json({
                success: false,
                message: "Customer not foUnd",
            });
            return;
        }

        // Fetch bookings only if customer exists
        const bookings = await Booking.findAll({
            where: { phone: { [Op.like]: `%${customer.phone}%` } },
            attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
        });

        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: bookings,
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
        });
    }
};


export const getAdminAndVendorCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { createdBy } = req.body;

        if (!createdBy) {
            res.status(400).json({
                success: false,
                message: "Missing required fields (createdBy)",
            });
            return;
        }

        if (createdBy === "Admin") {
            const adminCustomers = await Customer.findAll({ where: { createdBy } });
            res.status(200).json({
                success: true,
                message: "Admin customers retrieved successfully",
                data: adminCustomers,
            });
            return;
        } else if (createdBy === "Vendor") {
            const vendorCustomers = await Customer.findAll({ where: { createdBy } });
            res.status(200).json({
                success: true,
                message: "Vendor customers retrieved successfully",
                data: vendorCustomers,
            });
            return;
        }

        res.status(400).json({
            success: false,
            message: "Invalid createdBy value",
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching customers",
        });
    }
};

// Get a single customer by ID
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        let whereCondition: any = { customerId: id };

        // Smart Lookup: Check both CustomerID (String) and ID (Integer)
        if (!isNaN(Number(id))) {
            whereCondition = {
                [Op.or]: [
                    { customerId: id },
                    { id: Number(id) }
                ]
            };
        }

        const customer = await Customer.findOne({
            where: whereCondition,
            attributes: { exclude: ['updatedAt', 'deletedAt'] } // Removed 'id' from exclude to ensure frontend gets the PK
        });

        if (!customer) {
            res.status(404).json({
                success: false,
                message: "Customer not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Customer retrieved successfully",
            data: customer,
        });
    } catch (error) {
        console.error("Error fetching customer:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching customer",
        });
    }
};

// Delete a customer
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        let whereCondition: any = { customerId: id };

        // If id is numeric, allow lookup by primary key 'id' as well
        if (!isNaN(Number(id))) {
            whereCondition = {
                [Op.or]: [
                    { customerId: id },
                    { id: Number(id) }
                ]
            };
        }

        const customer = await Customer.findOne({ where: whereCondition });

        if (!customer) {
            res.status(404).json({
                success: false,
                message: "Customer not found",
            });
            return;
        }

        await customer.destroy({ force: true });

        if (customer.walletId) {
            const wallet = await CustomerWallet.findOne({ where: { walletId: customer.walletId } });
            if (wallet) {
                await wallet.destroy({ force: true });
            }
        }


        res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting customer:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting customer",
        });
    }
};

export const multiDeleteCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { customerIds } = req.body;

        if (!Array.isArray(customerIds) || customerIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: customerIds must be an array of customer IDs",
            });
            return;
        }
        await sequelize.transaction(async (t: Transaction) => {
            // 1. Find customers
            const customers = await Customer.findAll({
                where: { customerId: customerIds },
                transaction: t,
            });

            if (customers.length === 0) {
                throw new Error("No customers found with the provided IDs");
            }

            // 2. Find linked wallets
            const wallets = await CustomerWallet.findAll({
                where: { walletId: customers.map((c) => c.walletId) },
                transaction: t,
            });

            // 3. Delete wallets first (to satisfy FK constraints)
            await Promise.all(
                wallets.map((wallet) => wallet.destroy({ force: true, transaction: t }))
            );

            // 4. Delete customers next
            await Promise.all(
                customers.map((customer) => customer.destroy({ force: true, transaction: t }))
            );
        });

        res.status(200).json({
            success: true,
            message: "Customers deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting customers:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting customers",
        });
    }
};
