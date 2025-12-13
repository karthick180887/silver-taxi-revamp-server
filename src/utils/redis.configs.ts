import { redis } from "../common/db/redis";
import { DriversSchema } from '../common/validations/redisSchema'


//Drivers Configs 
export const getRedisDrivers = async (adminId: string, id: string) => {
    try {
        const configString = await redis.get(`${adminId}:drivers:${id}`);

        if (!configString) return null;

        // Parse JSON string to object
        const config = JSON.parse(configString);

        const result = DriversSchema.safeParse(config);
        return result.success ? result.data : null;
    } catch (error) {
        console.error("Error getting Redis driver:", error);
        return null;
    }
};



export const getAllRedisDrivers = async (adminId: string) => {
    try {
        // Use SCAN instead of KEYS for better performance (non-blocking)
        const keys: string[] = [];
        let cursor = 0;
        const pattern = `${adminId}:drivers:*`;

        do {
            const reply = await redis.scan(cursor, {
                MATCH: pattern,
                COUNT: 1000,
            });
            cursor = reply.cursor;
            keys.push(...reply.keys);
        } while (cursor !== 0);

        if (!keys.length) return [];

        // Create pipeline
        const pipeline = redis.multi();

        // Queue all GETs (only one network round-trip)
        keys.forEach((key) => {
            pipeline.get(key);
        });

        // Execute pipeline
        const responses = await pipeline.exec();

        // Handle case where responses might be null or undefined
        if (!responses || !Array.isArray(responses)) {
            return [];
        }

        // Convert results to flat array of driver objects (like PostgreSQL response)
        const drivers: any[] = [];

        responses.forEach((resp, index) => {
            const key = keys[index];

            // Handle different response formats
            let error: any = null;
            let raw: any = null;

            // Check if resp is an array [error, value] format
            if (Array.isArray(resp) && resp.length >= 2) {
                [error, raw] = resp;
            } else if (resp instanceof Error) {
                error = resp;
            } else {
                // Response is directly the value
                raw = resp;
            }

            // Skip if there's an error or no data
            if (error || !raw) {
                return; // Skip this driver
            }

            // Parse JSON string to object
            let parsedData;
            try {
                parsedData = typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch (parseError) {
                console.error(`Error parsing JSON for key ${key}:`, parseError);
                return; // Skip this driver if parsing fails
            }

            // Wrap single driver object in array to match DriversSchema (which expects an array)
            // Each Redis key stores a single driver object, but schema expects an array
            const dataToValidate = parsedData;
            const validated = DriversSchema.safeParse(dataToValidate);

            // If validation succeeds, extract the driver object from the array and add it
            if (validated.success && validated.data) {
                drivers.push(validated.data); // Extract first driver from validated array
            }
        });

        return drivers;
    } catch (error: any) {
        console.error("Error getting all Redis drivers:", error);
        // If connection error, try to reconnect
        if (error.message?.includes('closed') || error.message?.includes('ClientClosedError')) {
            try {
                if (!redis.isOpen) {
                    await redis.connect();
                }
            } catch (reconnectError) {
                console.error("Failed to reconnect to Redis:", reconnectError);
            }
        }
        return [];
    }
};


export const setRedisDrivers = async (adminId: string, id: string, data: any): Promise<boolean> => {
    const result = DriversSchema.safeParse(data);
    // console.log("result", result);
    if (!result.success) {
        console.log("Invalid Redis Drivers Data");
        return false;
    }
    try {
        // Extract the first driver from the array since each Redis key stores a single driver
        const driverData = Array.isArray(result.data) && result.data.length > 0
            ? result.data[0]
            : result.data;

        // Stringify JSON object to string for storage
        const dataToStore = JSON.stringify({
            ...driverData,
            updatedAt: new Date().toISOString(),
        });

        await redis.set(`${adminId}:drivers:${id}`, dataToStore);
        console.log("Redis Drivers configuration set successfully");
        return true;
    } catch (error) {
        console.log("Error setting Redis Drivers configuration:", error);
        return false;
    }

};

export const getDriverFcmToken = async (adminId: string, driverId: string): Promise<string | null> => {
    if (!adminId || !driverId) return null;

    try {
        const driver = await getRedisDrivers(adminId, driverId);

        if (!driver || typeof driver.fcmToken !== "string") {
            return null;
        }

        const trimmed = driver.fcmToken.trim();
        return trimmed.length > 0 ? trimmed : null;
    } catch (error) {
        console.error("Error fetching driver FCM token from Redis:", error);
        return null;
    }
};

export const getDriverGeoLocation = async (adminId: string, driverId: string): Promise<{ latitude: number; longitude: number; timestamp: string } | null> => {
    if (!adminId || !driverId) return null;

    try {
        const driver = await getRedisDrivers(adminId, driverId);

        if (!driver || !driver.geoLocation) {
            return null;
        }

        const geoLocation = driver.geoLocation;
        if (typeof geoLocation === 'object' && geoLocation !== null && 'latitude' in geoLocation && 'longitude' in geoLocation) {
            return {
                latitude: Number(geoLocation.latitude) || 0,
                longitude: Number(geoLocation.longitude) || 0,
                timestamp: geoLocation.timestamp || new Date().toISOString(),
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching driver geoLocation from Redis:", error);
        return null;
    }
};


export const getClientConfig = async (id: string, adminId: string) => {
    try {
        const configString = await redis.get(`${adminId}:${id}:clientConfig`);
        if (!configString) return null;
        return JSON.parse(configString);
    } catch (error) {
        console.error("Error getting client config:", error);
        return null;
    }
}
export const clientConfig = async (id: string) => {
    // Assuming 'id' encompasses admin info or is the key prefix
    try {
        const configString = await redis.get(`${id}:clientConfig`);
        if (!configString) return { success: false };
        const data = JSON.parse(configString);
        return { success: true, data };
    } catch (error) {
        console.error("Error getting client config:", error);
        return { success: false };
    }
};

export const formConfig = async (id: string) => {
    try {
        const configString = await redis.get(`${id}:formConfig`);
        if (!configString) return { success: false };
        const data = JSON.parse(configString);
        return { success: true, data };
    } catch (error) {
        console.error("Error getting form config:", error);
        return { success: false };
    }
};

export const getServiceConfig = async () => {
    try {
        const configString = await redis.get(`global:serviceConfig`);
        if (!configString) return null;
        return JSON.parse(configString);
    } catch (error) {
        console.error("Error getting service config:", error);
        return null;
    }
};

export const setServiceConfig = async (data: any) => {
    try {
        await redis.set(`global:serviceConfig`, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Error setting service config:", error);
        return false;
    }
};
