import NodeCache from "node-cache";
import { ConfigKeys } from "../../v1/core/models"; // adjust path
import { decryptKey } from "../../utils/cryptoJs";

const cache = new NodeCache({ checkperiod: 600 });

// Expiry handler -> refresh from DB
cache.on("expired", async (key: string) => {
    console.log(`[CACHE] Key expired: ${key}, refreshing from DB...`);
    await refreshKey(key);
});

// Get key (cached or DB)
export async function getConfigKey(keyName: string): Promise<string | null> {
    const cached = cache.get<string>(keyName);
    if (cached) return cached;

    return await refreshKey(keyName);
}

// Refresh key from DB
export async function refreshKey(keyName: string): Promise<string | null> {
    try {
        const row = await ConfigKeys.findOne({ where: { keyName, status: true } });
        if (!row) {
            cache.del(keyName);
            return null;
        }

        const value = decryptKey(row.keyValue);
        cache.set(keyName, value);
        return value;
    } catch (err) {
        console.error(`[CACHE] Failed to refresh key: ${keyName}`, err);
        return null;
    }
}

// Update cache when DB changes
export function setConfigKey(keyName: string, value: string) {
    cache.set(keyName, value);
}

// Delete cache entry
export function deleteConfigKey(keyName: string) {
    cache.del(keyName);
}

// Preload all keys (optional at startup)
export async function preloadAllKeys() {
    const rows = await ConfigKeys.findAll({ where: { status: true } });
    if (!rows || rows.length === 0) {
        console.log("No config keys found to preload");
    }

    rows.forEach(row => {
        const value = decryptKey(row.keyValue);
        cache.set(row.keyName.trim(), value);
    });
    console.log(cache.keys());
    console.log(`[CACHE] Preloaded ${rows.length} keys`);
}

