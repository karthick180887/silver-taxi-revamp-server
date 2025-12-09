import { Driver } from "../models/driver";
import { Vendor } from "../models/vendor";
import { Service } from "../models/services";
import { WalletTransaction } from "../models/walletTransaction";
import { DriverWallet } from "../models/driverWallets";
import { VendorWallet } from "../models/vendorWallets";
import { createDriverNotification } from "./notificationCreate";
import { debugLogger as debug, infoLogger as log } from "../../../utils/logger";
import { Booking } from "../models/booking";
import { sendToSingleToken } from "../../../common/services/firebase/appNotify";

type DebitedBy = "Vendor" | "Driver";

interface CommissionCalculationResult {
    success: boolean;
    message: string;
    transactionId?: string;
    commissionAmount?: number;
}

export const generateTransactionId = async (): Promise<string> => {
    const { customAlphabet } = await import('nanoid');
    const now = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
    return `Txn-${nanoid()}_${now}`;
}
export const customOTPGenerator = async (length: number = 4): Promise<string> => {
    const { customAlphabet } = await import("nanoid");
    const generateOtp = customAlphabet("1234567890", length);
    return generateOtp();
}

export const generateId = async (length: number = 6): Promise<string> => {
    const { nanoid } = await import('nanoid');
    return nanoid(length);
}

export const generateCustomTransactionId = async ({ length = 6, prefix = "Txn" }: { length?: number, prefix?: string }): Promise<string> => {
    const { customAlphabet } = await import('nanoid');
    const now = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', length);
    return `${prefix}-${nanoid()}_${now}`;
}

const getUserAndWallet = async (debitedId: string, debitedBy: DebitedBy): Promise<any> => {
    let user: Vendor | Driver | null = null;
    let wallet: DriverWallet | VendorWallet | null = null;

    if (debitedBy === "Vendor") {
        user = await Vendor.findOne({ where: { vendorId: debitedId } });
    } else if (debitedBy === "Driver") {
        user = await Driver.findOne({ where: { driverId: debitedId } });
    }

    if (debitedBy === "Driver") {
        if (user) {
            wallet = await DriverWallet.findOne({ where: { walletId: user.walletId } });
        }
    } else if (debitedBy === "Vendor") {
        if (user) {
            wallet = await VendorWallet.findOne({ where: { walletId: user.walletId } });
        }
    }

    return { user, wallet };
};

interface CommissionCalculationParams {
    debitedId: string;
    amount: number;
    serviceId: string;
    debitedBy: DebitedBy;
    bookingId: string;
    creditAmount?: number;
    pickup?: string;
    drop?: string;
    driverFareBreakup?: any;
    earnedAmount?: number;
    booking?: any;
}


