import { Router } from "express";
import {
    getAllPriceChange,
    getAllPriceChangeById,
    createPriceChange,
    updatePriceChange,
    deletePriceChange
} from "../controller/allPriceChangeController";

const allPriceChangeRouter = Router();

allPriceChangeRouter.get("/", getAllPriceChange);

allPriceChangeRouter.get("/:serviceId", getAllPriceChangeById);

allPriceChangeRouter.post("/", createPriceChange);

allPriceChangeRouter.put("/:id", updatePriceChange);

allPriceChangeRouter.delete("/:id", deletePriceChange);

export default allPriceChangeRouter;