import { redis } from "../../db/redis";
import { Driver, Customer, Vendor, Admin } from "../../../v1/core/models";

const CACHE_TTL = 3600; // 1 hour

export const getCachedUser = async (role: string, id: string): Promise<any> => {
    const cacheKey = `${role}:session:${id}`;

    // 1. Try Redis
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (err) {
        console.error(`[Cache] Redis get error for ${cacheKey}:`, err);
    }

    // 2. Fallback to DB
    let user = null;
    const isNumeric = !isNaN(Number(id));

    try {
        if (role === 'driver') {
            if (isNumeric) {
                user = await Driver.findOne({ where: { id } });
            }
            if (!user) user = await Driver.findOne({ where: { driverId: id } }); // Fallback for legacy ID
        } else if (role === 'customer') {
            if (isNumeric) {
                user = await Customer.findOne({ where: { id } });
            }
            if (!user) user = await Customer.findOne({ where: { customerId: id } });
        } else if (role === 'vendor') {
            user = await Vendor.findOne({ where: { vendorId: id, isLogin: true } });
        } else if (role === 'admin') {
            // Admin is rarely hitting high concurrency, but good to cache
            user = await Admin.findOne({ where: { adminId: id } });
        }
    } catch (dbErr) {
        console.error(`[Cache] DB find error for ${role}:${id}`, dbErr);
        return null;
    }

    // 3. Store in Redis if found
    if (user) {
        try {
            await redis.set(cacheKey, JSON.stringify(user), { EX: CACHE_TTL });
        } catch (cacheErr) {
            console.error(`[Cache] Redis set error for ${cacheKey}`, cacheErr);
        }
    }

    return user;
};

export const clearUserCache = async (role: string, id: string) => {
    try {
        await redis.del(`${role}:session:${id}`);
    } catch (err) {
        console.error(`[Cache] Redis del error:`, err);
    }
}