export const commissionCalculation = async ({
    debitedId,
    amount,
    serviceId,
    debitedBy,
    bookingId,
    creditAmount = 0,
    pickup,
    drop,
    driverFareBreakup,
    earnedAmount,
    booking,
}: CommissionCalculationParams): Promise<CommissionCalculationResult> => {
    const transactionId = await generateTransactionId();

    console.log("[START] Commission calculation", {
        debitedId,
        serviceId,
        debitedBy,
        bookingId,
        amount,
        creditAmount,
    });

    try {
        const service = await Service.findOne({ where: { serviceId } });
        if (!service) {
            console.warn("[WARN] Service not found", { serviceId });
            return { success: false, message: "Service not found" };
        }

        const { user, wallet } = await getUserAndWallet(debitedId, debitedBy);

        if (!user) {
            console.warn("[WARN] User not found", { debitedId, debitedBy });
            return { success: false, message: `${debitedBy} not found` };
        }
        if (!wallet) {
            console.warn("[WARN] Wallet not found", { debitedId, debitedBy });
            return { success: false, message: `${debitedBy} Wallet not found` };
        }

        console.log("[INFO] User and wallet fetched", {
            userId: user.id,
            walletBalance: wallet.balance,
        });

        let transaction: WalletTransaction | null = null;
        const shortPickup = pickup?.split(",")[0] || "";
        const shortDrop = drop?.split(",")[0] || "";

        // 🔹 Debit logic
        if (amount > 0) {
            console.log("[STEP] Deducting commission & discount", { amount, discount: creditAmount });
            const finalAmount = amount - Number(creditAmount || 0);

            const fareBreakup = {
                ...driverFareBreakup,
                previousWalletBalance: wallet.balance,
                amount: finalAmount,
                prefix: "-",
                discountAmount: creditAmount,
                postWalletBalance: wallet.balance - finalAmount,
            }
            wallet.balance -= finalAmount
            wallet.minusAmount += finalAmount;
            wallet.totalAmount += finalAmount || 0;
            await wallet.save();

            const remark = `Commission deducted for trip ${bookingId} from ${shortPickup} to ${shortDrop}.`;
            console.log("[DEBIT] Remark:", remark);

            transaction = await WalletTransaction.create({
                adminId: user.adminId,
                transactionId,
                initiatedBy: "Silver Taxi",
                vendorId: debitedBy === "Vendor" ? (user as Vendor).vendorId : undefined,
                driverId: debitedBy === "Driver" ? (user as Driver).driverId : undefined,
                initiatedTo: `${user.name}, ${user.phone}`,
                amount: finalAmount,
                type: "Debit",
                isShow: true,
                remark,
                tnxPaymentMethod: "Deducted",
                tnxPaymentStatus: "Success",
                date: new Date(),
                description: "Commission deducted from wallet",
                ownedBy: debitedBy,
                fareBreakdown: fareBreakup,
            });
            await transaction.save();

            console.log("[DEBIT] Transaction saved", { transactionId });
        }

        // 🔹 Vendor Credit logic
        if (debitedBy === "Vendor" && creditAmount > 0) {
            console.log("[STEP] Vendor credit", { creditAmount });
            const fareBreakup = {
                previousWalletBalance: wallet.balance,
                amount: creditAmount,
                prefix: "+",
                postWalletBalance: wallet.balance + creditAmount,
            }

            wallet.balance += creditAmount;
            wallet.plusAmount += creditAmount;
            wallet.totalAmount += creditAmount;
            await wallet.save();

            const creditTxnId = await generateTransactionId();


            const stops = booking?.stops || [];

            const formattedStops = stops.map((stop: string) => stop.split(",")[0].trim());

            const remark = `${bookingId}: ${shortPickup} -> ${formattedStops.join(" -> ")}${formattedStops.length ? " -> " : " "} ${shortDrop}.`;



            console.log("[CREDIT] Remark:", remark);

            const creditTxn = await WalletTransaction.create({
                adminId: user.adminId,
                transactionId: creditTxnId,
                initiatedBy: "Silver Taxi",
                vendorId: user.vendorId,
                initiatedTo: `${user.name}, ${user.phone}`,
                amount: creditAmount,
                type: "Credit",
                isShow: true,
                remark,
                tnxPaymentMethod: "Wallet",
                tnxPaymentStatus: "Success",
                date: new Date(),
                description: remark,
                ownedBy: debitedBy,
                fareBreakdown: fareBreakup,
            });
            await creditTxn.save();

            console.log("[CREDIT] Vendor transaction saved", { creditTxnId });
        }

        // 🔹 Driver logic
        if (debitedBy === "Driver") {

            /* if (creditAmount > 0) {
                console.log("[STEP] Driver credit", { creditAmount });
                const fareBreakup = {
                    previousWalletBalance: wallet.balance,
                    amount: creditAmount,
                    prefix: "+",
                    postWalletBalance: wallet.balance + creditAmount,
                }
                wallet.balance += creditAmount;
                wallet.plusAmount += creditAmount;
                await wallet.save();

                const driverTxnId = await generateTransactionId();

                const driverTxn = await WalletTransaction.create({
                    adminId: user.adminId,
                    transactionId: driverTxnId,
                    initiatedBy: "Silver Taxi",
                    driverId: user.driverId,
                    initiatedTo: `${user.name}, ${user.phone}`,
                    amount: creditAmount,
                    type: "Credit",
                    isShow: true,
                    remark: `Trip ${bookingId}: A discount of ${creditAmount} has been added to your wallet for your ride from ${shortPickup} to ${shortDrop}. wallet message`,
                    tnxPaymentMethod: "Wallet",
                    tnxPaymentStatus: "Success",
                    date: new Date(),
                    description: `Trip ${bookingId}: A discount of ${creditAmount} has been added to your wallet for your ride from ${shortPickup} to ${shortDrop}. wallet message`,
                    ownedBy: debitedBy,
                    fareBreakdown: fareBreakup,
                });
                await driverTxn.save();

                console.log("[CREDIT] Driver transaction saved", { driverTxnId });
            } */

            // Notifications
            console.log("[STEP] Sending driver notifications");

            try {
                const bookingNotification = await createDriverNotification({
                    title: `Trip Completed ${bookingId}.`,
                    message: `Your trip is completed successfully.`,
                    ids: { adminId: user.adminId, driverId: user.driverId },
                    type: "booking",
                });

                if (bookingNotification && user.fcmToken) {
                    const tokenResponse = await sendToSingleToken(user.fcmToken, {
                        ids: {
                            adminId: user.adminId,
                            bookingId: user.bookingId,
                            driverId: user.driverId,
                        },
                        data: {
                            title: `Trip Completed ${bookingId}.`,
                            message: `Your trip is completed successfully.`,
                            type: "booking-completed",
                            channelKey: "other_channel",
                        },
                    });
                    console.log("[NOTIFY] Booking completed notification sent", tokenResponse);
                }
            } catch (err) {
                console.warn("[NOTIFY] Booking notification failed", err);
            }

            try {
                if (transaction) {
                    const walletNotification = await createDriverNotification({
                        title: `Wallet ${transaction.type}: ${transaction.amount}`,
                        message: `Wallet Amount is Debit for your last trip ${bookingId}.`,
                        ids: { adminId: user.adminId, driverId: user.driverId },
                        type: "wallet",
                    });

                    if (walletNotification && user.fcmToken) {
                        const tokenResponse = await sendToSingleToken(user.fcmToken, {
                            ids: {
                                adminId: user.adminId,
                                bookingId: user.bookingId,
                                driverId: user.driverId,
                            },
                            data: {
                                title: `Wallet ${transaction.type}: ${transaction.amount}`,
                                message: `Wallet Amount is Debit for your last trip ${bookingId}.`,
                                type: "wallet",
                                channelKey: "other_channel",
                            },
                        });
                        console.log("[NOTIFY] Wallet notification sent", tokenResponse);
                    }
                }
            } catch (err) {
                console.warn("[NOTIFY] Wallet notification failed", err);
            }
        }

        console.log("[END] Commission calculation success", {
            bookingId,
            transactionId,
            commissionAmount: amount,
        });

        return {
            success: true,
            message: "Commission processed successfully",
            transactionId,
            commissionAmount: amount,
        };
    } catch (error) {
        console.error("[ERROR] Commission calculation failed", error);
        return {
            success: false,
            message:
                (error as Error).message ||
                "An error occurred during commission calculation",
        };
    }
};




