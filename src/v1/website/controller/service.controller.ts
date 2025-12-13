import { Request, Response } from 'express';
import { setServiceConfig , getServiceConfig } from '@utils/redis.configs';


export const getService = async (req: Request, res: Response) => {
    try {
        const serviceConfig = await getServiceConfig();
        res.status(200).json(serviceConfig);
    } catch (error) {
        console.error("Error fetching service config:", error);
        res.status(500).json({ error: "Failed to fetch service config" });
    }
};

export const setService = async (req: Request, res: Response) => {
    try {
        const { data } = req.body;
        await setServiceConfig(data);
        res.status(200).json({ message: "Service config updated successfully" });
    } catch (error) {
        console.error("Error updating service config:", error);
        res.status(500).json({ error: "Failed to update service config" });
    }
};