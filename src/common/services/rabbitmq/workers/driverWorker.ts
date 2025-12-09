import { consumeDriverWorks } from "../consumer";
import { sequelize } from "../../../db/postgres";
import { Transaction } from "sequelize";
import {
    Admin,
    DriverWallet,
    WalletTransaction,
} from "../../../../v1/core/models";
import { sendToSingleToken } from "../../firebase/appNotify";
import { createDriverNotification } from "../../../../v1/core/function/notificationCreate";
import { getDriverFcmToken } from "../../../../utils/redis.configs";
import { debugLogger as debug, infoLogger as log } from "../../../../utils/logger";
import { generateTransactionId } from "../../../../v1/core/function/commissionCalculation";

type AdjustmentType = "add" | "minus";

interface WalletBulkDriverPayload {
    driverId: string;
    walletId: string;
    adminId: string;
    name: string;
    phone: string;
    fcmToken?: string | null;
}

interface WalletBulkRequestMeta {
    amount: number;
    reason: string;
    days?: number;
    adjustmentType: AdjustmentType;
    statusFilter?: boolean | null;
}

interface WalletBulkMessage {
    jobId: string;
    adminId: string;
    chunk?: {
        index: number;
        size: number;
        total: number;
    };
    request: WalletBulkRequestMeta;
    drivers: WalletBulkDriverPayload[];
}

const DRIVER_BATCH_PROCESS_SIZE = 25;

export const registerDriverWalletWorker = async () => {
    await consumeDriverWorks("driver.wallet.*", async (msg, msgRoutingKey) => {
        const target = msgRoutingKey.split(".")[2];

        if (target !== "bulk") {
            debug.info(`Driver wallet worker received unsupported target ${target}`);
            return;
        }

        try {
            await handleBulkWalletMessage(msg as WalletBulkMessage);
        } catch (error) {
            debug.info(`Driver wallet worker error`, { error, msg });
        }
    });
};

const handleBulkWalletMessage = async (payload: WalletBulkMessage) => {
    if (!payload?.drivers?.length) {
        debug.info(`Wallet bulk worker received empty driver list`, { jobId: payload?.jobId });
        return;
    }

    if (!payload.request?.amount || !payload.request?.adjustmentType) {
        debug.info(`Wallet bulk worker missing request details`, { jobId: payload?.jobId });
        return;
    }

    const amount = Number(payload.request.amount);
    if (Number.isNaN(amount) || amount <= 0) {
        debug.info(`Wallet bulk worker invalid amount`, { jobId: payload.jobId, amount: payload.request.amount });
        return;
    }

    const admin = await Admin.findOne({ where: { adminId: payload.adminId } });
    const adminName = admin?.name ?? "Silver Taxi";

    const driverChunks = chunkArray(payload.drivers, DRIVER_BATCH_PROCESS_SIZE);

    for (const chunk of driverChunks) {
        await Promise.allSettled(chunk.map((driver) =>
            processDriverWalletAdjustment(driver, payload.request, adminName, payload.jobId)
        ));
    }

    log.info(`✅ Wallet bulk job processed`, {
        jobId: payload.jobId,
        chunk: payload.chunk?.index ?? 0,
        processed: payload.drivers.length,
    });
};

const processDriverWalletAdjustment = async (
    driver: WalletBulkDriverPayload,
    request: WalletBulkRequestMeta,
    adminName: string,
    jobId: string,
) => {
    if (!driver.walletId) {
        debug.info(`Wallet bulk worker skipping driver without wallet`, { driverId: driver.driverId, jobId });
        return;
    }

    let transaction: Transaction | null = null;

    try {
        transaction = await sequelize.transaction();

        if (!transaction) {
            debug.info(`Wallet bulk worker failed to start transaction`, { driverId: driver.driverId, jobId });
            return;
        }

        const wallet = await DriverWallet.findOne({
            where: { walletId: driver.walletId },
            lock: transaction.LOCK.UPDATE,
            transaction,
        });

        if (!wallet) {
            debug.info(`Wallet bulk worker unable to find wallet`, { driverId: driver.driverId, jobId });
            await transaction.rollback();
            return;
        }

        const prevBalance = wallet.balance ?? 0;
        const totalAmount = Number(wallet.totalAmount ?? 0) || 0;
        const amount = request.amount;
        const isCredit = request.adjustmentType === "add";

        if (isCredit) {
            wallet.balance = prevBalance + amount;
            wallet.plusAmount = (wallet.plusAmount ?? 0) + amount;
            wallet.totalAmount = String(totalAmount + amount);
        } else {
            wallet.balance = prevBalance - amount;
            wallet.minusAmount = (wallet.minusAmount ?? 0) + amount;
            wallet.totalAmount = String(totalAmount - amount);
        }

        await wallet.save({ transaction });

        const customId = await generateTransactionId();
        const driverName = `${driver.name ?? ""} ${driver.phone ?? ""}`.trim();
        const fareBreakup = {
            previousWalletBalance: prevBalance,
            amount,
            prefix: isCredit ? "+" : "-",
            postWalletBalance: wallet.balance,
        };

        await WalletTransaction.create({
            adminId: driver.adminId,
            transactionId: customId,
            initiatedBy: adminName,
            initiatedTo: driverName || driver.driverId,
            amount,
            type: isCredit ? "Credit" : "Debit",
            date: new Date(),
            tnxPaymentMethod: "AdminBulk",
            tnxPaymentStatus: "Success",
            isShow: true,
            description: request.reason ?? (isCredit ? "Wallet amount added" : "Wallet amount subtracted"),
            driverId: driver.driverId,
            ownedBy: "Driver",
            remark: request.reason ?? null,
            fareBreakdown: fareBreakup,
        }, { transaction });

        await transaction.commit();

        await sendDriverWalletNotification(driver, request, amount);
    } catch (error) {
        if (transaction) {
            await transaction.rollback().catch(() => undefined);
        }
        debug.info(`Wallet bulk worker failed for driver ${driver.driverId}`, { error, jobId });
    }
};

const sendDriverWalletNotification = async (
    driver: WalletBulkDriverPayload,
    request: WalletBulkRequestMeta,
    amount: number,
) => {
    try {
        const title = `wallet ${request.adjustmentType === "add" ? "Credit" : "Debit"} : ${amount}`;
        const message = request.reason
            ?? (request.adjustmentType === "add"
                ? "Admin added amount to your wallet"
                : "Admin deducted amount from your wallet");

        const walletNotification = await createDriverNotification({
            title,
            message,
            ids: {
                adminId: driver.adminId,
                driverId: driver.driverId,
            },
            type: "wallet",
        });

        if (!walletNotification) {
            return;
        }

        const redisFcmToken = driver.adminId
            ? await getDriverFcmToken(String(driver.adminId), String(driver.driverId))
            : null;
        const targetFcmToken = redisFcmToken || driver.fcmToken;

        if (!targetFcmToken) {
            debug.info(`Wallet bulk worker missing FCM token`, { driverId: driver.driverId });
            return;
        }

        await sendToSingleToken(targetFcmToken, {
            ids: {
                adminId: driver.adminId,
                driverId: driver.driverId,
            },
            data: {
                title,
                message,
                type: "wallet",
                channelKey: "other_channel",
            },
        });
    } catch (error) {
        debug.info(`Wallet bulk worker notification error`, { error, driverId: driver.driverId });
    }
};

const chunkArray = <T,>(items: T[], size: number): T[][] => {
    if (size <= 0) {
        return [items];
    }

    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};