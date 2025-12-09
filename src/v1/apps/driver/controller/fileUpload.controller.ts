import { Request, Response } from "express";
import { uploadFileToDOS3 } from "../../../../utils/minio.image";
import { debugLogger as debug } from "../../../../utils/logger";
import fs from "fs/promises";


export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const image = req.file;
        const { pathName , id } = req.body;
       
        if (!image) {
            res.status(400).json({
                success: false,
                message: "Missing required fields image",
            });
            return;
        }


        const { nanoid } = await import("nanoid")
        const uniqueId = nanoid(10);
        const imageBuffer = await fs.readFile(image.path);
        debug.info(`processing image upload for companyId: ${uniqueId}, pathName: ${pathName}, id: ${id}`);
        const imageUrl = await uploadFileToDOS3(imageBuffer, `${pathName ? pathName.trim() : "others"}/${id ? `${id.trim()}/` : ``}${uniqueId}.webp`);
        debug.info(`Image uploaded successfully, URL: ${imageUrl}`);
        await fs.unlink(image.path).catch((err: Error) =>
            console.error("Error deleting temporary file:", err)
        );

        res.status(200).json({
            success: true,
            message: `${pathName}/${id} image uploaded successfully`,
            data: imageUrl,
        });


    } catch (error) {
        console.error("Error uploading  image:", error);
        res.status(500).json({
            success: false,
            message: `Error uploading image`,
        });
    }
};

export const chargesController = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { labels, service } = req.query

    if (!driverId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        console.log("labels >> ", labels, service);
        if (labels) {
            const driverCharges = {
                "Toll": 0,
                "Hill": 0,
                "Permit Charge": 0,
                "Parking Charge": 0,
                "Pet Charge": 0,
                ...(service === "One way" ? { "Waiting Charge": 0 } : {}),
            }

            res.status(200).json({
                success: true,
                message: "Charges fetched successfully",
                data: driverCharges,
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Charges fetched successfully",
            data: [],
        })
        return;
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
        return;
    }


}