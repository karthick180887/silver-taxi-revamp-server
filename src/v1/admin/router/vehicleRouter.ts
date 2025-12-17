import { Router } from "express";
import {
    createVehicle,
    deleteVehicle,
    getActiveVehicles,
    getAllVehicles,
    getVehicleById,
    multiDeleteVehicles,
    updateVehicle,
    getVehicleTypes,
    getAllVehiclesAdmin,
    createVehicleTypes,
    acceptVehicleTypes,
    deleteVehicleTypes,
    getVehicleMakes
} from "../controller/vehicleController";
import upload from "../../../utils/multer.fileUpload";

const router = Router();

router.get("/", getAllVehicles);

router.get("/admin", getAllVehiclesAdmin);

router.get("/active", getActiveVehicles);

router.get("/types", getVehicleTypes);

router.get("/makes", getVehicleMakes);

router.get("/:id", getVehicleById);

router.post("/", upload.single("imageUrl"), createVehicle);

router.post("/types/add", createVehicleTypes);

router.put("/types/accept/:name", acceptVehicleTypes);

router.put("/:id", updateVehicle);

router.delete("/:id", deleteVehicle);

router.delete("/types/:name", deleteVehicleTypes);

router.delete("/", multiDeleteVehicles);





export default router;
