import { Response, Request } from "express";
import {
    Admin, DriverWallet,
    WalletTransaction,
    DriverWalletRequest
} from "../../../core/models/index";
import { Driver } from "../../../core/models/index";
import { createRazorpayOrder } from "../../../../common/services/payments/razorpayService";
import { walletAmountAdd, walletWithdrawRequestSchema } from "../../../../common/validations/globalSchema";
import { generateCustomTransactionId } from "../../../core/function/commissionCalculation";

export const getWallet = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        const wallet = await DriverWallet.findOne({
            where: { driverId, adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
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
            message: "Wallet fetched successfully",
            data: wallet,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching wallet",
            error: error,
        });
    }
};

export const getWalletTransactions = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        const transactions = await WalletTransaction.findAll({
            where: { driverId, adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt', "vendorId"] },
            order: [['createdAt', 'DESC']]
        });

        if (!transactions || transactions.length === 0) {
            res.status(200).json({
                success: false,
                message: "No transactions found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Transactions fetched successfully",
            data: transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching transactions",
            error: error,
        });
    }
}

export const addWalletAmount = async (req: Request, res: Response) => {
    const tenantId = req.body.tenantId ?? req.query.tenantId;
    const driverId = req.body.driverId ?? req.query.driverId;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }
    try {
        const driver = await Driver.findOne({
            where: { driverId }
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        const validData = walletAmountAdd.safeParse(req.body);

        if (!validData.success) {
            const formattedErrors = validData.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: formattedErrors,
            });
            return;
        }

        const { amount, remark } = validData.data;

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

        const { customAlphabet } = await import('nanoid');

        const now = new Date().toISOString().replace(/[-:.TZ]/g, '');
        const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
        const customId = `Txn-${nanoid()}_${now}`;

        const tenant = await Admin.findOne({
            where: { adminId: driver.adminId }
        });

        const driverName = `${driver.name} ${driver.phone}`;
        const adminName = tenant?.name ?? "Silver Taxi";

        const order = await createRazorpayOrder({
            amount: amount,
            receipt: `${customId}`,
            notes: {
                type: "Wallet",
                driverId: driver.driverId,
                walletId: wallet.walletId,
            },
        });

        console.log("Order created: >> ", order);

        const fareBreakup = {
            previousWalletBalance: wallet.balance,
            amount: amount,
            prefix: "+",
            postWalletBalance: wallet.balance + amount,
        }

        const transaction = await WalletTransaction.create({
            adminId: driver.adminId,
            transactionId: customId,
            initiatedBy: adminName,
            initiatedTo: driverName,
            amount,
            type: "Credit",
            date: new Date(),
            description: "Wallet amount added",
            driverId: driver.driverId,
            ownedBy: "Driver",
            walletId: wallet.walletId,
            remark: remark ?? null,
            tnxOrderId: order.id,
            tnxPaymentStatus: "Pending",
            fareBreakdown: fareBreakup,
        });

        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Wallet Payment Initiated. Awaiting online payment.',
            order: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency
            },
        });
        return;

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error adding wallet amount",
            error: error,
        });
        return;
    }
}

