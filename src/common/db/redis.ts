import { createClient } from "redis";
import env from '../../utils/env'
import fs from 'fs/promises'; // Use promises API for asynchronous operations
import path from 'path';
import { Request, Response } from "express";

const redisHost = env.NODE_ENV === 'production' ? env.REDIS_HOST_PROD : env.REDIS_HOST;
const redisPort = env.NODE_ENV === 'production' ? env.REDIS_PORT_PROD : env.REDIS_PORT;
const redisPassword = env.NODE_ENV === 'production' ? env.REDIS_PASSWORD_PROD : env.REDIS_PASSWORD;
const redisUrl = `redis://${redisHost}:${redisPort}`;

// Initialize Redis client
const redis = createClient({
    url: redisUrl,
    password: redisPassword,
});

const pubClient = redis.duplicate();
const subClient = redis.duplicate();

// Function to initialize Redis and trigger backup
async function initRedis() {
    await new Promise<void>((resolve, reject) => {
        redis.once("ready", () => {
            console.warn(`[redis] is ready " ${env.NODE_ENV} "`);
            resolve();
        });

        redis.on("error", (error: any) => {
            console.error(`[redis] is not ready " ${env.NODE_ENV} "`);
            console.error(`[redis] Error: " ${env.NODE_ENV} "`, error);
            reject(error);
        });

        Promise.all([
            redis.connect(),
            pubClient.connect(),
            subClient.connect()
        ]).catch(reject);
    });
}

// Define a type for the Redis data backup
type RedisDataJSON = Record<string, any>;
type RedisDataString = string;

async function exportDataWithScan(cursor: number = 0, keys: string[] = []): Promise<string[]> {
    try {
        const reply: { cursor: number; keys: string[] } = await redis.scan(cursor, {
            MATCH: '*',
            COUNT: 1000,
        });
        keys = keys.concat(reply.keys);

        if (reply.cursor !== 0) {
            return exportDataWithScan(reply.cursor, keys);
        }

        return keys;
    } catch (error) {
        console.error(`Error during SCAN: " ${env.NODE_ENV} "`, error);
        return keys;
    }
}

/**
 * Function to export Redis data into a JSON file.
 */
