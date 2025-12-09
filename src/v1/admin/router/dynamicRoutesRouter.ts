import { Router } from "express";
import {
    createDynamicRoute,
    deleteDynamicRoute,
    getAllDynamicRoutes,
    getDynamicRouteById,
    updateDynamicRoute,
} from "../controller/dynamicRouteController";

const router = Router();

router.post("/", createDynamicRoute);

router.get("/", getAllDynamicRoutes);

router.get("/:id", getDynamicRouteById);

router.put("/:id", updateDynamicRoute);

router.delete("/:id", deleteDynamicRoute);

export default router;

