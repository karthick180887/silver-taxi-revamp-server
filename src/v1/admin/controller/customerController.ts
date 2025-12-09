import { Request, Response } from "express";
import { Customer } from "../../core/models"; // Import the Customer model
import { Booking } from "../../core/models";
import { CustomerWallet } from "../../core/models/customerWallets";
import { Op, Transaction } from "sequelize";
import { generateReferralCode } from "../../core/function/referCode";
import { sequelize } from "../../../common/db/postgres";
import { QueryParams } from "common/types/global.types";


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
        const {
            page = 1,
            limit = 25,
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        }: QueryParams = req.query;

        const offset = (page - 1) * limit;

        const whereClause: any = { adminId };

        const searchConditions: any[] = [];

        if (search) {
            searchConditions.push(
                { name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { customerId: { [Op.iLike]: `%${search}%` } },
            );
        }

        if (searchConditions.length > 0) {
            whereClause[Op.or] = searchConditions;
        }

        const [criticalResults, countResults] = await Promise.all([
            Promise.all([
                Customer.findAll({
                    where: whereClause,
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    order: [[sortBy, sortOrder]],
                    limit: parseInt(limit as any),
                    offset: offset
                }),
                Customer.count({ where: whereClause })
            ]),
            Promise.allSettled([
                Customer.sum('bookingCount', { where: whereClause }),
                Customer.sum('totalAmount', { where: whereClause }),
            ])
        ]);

        const [customers, count] = criticalResults;

        const customersCount = {
            totalTripCompleted: countResults[0].status === 'fulfilled' ? countResults[0].value : 0,
            totalAmount: countResults[1].status === 'fulfilled' ? countResults[1].value : 0,
        }

        const totalPages = Math.ceil(count / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        res.status(200).json({
            success: true,
            message: "Customers retrieved successfully",
            data: {
                customers,
                customersCount,
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
        const {
            page = 1,
            limit = 25,
            search = '',
            status = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        }: QueryParams = req.query;

        const offset = (page - 1) * limit;
        const whereClause: any = { adminId };

        const searchConditions: any[] = [];

        if (search) {
            searchConditions.push(
                { bookingId: { [Op.iLike]: `%${search}%` } },
                { bookingNo: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
                { customerId: { [Op.iLike]: `%${search}%` } },
                { driverId: { [Op.iLike]: `%${search}%` } },
                { vendorId: { [Op.iLike]: `%${search}%` } },
                { enquiryId: { [Op.iLike]: `%${search}%` } },
                { serviceId: { [Op.iLike]: `%${search}%` } },
                { vehicleId: { [Op.iLike]: `%${search}%` } },
                { pickup: { [Op.iLike]: `%${search}%` } },
                { drop: { [Op.iLike]: `%${search}%` } },
                // Numeric fields - convert to number if search is numeric
                ...(isNaN(Number(search)) ? [] : [
                    { distance: Number(search) },
                    { estimatedAmount: Number(search) },
                    { finalAmount: Number(search) }
                ])
            );
        }

        if (searchConditions.length > 0) {
            whereClause[Op.or] = searchConditions;
        }

        const order: any[] = [];
        order.push([sortBy, sortOrder]);

        if (status) {
            whereClause.status = status;
        }

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
            where: whereClause,
            attributes: { exclude: ["id", "updatedAt", "deletedAt"] },
            order: [[sortBy, sortOrder]],
            limit: Number(limit),
            offset: offset
        });

        const totalCount = await Booking.count({ where: whereClause });

        const totalAmount = await Booking.sum('tripCompletedFinalAmount', { where: whereClause });

        const totalPages = Math.ceil(totalCount / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;


        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: {
                bookings,
                bookingCount: {
                    totalTrip: totalCount,
                    totalAmount: totalAmount,
                },
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalCount: totalCount,
                    hasNext,
                    hasPrev,
                    limit: Number(limit)
                }
            },
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
        const customer = await Customer.findOne({
            where: { customerId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
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

        const customer = await Customer.findOne({ where: { customerId: id } });

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
                console.error("No customers found for deletion");
                res.status(404).json({
                    success: false,
                    message: "No customers found for deletion",
                });
                return;
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
