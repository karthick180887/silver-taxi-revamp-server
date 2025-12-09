import { Router } from "express";
import { offersController } from "../controller/offers.controller";

const router = Router();

router.get("/", offersController);

export default router;

