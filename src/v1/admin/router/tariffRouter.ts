import { Router } from "express";
import {
    getAllTariffs,
    getTariffById,
    createTariff,
    updateTariff,
    deleteTariff,
    getTariffByVehicleId,
    getTariffByServiceId,
    getAllActiveTariffs,
    getVendorTariffs,
} from "../controller/tariffController";


const router = Router();

router.get("/", getAllTariffs);

router.get("/vendor", getVendorTariffs);

router.get("/:id", getTariffById);

router.post("/", createTariff);

router.put("/:id", updateTariff);

router.delete("/:id", deleteTariff);

router.get("/vehicle/:vehicleId/service/:serviceId/createdBy/:createdBy", getTariffByVehicleId);

router.get("/service/:serviceId", getTariffByServiceId);

router.get("/active", getAllActiveTariffs);

export default router;
