import fs from "fs";
import path from "path";
import { Driver, DriverWallet, Vehicle } from "../models";
import { sequelize } from "../../../common/db/postgres";
import { Transaction } from "sequelize";
import { generateReferralCode } from "../function/referCode";

async function migrateDrivers() {
    const dataPath = path.join(__dirname, "../data/silver-drivers.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const drivers = JSON.parse(raw);

    const minDriver = drivers
    console.log("min Driver >> ", minDriver.length)
    let failedDriver = []
    for (const d of minDriver) {
        try {
            // --- Map Firestore -> Driver ---
            const result = await sequelize.transaction(async (t: Transaction) => {
                let cleanedPhone = String(d.phoneNum || d.phoneNumber).replace(/^\+?91|\D/g, '');

                // Find driver
                const existingDriver = await Driver.findOne({ where: { phone: cleanedPhone } });
                if (existingDriver) {
                    console.error(`❌ Driver already exists for phone ${cleanedPhone}`);
                    return;
                }

                const driver = await Driver.create({
                    adminId: "admin-1",
                    name: d.name?.trim(),
                    phone: cleanedPhone,
                    driverImageUrl: d.profileImage,
                    documentUploaded: d.docsUploaded || true,
                    adminVerified: d.isAdminVerified ? "Approved" : "Pending",
                    isOnline: d.isOnline || false,
                    onRide: d.onRide || false,
                    bookingCount: d.totalTrips || 0,
                    totalEarnings: String(Math.round(d.totalMoneyEarned) || 0),
                    geoLocation: {
                        latitude: d.location["_latitude"] || null,
                        longitude: d.location["_longitude"] || null,
                        timestamp: new Date(d.locationLastUpdatedAt) || new Date()
                    },
                    fcmToken: d.token,
                    createdBy: "Admin",
                    isActive: !d.disableDriver,
                    aadharImageFront: d.proofs.aadharCopy,
                    licenseImageFront: d.proofs.dlCopy,
                    profileVerified: "accepted",
                    aadharImageBackVerified: "accepted",
                    aadharImageFrontVerified: "accepted",
                    licenseImageFrontVerified: "accepted",
                    licenseImageBackVerified: "accepted",
                    documentVerified: "accepted"
                }, { transaction: t });
                driver.driverId = `SLTD${cleanedPhone.slice(5, 10)}${driver.id}`;
                const { code: referralCodeGenerated } = generateReferralCode({ userId: driver.id });
                driver.referralCode = referralCodeGenerated;
                await driver.save({ transaction: t })

                const wallet = await DriverWallet.create({
                    adminId: driver.adminId,
                    driverId: driver.driverId,
                    balance: Math.round(d.amount),
                    startAmount: 0,
                }, { transaction: t });

                wallet.walletId = `drv-wlt-${wallet.id}`;
                await wallet.save({ transaction: t });

                driver.walletId = wallet.walletId;
                await driver.save({ transaction: t });

                // --- Map Firestore -> Vehicle ---
                const createVehicle = await Vehicle.create({
                    driverId: driver.driverId,
                    adminId: driver.adminId,
                    isActive: true,
                    isAdminVehicle: false,
                    name: d.carName,
                    type: d.carType,
                    vehicleNumber: d.carNumber,
                    insuranceImage: d.proofs?.insuranceCopy || null,
                    rcBookImageFront: d.proofs?.rcCopy || null,
                    adminVerified: "Approved",
                    profileVerified: "accepted",
                    documentVerified: "accepted",
                    rcFrontVerified: "accepted",
                    rcBackVerified: "accepted",
                    insuranceVerified: "accepted",
                    pollutionImageVerified: "accepted"
                }, { transaction: t })

                createVehicle.vehicleId = `veh-${createVehicle.id}`;
                await createVehicle.save({ transaction: t });
                console.log("✅ Driver migrated ", { driverId: driver.driverId, driverName: driver.name });
            });
        } catch (err: any) {
            failedDriver.push(d)
            console.error(`❌ Error migrating driver ${d.id}:`, err.message, {
                error: err
            });
        }
    }

    fs.writeFileSync(path.join(__dirname, "../data/failed-driver.json"), JSON.stringify(failedDriver, null, 2));
    console.log("✅ Driver Migration completed!");
}

migrateDrivers().then(() => process.exit());
