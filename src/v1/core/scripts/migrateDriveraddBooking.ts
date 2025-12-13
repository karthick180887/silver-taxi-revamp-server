import { Booking, Driver } from "../models";
import { sequelize } from "../../../common/db/postgres";
import { Transaction } from "sequelize";

async function updateBookingsWithDriverInfo() {
    try {
        console.log("🚀 Starting booking update with driver information...");

        // Step 1: Get all bookings with driverId
        const bookings = await Booking.findAll({
            where: {
                driverId: {
                    [sequelize.Sequelize.Op.ne]: null
                }
            },
            attributes: ['id', 'bookingId', 'driverId', 'driverName', 'driverPhone']
        });

        console.log(`📊 Found ${bookings.length} bookings with driverId`);

        // Step 2: Extract unique driverIds
        const uniqueDriverIds = [...new Set(bookings.map(b => b.driverId).filter(id => id !== null))] as string[];
        console.log(`👥 Found ${uniqueDriverIds.length} unique driverIds`);

        // Step 3: Get all drivers with those driverIds
        const drivers = await Driver.findAll({
            where: {
                driverId: {
                    [sequelize.Sequelize.Op.in]: uniqueDriverIds
                }
            },
            attributes: ['driverId', 'name', 'phone']
        });

        console.log(`✅ Found ${drivers.length} drivers in database`);

        // Step 4: Create a map of driverId -> {name, phone}
        const driverMap = new Map<string, { name: string; phone: string }>();
        drivers.forEach(driver => {
            if (driver.driverId && driver.name && driver.phone) {
                driverMap.set(driver.driverId, {
                    name: driver.name,
                    phone: driver.phone
                });
            }
        });

        console.log(`🗺️  Created driver map with ${driverMap.size} entries`);

        // Step 5: Update bookings with driver information
        let updatedCount = 0;
        let skippedCount = 0;
        let failedBookings: any[] = [];

        for (const booking of bookings) {
            try {
                if (!booking.driverId) {
                    skippedCount++;
                    continue;
                }

                const driverInfo = driverMap.get(booking.driverId);

                if (!driverInfo) {
                    console.warn(`⚠️  Driver not found for driverId: ${booking.driverId} (Booking: ${booking.bookingId})`);
                    skippedCount++;
                    continue;
                }

                // Check if update is needed
                // Explicitly cast to any to access potentially raw properties from query
                const b = booking as any;
                if (b.driverName === driverInfo.name && b.driverPhone === driverInfo.phone) {
                    skippedCount++;
                    continue;
                }

                // Update booking
                await sequelize.transaction(async (t: Transaction) => {
                    await (booking as any).update({
                        driverName: driverInfo.name,
                        driverPhone: driverInfo.phone
                    }, { transaction: t });
                });

                updatedCount++;
                if (updatedCount % 100 === 0) {
                    console.log(`📝 Updated ${updatedCount} bookings...`);
                }
            } catch (err: any) {
                failedBookings.push({
                    bookingId: booking.bookingId,
                    driverId: booking.driverId,
                    error: err.message
                });
                console.error(`❌ Error updating booking ${booking.bookingId}:`, err.message);
            }
        }

        console.log("\n📈 Migration Summary:");
        console.log(`✅ Successfully updated: ${updatedCount} bookings`);
        console.log(`⏭️  Skipped: ${skippedCount} bookings`);
        console.log(`❌ Failed: ${failedBookings.length} bookings`);

        if (failedBookings.length > 0) {
            console.log("\n❌ Failed bookings:");
            failedBookings.forEach(fb => {
                console.log(`   - Booking: ${fb.bookingId}, DriverId: ${fb.driverId}, Error: ${fb.error}`);
            });
        }

        console.log("\n🎉 Booking update completed!");
    } catch (err: any) {
        console.error("❌ Fatal error in migration:", err);
        throw err;
    }
}

updateBookingsWithDriverInfo().then(() => {
    console.log("✅ Script execution completed!");
    process.exit(0);
}).catch((err) => {
    console.error("❌ Script execution failed:", err);
    process.exit(1);
});
