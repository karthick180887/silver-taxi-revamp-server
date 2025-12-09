import { Response, Request } from "express";
import { Admin, DriverWallet, WalletTransaction } from "../../../core/models/index";
import { Driver } from "../../../core/models/index";
import { createRazorpayOrder } from "../../../../common/services/payments/razorpayService";
import { walletAmountAdd } from "../../../../common/validations/globalSchema";
import { CustomerWallet } from "../../../core/models/customerWallets";
import { CustomerTransaction } from "../../../core/models/customerTransactions";

export const getWallet = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const customerId = req.body.customerId ?? req.query.customerId;

    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Customer id is required",
        });
        return;
    }

    try {
        const wallet = await CustomerWallet.findOne({
            where: { customerId, adminId },
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
    const customerId = req.body.customerId ?? req.query.customerId;

    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Customer id is required",
        });
        return;
    }

    try {
        const transactions = await CustomerTransaction.findAll({
            where: { customerId, adminId },
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

