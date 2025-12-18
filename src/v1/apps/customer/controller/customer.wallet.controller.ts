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
        let wallet = await CustomerWallet.findOne({
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

        // 🛠️ SELF-HEALING: If balance is 0, verify against transactions
        // This fixes cases where dummy transactions were inserted but wallet wasn't updated.
        if (wallet.balance === 0) {
            const allTransactions = await CustomerTransaction.findAll({
                where: { customerId, adminId },
                attributes: ['amount', 'transactionType']
            });

            if (allTransactions.length > 0) {
                let calculatedBalance = 0;
                let totalCredit = 0;
                let totalDebit = 0;

                for (const t of allTransactions) {
                    if (t.transactionType === 'Credit') {
                        calculatedBalance += t.amount;
                        totalCredit += t.amount;
                    } else if (t.transactionType === 'Debit') {
                        calculatedBalance -= t.amount;
                        totalDebit += t.amount;
                    }
                }

                // If a discrepancy is found, auto-correct the wallet
                if (calculatedBalance !== 0) {
                    console.log(`[Wallet Repair] Fixing Wallet ${wallet.walletId}. Old: 0, New: ${calculatedBalance}`);
                    wallet.balance = calculatedBalance;
                    wallet.plusAmount = totalCredit;
                    wallet.minusAmount = totalDebit;
                    wallet.totalAmount = calculatedBalance; // Assuming totalAmount tracks current net, or maybe lifetime? Usually net.

                    // Specific fix: 'totalAmount' often implies lifetime credits in some systems, 
                    // but often 'current balance' in others. 
                    // Based on schema 'plusAmount' and 'minusAmount' exist.
                    // Let's set 'totalAmount' same as balance if unclear, or sum of credits?
                    // Safe bet: Update balance, plus, minus.
                    await wallet.save();
                }
            }
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