export const walletRequest = async (req: Request, res: Response) => {
    const driverId = req.body.driverId ?? req.query.driverId;
    const { type } = req.params;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        // Find the driver
        const driver = await Driver.findOne({
            where: { driverId }
        });

        if (!driver) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        // Find the driver's wallet
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

        const validData = walletWithdrawRequestSchema.safeParse(req.body);

        if (!validData.success) {
            const formattedErrors = validData.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: formattedErrors,
            });
            return;
        }

        const { amount, reason, tnxPaymentId, paymentMethod } = validData.data;

        if (type === "add") {
            const existingPendingRequest = await DriverWalletRequest.findOne({
                where: {
                    driverId,
                    type: type,
                    status: "pending"
                }
            });

            if (existingPendingRequest) {
                res.status(400).json({
                    success: false,
                    message: "You already have a pending withdrawal request. Please wait for it to be processed.",
                    data: {
                        existingTransactionId: existingPendingRequest.requestId,
                        existingAmount: existingPendingRequest.amount
                    }
                });
                return;
            }

            // Generate unique transaction ID
            const requestId = await generateCustomTransactionId({ length: 4, prefix: "WAR" });

            // Create withdrawal transaction record
            const transaction = await DriverWalletRequest.create({
                adminId: driver.adminId,
                requestId: requestId,
                name: driver.name,
                phone: driver.phone,
                amount: amount,
                type: "add",
                description: "Wallet amount added",
                driverId: driver.driverId,
                walletId: wallet.walletId,
                reason: reason || "Wallet amount added",
                status: "pending",
                tnxPaymentId: tnxPaymentId || null,
                paymentMethod: paymentMethod || "UPI",
            });
            await transaction.save();

            res.status(200).json({
                success: true,
                message: 'Wallet amount added request submitted successfully',
                data: {
                    requestId: transaction.requestId,
                    amount: transaction.amount,
                    status: transaction.status,
                    createdAt: transaction.createdAt
                }
            });

        } else if (type === "withdraw") {
            // Check if wallet has sufficient balance
            if (wallet.balance < amount) {
                res.status(400).json({
                    success: false,
                    message: "Insufficient wallet balance",
                    data: {
                        requestedAmount: amount,
                        availableBalance: wallet.balance
                    }
                });
                return;
            }

            // Check if there's already a pending withdrawal transaction
            const existingPendingRequest = await DriverWalletRequest.findOne({
                where: {
                    driverId,
                    type: type,
                    status: "pending"
                }
            });

            if (existingPendingRequest) {
                res.status(400).json({
                    success: false,
                    message: "You already have a pending withdrawal request. Please wait for it to be processed.",
                    data: {
                        existingTransactionId: existingPendingRequest.requestId,
                        existingAmount: existingPendingRequest.amount
                    }
                });
                return;
            }

            // Generate unique transaction ID
            const requestId = await generateCustomTransactionId({ length: 4, prefix: "WDR" });

            // Create withdrawal transaction record
            const transaction = await DriverWalletRequest.create({
                adminId: driver.adminId,
                requestId: requestId,
                name: driver.name,
                phone: driver.phone,
                amount: amount,
                type: "withdraw",
                description: "Withdrawal request initiated",
                driverId: driver.driverId,
                walletId: wallet.walletId,
                reason: reason || "Withdrawal request",
                status: "pending"
            });
            await transaction.save();

            res.status(200).json({
                success: true,
                message: 'Withdrawal request submitted successfully',
                data: {
                    requestId: transaction.requestId,
                    amount: transaction.amount,
                    status: transaction.status,
                    createdAt: transaction.createdAt
                }
            });
            return;
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid request type",
            });
            return;
        }

    } catch (error) {
        console.error("Error creating withdrawal request:", error);
        res.status(500).json({
            success: false,
            message: "Error creating withdrawal request",
            error: error,
        });
        return;
    }
}

export const getWalletRequests = async (req: Request, res: Response) => {
    const driverId = req.body.driverId ?? req.query.driverId;
    const type = req.query.type as "add" | "withdraw" | undefined;

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {

        let withdrawRequests: DriverWalletRequest[] = [];

        if (!type) {
            withdrawRequests = await DriverWalletRequest.findAll({
                where: {
                    driverId,
                },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt', "vendorId"] },
                order: [['createdAt', 'DESC']]
            });
        } else {
            withdrawRequests = await DriverWalletRequest.findAll({
                where: {
                    driverId,
                    type: type,
                },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt', "vendorId"] },
                order: [['createdAt', 'DESC']]
            });
        }

        if (!withdrawRequests || withdrawRequests.length === 0) {
            res.status(200).json({
                success: false,
                message: "No withdrawal requests found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Withdrawal requests fetched successfully",
            data: withdrawRequests,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching withdrawal requests",
            error: error,
        });
    }
}