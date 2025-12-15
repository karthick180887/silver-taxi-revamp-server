import { Router } from "express";
import {
    getAllConfigKeys,
    getConfigKeyById,
    createConfigKey,
    updateConfigKey,
    deleteConfigKey_Controller
} from "../controller/configKeysController";
import { auth } from "../../../common/middleware/auth";

const router = Router();

// All routes require JWT authentication
router.use(auth);

// Get all config keys
router.get("/", getAllConfigKeys);

// Get a single config key by ID (decrypted)
router.get("/:id", getConfigKeyById);

// Create a new config key
router.post("/", createConfigKey);

// Update a config key
router.put("/:id", updateConfigKey);

// Delete a config key
router.delete("/:id", deleteConfigKey_Controller);

export default router;
