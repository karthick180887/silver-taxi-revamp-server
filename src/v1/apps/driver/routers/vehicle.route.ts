import { Router } from "express";
import {
    getVehicles, getVehicleTypes,
    createVehicle, setVehicleStatus,
    updateVehicle,
    deleteVehicleTypes
} from "../controller/vehicle.controller"


const router = Router();


router.get("/types", getVehicleTypes);


router.get("/get-details", getVehicles);

router.post("/add", createVehicle);

router.put("/update", updateVehicle);

router.put("/change-status", setVehicleStatus);

router.delete("/types/:type", deleteVehicleTypes);

export default router