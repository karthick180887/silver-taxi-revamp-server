import { Router } from "express";
import { 
    vehicleToggleStatusController,
    driverToggleStatusController,
    serviceToggleStatusController
 } from "../controller/toggleController";

const router = Router();

router.post("/vehicle", vehicleToggleStatusController);

router.post("/driver", driverToggleStatusController);

router.post("/service", serviceToggleStatusController);



export default router;
