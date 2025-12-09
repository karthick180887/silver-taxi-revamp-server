import fs from "fs";
import path from "path";
import { redis, initRedis } from "../../../common/db/redis";
import { DriversSchema } from "../../../common/validations/redisSchema";

interface RedisDriverData {
    driverId: string;
    adminId: string;
    name: string;
    phone: string;
    adminVerified: "Pending" | "Approved" | "Rejected";
    fcmToken: string;
    walletId: string;
    geoLocation: string; // JSON string that needs to be parsed
    isActive: boolean;
    bookingCount: number;
    totalEarnings: string;
}

async function migrateRedisDrivers() {
    try {
        // Initialize Redis connection
        await initRedis();
        console.log("✅ Redis connection initialized");

        // Read the redis-drivers.json file
        const dataPath = path.join(__dirname, "../data/redis-drivers.json");
        const raw = fs.readFileSync(dataPath, "utf-8");
        const drivers: RedisDriverData[] = JSON.parse(raw);

        console.log(`📦 Total drivers to migrate: ${drivers.length}`);

        let processedCount = 0;
        let storedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        const failedDrivers: any[] = [];

        // Process and store each driver individually
        for (const driver of drivers) {
            try {
                // Parse geoLocation JSON string
                let geoLocation;
                try {
                    if (typeof driver.geoLocation === 'string') {
                        geoLocation = JSON.parse(driver.geoLocation);
                    } else {
                        geoLocation = driver.geoLocation;
                    }
                } catch (parseError) {
                    console.warn(`⚠️ Failed to parse geoLocation for driver ${driver.driverId}, using defaults`);
                    geoLocation = {
                        latitude: 0,
                        longitude: 0,
                        timestamp: new Date().toISOString()
                    };
                }

                // Ensure geoLocation has proper structure
                const processedGeoLocation = {
                    latitude: geoLocation?.latitude || 0,
                    longitude: geoLocation?.longitude || 0,
                    timestamp: geoLocation?.timestamp 
                        ? (typeof geoLocation.timestamp === 'string' 
                            ? geoLocation.timestamp 
                            : new Date(geoLocation.timestamp).toISOString())
                        : new Date().toISOString()
                };

                // Create processed driver object (without isActive, bookingCount, totalEarnings)
                const processedDriver = {
                    driverId: driver.driverId || "",
                    adminId: driver.adminId || "",
                    name: driver.name || "",
                    phone: driver.phone || "",
                    adminVerified: driver.adminVerified || "Pending",
                    fcmToken: driver.fcmToken || "",
                    walletId: driver.walletId || "",
                    geoLocation: geoLocation ? processedGeoLocation : null,
                    isActive: driver.isActive || false,
                };

                // Validate using schema (wrap in array, then extract)
                const validationResult = DriversSchema.safeParse(processedDriver);
                if (!validationResult.success) {
                    console.error(`❌ Validation failed for driver ${driver.driverId}:`, validationResult.error.format());
                    failedDrivers.push({ driver, error: validationResult.error.format() });
                    failedCount++;
                    continue;
                }

                // Store each driver individually in Redis using driverId as the key
                const adminId = driver.adminId || "admin-1";
                const driverId = driver.driverId || "";
                
                if (!driverId) {
                    console.error(`❌ Missing driverId for driver`);
                    failedDrivers.push({ driver, error: "Missing driverId" });
                    failedCount++;
                    continue;
                }

                // Check if driver already exists in Redis using EXISTS (standard Redis command, no JSON module needed)
                const driverKey = `${adminId}:drivers:${driverId}`;
                try {
                    const keyExists = await redis.exists(driverKey);
                    if (keyExists) {
                        skippedCount++;
                        if (skippedCount % 100 === 0) {
                            console.log(`⏭️  Skipped ${skippedCount} existing drivers...`);
                        }
                        processedCount++;
                        continue; // Skip this driver as it already exists
                    }
                } catch (checkError: any) {
                    // If check fails, continue anyway (will try to store)
                    console.warn(`⚠️ Could not check if driver ${driverId} exists, will attempt to store:`, checkError.message);
                }

                // Store in Redis with key: ${adminId}:drivers:${driverId}
                // Use standard Redis SET instead of JSON.SET (doesn't require JSON module)
                try {
                    const driverData = Array.isArray(validationResult.data) && validationResult.data.length > 0
                        ? validationResult.data[0]
                        : validationResult.data;
                    
                    const driverKey = `${adminId}:drivers:${driverId}`;
                    const driverValue = JSON.stringify({
                        ...driverData,
                        updatedAt: new Date().toISOString(),
                    });
                    
                    await redis.set(driverKey, driverValue);
                    storedCount++;
                    if (storedCount % 100 === 0) {
                        console.log(`✅ Stored ${storedCount} drivers...`);
                    }
                } catch (storeError: any) {
                    console.error(`❌ Failed to store driver ${driverId}:`, storeError.message);
                    failedDrivers.push({ driver, error: storeError.message });
                    failedCount++;
                }

                processedCount++;
            } catch (err: any) {
                console.error(`❌ Error processing driver ${driver.driverId}:`, err.message);
                failedDrivers.push({ driver, error: err.message });
                failedCount++;
            }
        }

        console.log(`\n📊 Processing Summary:`);
        console.log(`   ✅ Processed: ${processedCount}`);
        console.log(`   ✅ Stored: ${storedCount}`);
        console.log(`   ⏭️  Skipped (already exist): ${skippedCount}`);
        console.log(`   ❌ Failed: ${failedCount}`);

        // Save failed drivers to file
        if (failedDrivers.length > 0) {
            const failedPath = path.join(__dirname, "../data/failed-redis-drivers.json");
            fs.writeFileSync(failedPath, JSON.stringify(failedDrivers, null, 2));
            console.log(`\n📝 Failed drivers saved to: ${failedPath}`);
        }

        console.log(`\n🎉 Migration completed!`);
        console.log(`   ✅ Successfully stored: ${storedCount} drivers`);
        console.log(`   ⏭️  Skipped (already exist): ${skippedCount} drivers`);
        console.log(`   ❌ Failed: ${failedCount} drivers`);
        console.log(`   📦 Total processed: ${processedCount}`);

    } catch (error: any) {
        console.error("❌ Migration failed:", error);
        throw error;
    } finally {
        // Close Redis connection
        await redis.quit();
        console.log("🔌 Redis connection closed");
    }
}

// Run the migration
migrateRedisDrivers()
    .then(() => {
        console.log("✅ Script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