async function exportDataToJSONWithScan(): Promise<void> {
    try {
        const keys: string[] = await exportDataWithScan();
        const data: RedisDataJSON = {};

        for (const key of keys) {
            const type: string = await redis.type(key);
            switch (type) {
                case 'string':
                    data.string = data.string && data.string.length > 0 ? [...data.hash, {
                        type,
                        key,
                        value: await redis.get(key)
                    }] : [{
                        type,
                        key,
                        value: await redis.get(key)
                    }]
                    break;
                case 'hash':
                    data.hash = data.hash && data.hash.length > 0 ? [...data.hash, {
                        type,
                        key,
                        value: await redis.hGetAll(key)
                    }] : [{
                        type,
                        key,
                        value: await redis.hGetAll(key)
                    }]
                    break;
                case 'list':
                    data.list = data.list && data.list.length > 0 ? [...data.list, {
                        type,
                        key,
                        value: await redis.lRange(key, 0, -1)
                    }] : [{
                        type,
                        key,
                        value: await redis.lRange(key, 0, -1)
                    }]
                    break;
                case 'set':
                    data.set = data.set && data.set.length > 0 ? [...data.set, {
                        type,
                        key,
                        value: await redis.sMembers(key)
                    }] : [{
                        type,
                        key,
                        value: await redis.sMembers(key)
                    }]
                    break;
                case 'ReJSON-RL':
                    data['ReJSON-RL'] = data['ReJSON-RL'] && data['ReJSON-RL'].length > 0 ? [...data['ReJSON-RL'], {
                        type,
                        key,
                        value: await redis.json.get(key)
                    }] : [{
                        type,
                        key,
                        value: await redis.json.get(key)
                    }]
                    break;
                case 'zset':
                    data.zset = data.zset && data.zset.length > 0 ? [...data.zset, {
                        type,
                        key,
                        value: await redis.zRangeWithScores(key, 0, -1)
                    }] : [{
                        type,
                        key,
                        value: await redis.zRangeWithScores(key, 0, -1)
                    }]
                    break;
                case 'stream':
                    // Define the stream(s) to read from
                    const streams = [
                        {
                            key: key, // The stream key
                            id: '0-0' // The ID from which to start reading
                        }
                    ];

                    // Define the options for xRead
                    const options = {
                        COUNT: await redis.xLen(key), // Number of entries to read
                        BLOCK: 300 // Block for 300 milliseconds if no entries are available
                    };

                    // Correctly call xRead with streams array and options
                    const streamData = await redis.xRead(streams, options);
                    data.stream = data.stream && data.stream.length > 0 ? [...data.stream, {
                        type,
                        key,
                        value: streamData
                    }] : [{
                        type,
                        key,
                        value: streamData
                    }]
                    break;
                default:
                    data.default = data.default && data.default.length > 0 ? [...data.default, {
                        type,
                        key,
                        value: null
                    }] : [{
                        type,
                        key,
                        value: null
                    }]
            }
        }

        // Define the backup file path (make this configurable if needed)
        const backupPath: string = path.join(__dirname, '../../../../redis-backup-json.json');

        // Write the data to a JSON file asynchronously
        await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
        console.log(`Backup successful! Data saved to ${backupPath}`);
    } catch (error) {
        console.error('Error exporting data with SCAN:', error);
    }
}
async function exportDataToTexTCommandWithScan(req: Request, res: Response): Promise<any> {
    try {
        const keys: string[] = await exportDataWithScan();
        let data: RedisDataString = '';

        for (const key of keys) {
            const type: string = await redis.type(key);
            switch (type) {
                case 'string':
                    data += `SET ${key} ${await redis.get(key)}\n`
                    break;
                case 'hash':
                    const hashValues = await redis.hGetAll(key) ?? []
                    let hashStr = ""
                    for (const [key, value] of Object.entries(hashValues)) {
                        hashStr += `${key} ${value} `
                    }
                    data += `HSET ${key} ${hashStr}\n`
                    break;
                case 'list':
                    const listValues = await redis.lRange(key, 0, -1) ?? []
                    let listStr = ""
                    for (let index = listValues.length - 1; index >= 0; index--) {
                        listStr += `'${listValues[index]}'${index != 0 ? " " : ""}`
                    }
                    data += `LPUSH ${key}1 ${listStr}\n`
                    break;
                case 'set':
                    const setValues = await redis.sMembers(key) ?? []
                    let setStr = ""
                    for (let index = 0; index < setValues.length; index++) {
                        setStr += ` '${setValues[index]}'`
                    }
                    data += `SADD ${key}${setStr}\n`
                    break;
                case 'ReJSON-RL':
                    data += `JSON.SET ${key} $ '${JSON.stringify(await redis.json.get(key))}'\n`
                    break;
                case 'zset':
                    const zsetValues = await redis.zRangeWithScores(key, 0, -1) ?? []
                    let zsetStr = ""
                    for (let index = 0; index < zsetValues.length; index++) {
                        zsetStr += ` ${zsetValues[index]?.score} '${zsetValues[index]?.value}'${index != 0 ? " " : ""}`
                    }
                    data += `ZADD ${key} ${zsetStr}\n`
                    break;
                case 'stream':
                    // Define the stream(s) to read from
                    const streams = [
                        {
                            key: key, // The stream key
                            id: '0-0' // The ID from which to start reading
                        }
                    ];

                    // Define the options for xRead
                    const options = {
                        COUNT: await redis.xLen(key), // Number of entries to read
                        BLOCK: 300 // Block for 300 milliseconds if no entries are available
                    };

                    // Correctly call xRead with streams array and options
                    const streamData = await redis.xRead(streams, options) ?? []
                    for (let index = 0; index < streamData[0].messages.length; index++) {
                        let streamStr = ""
                        for (const [streamDatakey, streamDatavalue] of Object.entries(streamData[0].messages[index].message)) {
                            streamStr += ` '${streamDatakey}' '${streamDatavalue}'`
                        }
                        data += `XADD ${key} ${streamData[0].messages[index]?.id}${streamStr}\n`
                    }
                    break;
                default:
            }
        }

        // Define the backup file path (make this configurable if needed)
        const backupPath: string = path.join(__dirname, '../../../../redis-backup-commands.txt');

        // Write the data to a JSON file asynchronously
        await fs.writeFile(backupPath, data, "utf8");

        console.log(`Backup successful! Data saved to ${backupPath}`);

        res.download(backupPath, "redis-backup-file.txt", (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).send("Failed to send file");
            } else {
                console.log("File sent successfully");
            }
        });
    } catch (error) {
        console.error('Error exporting data with SCAN:', error);
    }
}


export { redis, pubClient, subClient, initRedis, exportDataToJSONWithScan, exportDataToTexTCommandWithScan };
