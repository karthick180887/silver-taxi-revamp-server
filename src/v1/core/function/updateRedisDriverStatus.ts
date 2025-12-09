import { redis } from "../../../common/db/redis";
import { DriversSchema } from "../../../common/validations/redisSchema";

export const updateRedisDriverStatus = async (
    adminId: string,
    driverId: string,
    newStatus: boolean
) => {
    const key = `${adminId}:drivers:${driverId}`;

    const redisData = await redis.json.get(key);
    if (!redisData) return;

    // Validate (optional but safe)
    const valid = DriversSchema.safeParse(redisData);
    if (!valid.success) {
        console.log("Invalid data in Redis. Skipping update.");
        return;
    }

    // Update only specific fields (PATCH)
    await redis.json.set(key, ".isActive", newStatus);
    await redis.json.set(key, ".updatedAt", new Date().toISOString());

    console.log("Redis driver status updated safely.");
};
