import { Request, Response } from "express";
import { ConfigKeys } from "../../core/models";
import { encryptKey, decryptKey } from "../../../utils/cryptoJs";
import { setConfigKey, deleteConfigKey, refreshKey } from "../../../common/services/node-cache";

// Get all config keys
export const getAllConfigKeys = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        const keys = await ConfigKeys.findAll({
            where: { adminId },
            attributes: ['id', 'keyName', 'description', 'isPublic', 'status', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: "Config keys retrieved successfully",
            data: keys
        });
    } catch (error) {
        console.error("Error fetching config keys:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching config keys"
        });
    }
};

// Get a single config key (decrypted)
export const getConfigKeyById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const key = await ConfigKeys.findOne({
            where: { id },
            attributes: ['id', 'keyName', 'keyValue', 'description', 'isPublic', 'status']
        });

        if (!key) {
            res.status(404).json({
                success: false,
                message: "Config key not found"
            });
            return;
        }

        // Decrypt the value
        const decryptedValue = decryptKey(key.keyValue);

        res.status(200).json({
            success: true,
            message: "Config key retrieved successfully",
            data: {
                id: key.id,
                keyName: key.keyName,
                keyValue: decryptedValue,
                description: key.description,
                isPublic: key.isPublic,
                status: key.status
            }
        });
    } catch (error) {
        console.error("Error fetching config key:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching config key"
        });
    }
};

// Create a new config key
export const createConfigKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { keyName, keyValue, description, isPublic = false } = req.body;

        if (!keyName || !keyValue) {
            res.status(400).json({
                success: false,
                message: "keyName and keyValue are required"
            });
            return;
        }

        // Check if key already exists
        const existing = await ConfigKeys.findOne({ where: { keyName } });
        if (existing) {
            res.status(400).json({
                success: false,
                message: "Config key with this name already exists"
            });
            return;
        }

        // Encrypt the value
        const encryptedValue = encryptKey(keyValue);

        // Create the key
        const newKey = await ConfigKeys.create({
            adminId,
            keyName: keyName.trim(),
            keyValue: encryptedValue,
            description,
            isPublic,
            status: true
        });

        // Update cache
        setConfigKey(keyName.trim(), keyValue);

        res.status(201).json({
            success: true,
            message: "Config key created successfully",
            data: {
                id: newKey.id,
                keyName: newKey.keyName,
                description: newKey.description,
                isPublic: newKey.isPublic
            }
        });
    } catch (error) {
        console.error("Error creating config key:", error);
        res.status(500).json({
            success: false,
            message: "Error creating config key"
        });
    }
};

// Update a config key
export const updateConfigKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { keyValue, description, isPublic, status } = req.body;

        const key = await ConfigKeys.findOne({ where: { id } });
        if (!key) {
            res.status(404).json({
                success: false,
                message: "Config key not found"
            });
            return;
        }

        // Update fields
        if (keyValue !== undefined) {
            key.keyValue = encryptKey(keyValue);
            // Update cache with new value
            setConfigKey(key.keyName, keyValue);
        }
        if (description !== undefined) key.description = description;
        if (isPublic !== undefined) key.isPublic = isPublic;
        if (status !== undefined) {
            key.status = status;
            if (!status) {
                // Remove from cache if disabled
                deleteConfigKey(key.keyName);
            } else {
                // Refresh cache if re-enabled
                await refreshKey(key.keyName);
            }
        }

        await key.save();

        res.status(200).json({
            success: true,
            message: "Config key updated successfully",
            data: {
                id: key.id,
                keyName: key.keyName,
                description: key.description,
                isPublic: key.isPublic,
                status: key.status
            }
        });
    } catch (error) {
        console.error("Error updating config key:", error);
        res.status(500).json({
            success: false,
            message: "Error updating config key"
        });
    }
};

// Delete a config key (soft delete)
export const deleteConfigKey_Controller = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const key = await ConfigKeys.findOne({ where: { id } });
        if (!key) {
            res.status(404).json({
                success: false,
                message: "Config key not found"
            });
            return;
        }

        // Soft delete
        await key.destroy();

        // Remove from cache
        deleteConfigKey(key.keyName);

        res.status(200).json({
            success: true,
            message: "Config key deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting config key:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting config key"
        });
    }
};
