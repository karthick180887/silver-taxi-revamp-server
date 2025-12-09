import { Router } from "express";
import { estimateFareController } from "../controller/estimation.controller";

const router = Router();

// POST /api/v1/vendor/estimation/estimate-fare
router.post("/", estimateFareController);

// GET /api/v1/vendor/estimation/hourly-packages
// router.get("/hourly-packages", getHourlyPackages);

export default router;
