import express, { Router } from "express";
import { getDriverEarnings } from "../controller/earnings.controller";

const router: Router = express.Router();

// Routes
// router.post("/update", updateDriverAnalytics);
router.get("/get", getDriverEarnings);

export default router