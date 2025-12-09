import { Request, Response } from "express";
import { PaymentTransaction } from "../../core/models"; // Import the PaymentTransaction model

// Create a new payment transaction
export const createPaymentTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            gatewayTransactionId,
            bankReferenceId,
            sender,
            senderId,
            senderName,
            senderContact,
            receiverId,
            receiverName,
            receiverContact,
            paymentMethod,
            transactionType,
            transactionAmount,
            status,
            description,
        } = req.body;

        const newTransaction = await PaymentTransaction.create({
            gatewayTransactionId,
            bankReferenceId,
            adminId,
            sender,
            senderId,
            senderName,
            senderContact,
            receiverId,
            receiverName,
            receiverContact,
            paymentMethod,
            transactionType,
            transactionAmount,
            status,
            description,
        });

        const {nanoid} = await import("nanoid");

        newTransaction.transactionId = nanoid(16)
        await newTransaction.save();


        res.status(201).json({

            success: true,
            message: "Payment transaction saved successfully",
            data: newTransaction,

        });
    } catch (error) {
        console.error("Error creating payment transaction:", error);
        res.status(500).json({
            success: false,
            message: "Error creating payment transaction",
        });
    }
};

// Get all payment transactions
export const getAllPaymentTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const transactions = await PaymentTransaction.findAll({
            where: { adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });

        res.status(200).json({
            success: true,
            message: "Payment transactions retrieved successfully",
            data: transactions,
        });
    } catch (error) {
        console.error("Error fetching payment transactions:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching payment transactions",
        });
    }
};

// Get a single payment transaction by ID
export const getPaymentTransactionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const transaction = await PaymentTransaction.findOne({
            where: { transactionId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        });

        if (!transaction) {
            res.status(404).json({
                success: false,
                message: "Payment transaction not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Payment transaction retrieved successfully",
            data: transaction,
        });
    } catch (error) {
        console.error("Error fetching payment transaction:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching payment transaction",
        });
    }
};

// Update a payment transaction
export const updatePaymentTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            gatewayTransactionId,
            bankReferenceId,
            sender,
            senderId,
            senderName,
            senderContact,
            receiverId,
            receiverName,
            receiverContact,
            paymentMethod,
            transactionType,
            transactionAmount,
            status,
            description,
        } = req.body;

        const transaction = await PaymentTransaction.findOne(
            { where: { transactionId: id } }
        );

        if (!transaction) {
            res.status(404).json({
                success: false,
                message: "Payment transaction not found",
            });
            return;
        }

        const updatedTransaction = await transaction.update({
            gatewayTransactionId,
            bankReferenceId,
            sender,
            senderId,
            senderName,
            senderContact,
            receiverId,
            receiverName,
            receiverContact,
            paymentMethod,
            transactionType,
            transactionAmount,
            status,
            description,
        });

        res.status(200).json({
            success: true,
            message: "Payment transaction updated successfully",
            data: updatedTransaction,
        });
    } catch (error) {
        console.error("Error updating payment transaction:", error);
        res.status(500).json({
            success: false,
            message: "Error updating payment transaction",
        });
    }
};

// Delete a payment transaction
export const deletePaymentTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const transaction = await PaymentTransaction.findOne({ where: { id } });

        if (!transaction) {
            res.status(404).json({
                success: false,
                message: "Payment transaction not found",
            });
            return;
        }

        await transaction.destroy();

        res.status(200).json({
            success: true,
            message: "Payment transaction deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting payment transaction:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting payment transaction",
        });
    }
};
