import { Router } from "express";
import {
    getAllServices,
    getServiceById,
    getServiceByName,
    createService,
    updateServiceWithoutId,
    updateService,
    deleteService,
    createPackage,
    deletePackage,
    getPackages,
    getPackageTariffByVehicleId,
    getVendorPackageTariffByVehicleId,
} from "../controller/serviceController";

const router = Router();

router.get("/", getAllServices);

router.get("/by-name", getServiceByName);

router.get("/:id", getServiceById);

router.post("/", createService);

router.put("/", updateServiceWithoutId);

router.put("/:id", updateService);

router.delete("/:id", deleteService);

router.get("/packages/:type", getPackages);

router.post("/packages", createPackage);

router.delete("/packages/:id", deletePackage);

router.get("/packages/vehicle/:vehicleId/service/:serviceId/:type", getPackageTariffByVehicleId);

router.get("/packages/vendor/vehicle/:vehicleId/service/:serviceId/:type", getVendorPackageTariffByVehicleId);


export default router;

