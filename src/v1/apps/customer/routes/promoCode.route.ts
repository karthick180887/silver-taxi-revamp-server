import express, { Router } from "express";
import { validatePromoCode, getPromoCodes, getPromoCodeById } from "../controller/promoCode.controller";
const router: Router = express.Router();


router.get("/get", getPromoCodes);

router.get("/:id", getPromoCodeById);

router.post("/validate", validatePromoCode);




export default router