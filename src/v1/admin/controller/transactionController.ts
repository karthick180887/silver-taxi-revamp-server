import { Request, Response } from 'express';
import { WalletTransaction } from '../../core/models';

export const getVendorWalletTransactions = async (req: Request, res: Response) => {
    try {

        const { id } = req.params;

        const transactions = await WalletTransaction.findAll({
            where: { vendorId: id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Single Vendor Transactions fetched successfully',
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const getDriverWalletTransactions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const transactions = await WalletTransaction.findAll({
            where: { driverId: id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Single Driver Transactions fetched successfully',
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error:error
        });
    }
}


export const getAllVendorWalletTransactions = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const transactions = await WalletTransaction.findAll({
            where: { adminId, ownedBy: "Vendor" },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Vendor Transactions fetched successfully',
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const getAllDriverWalletTransactions = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const transactions = await WalletTransaction.findAll({
            where: { adminId, ownedBy: "Driver" },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Driver Transactions fetched successfully',
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}


