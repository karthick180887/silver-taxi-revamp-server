import fs from "fs";
import path from "path";
import { Vendor, VendorWallet, WalletTransaction } from "../models";
import { sequelize } from "../../../common/db/postgres";
import { Transaction } from "sequelize";
import bcrypt from "bcrypt";
import { generateTransactionId } from "../function/commissionCalculation";

async function migrateVendorPayment() {
    const dataPath = path.join(__dirname, "../data/silver-vendor-payments.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const vendorPayments = JSON.parse(raw);

    const minVendorPayments = vendorPayments
    console.log("min Vendor >> ", minVendorPayments.length)
    let failedVendorPayments = []
    for (const vP of minVendorPayments) {
        try {
            await sequelize.transaction(async (t: Transaction) => {
                let cleanedPhone = vP.driverPhone.replace(/^\+?91|\D/g, '');

                // Find vendor
                const vendor = await Vendor.findOne({ where: { phone: cleanedPhone } });
                if (!vendor) {
                    failedVendorPayments.push(vP)
                    console.error(`❌ Vendor not found for phone ${cleanedPhone}`);
                    return;
                }

                const creditTxnId = await generateTransactionId();
                const status = vP.status === "Paid" ? "Paid" : "Unpaid";

                if (vP.amountAdded > 0) {
                    const parsedDate = new Date(vP.createdAt.replace(/^.*?, /, ""));
                    const creditTxn = await WalletTransaction.create({
                        adminId: "admin-1",
                        transactionId: creditTxnId,
                        initiatedBy: "Silver Taxi",
                        vendorId: vendor.vendorId,
                        initiatedTo: `${vendor.name}, ${vendor.phone}`,
                        amount: Math.ceil(vP.amountAdded),
                        type: "Credit",
                        isShow: true,
                        remark: "-",
                        status: status,
                        tnxPaymentMethod: "Wallet",
                        tnxPaymentStatus: "Success",
                        date: parsedDate,
                        description: "-",
                        ownedBy: "Vendor",
                        fareBreakdown: {},
                    });
                    await creditTxn.save();
                }

                console.log("[CREDIT] Vendor transaction saved", { creditTxnId });
            });
        } catch (err: any) {
            failedVendorPayments.push(vP)
            console.error(`❌ Error migrating vendor ${vP.id}:`, err);
        }
    }

    fs.writeFileSync(path.join(__dirname, "../data/failed-vendor-payment.json"), JSON.stringify(failedVendorPayments, null, 2));
    console.log("✅ Vendor Migration completed!");
}

migrateVendorPayment().then(() => process.exit())