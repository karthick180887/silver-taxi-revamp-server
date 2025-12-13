import { Request, Response } from "express";
import { uploadFileToMiniIOS3 } from "../../../utils/minio.image";
import { signInToken } from "../../../common/services/jwt/jwt";
import { debugLogger as debug } from "../../../utils/logger";
import { findDistanceAndTime } from "../../../common/functions/distanceAndTime";
import fs from "fs/promises";
import env from "../../../utils/env";

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers["x-file-token"];
        const secret = env.FILE_UPLOAD_SECRET_TOKEN
        
        if (!token || token !== secret) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            })
            return;
        }
        
        const image = req.file;
        const { pathName, id } = req.body;
        debug.info("req.body > > ", req.body)

        if (!image) {
            res.status(400).json({
                success: false,
                message: "Missing required fields image",
            });
            return;
        }
        // console.log("image----->", image); 

        const { nanoid } = await import("nanoid")
        const companyId = nanoid(10);
        const imageBuffer = await fs.readFile(image.path);
        const imageUrl = await uploadFileToMiniIOS3(imageBuffer, `${pathName ? pathName.trim() : "others"}/${id ? `${id.trim()}/` : ``}${companyId}.webp`);
        await fs.unlink(image.path).catch((err: Error) =>
            console.error("Error deleting temporary file:", err)
        );

        res.status(201).json({
            success: true,
            message: `imgage uploaded successfully to ${pathName ? pathName : "others"}/${id ? `${id}/` : ``}${companyId}.webp`,
            data: imageUrl,
        });


    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading image",
        });
    }
};

export const generateToken = async (req: Request, res: Response) => {
    try {
        console.log("req.body", req.body)
        const { adminId, id, username, role } = req.body;
        const userData = {
            adminId,
            id: id ?? "",
            username: username ?? "",
            role: role ?? "role"
        }

        const token = await signInToken({ userData, adminId });

        res.status(200).json({
            success: true,
            message: "Token generated successfully",
            data: {
                token,
                adminId
            },
        });
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).json({
            success: false,
            message: "Error generating token",
            error,
        });
    }
}

export const distanceFind = async (req: Request, res: Response) => {
    const { origin, destination } = req.query;
    const data = await findDistanceAndTime(origin as string, destination as string);
    res.json({ data });
};