import fs from "fs";
import path from "path";
import { Driver, DriverWallet, Vehicle } from "../models";
import { sequelize } from "../../../common/db/postgres";
import { Transaction } from "sequelize";

async function migrateDrivers() {
    const dataPath = path.join(__dirname, "../data/silver-drivers.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const drivers = JSON.parse(raw);

    const minDriver = drivers
    console.log("min Driver >> ", minDriver.length)
    let failedDriver = []
    let message: any[] = []
    for (const d of minDriver) {
        try {
            // --- Map Firestore -> Driver ---
            const result = await sequelize.transaction(async (t: Transaction) => {
                let cleanedPhone = String(d.phoneNum || d.phoneNumber).replace(/^\+?91|\D/g, '');
                const driver = await Driver.findOne({
                    where: { phone: cleanedPhone },
                    transaction: t
                })

                if (!driver) {
                    failedDriver.push(d)
                    console.error(`❌ Driver not found for phone ${cleanedPhone}`);
                    message.push(`❌ Driver not found for phone ${cleanedPhone}`);
                    return;
                }


                const wallet = await DriverWallet.findOne({
                    where: { driverId: driver.driverId },
                    transaction: t
                });

                if (!wallet) {
                    failedDriver.push(d)
                    console.error(`❌ Wallet not found for driverId ${driver.driverId}, phone ${cleanedPhone}`);
                    message.push(`❌ Wallet not found for driverId ${driver.driverId}, phone ${cleanedPhone}`);
                    return;
                }

                if (Math.round(d.amount) == Math.round(wallet.balance)) {
                    console.log(`✅ Wallet balance already up-to-date for driverId ${driver.driverId} ${cleanedPhone}`);
                    message.push(`✅ Wallet balance already up-to-date for driverId ${driver.driverId} ${cleanedPhone}`);
                    return;
                }

                wallet.balance = Math.round(d.amount);
                await wallet.save({ transaction: t });
                console.log("✅ Wallet balance updated for driverId ", { driverId: driver.driverId, walletId: wallet.walletId });
            });
        } catch (err: any) {
            failedDriver.push(d)
            console.error(`❌ Error migrating driver ${d.id}:`, err.message, {
                error: err
            });
        }
    }

    fs.writeFileSync(path.join(__dirname, "../data/failed-driver-wallet.json"), JSON.stringify(failedDriver, null, 2));
    // fs.writeFileSync(path.join(__dirname, "../data/message-driver-wallet.json"), JSON.stringify(message, null, 2));
    console.log("✅ Driver Migration completed!");
}

migrateDrivers().then(() => process.exit());
