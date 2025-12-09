import { Router } from "express";
import {
    getAllPromoCodes,
    getPromoCodeById,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    toggleChanges,
    multiDeletePromoCodes
} from "../controller/promoCodesController";
import upload from "../../../utils/multer.fileUpload";
const router = Router();

router.get("/", getAllPromoCodes);

router.get("/:id", getPromoCodeById);

router.post("/",upload.single("bannerImage"), createPromoCode);

router.put("/:id", updatePromoCode);

router.delete("/:id", deletePromoCode);

router.delete("/", multiDeletePromoCodes);

router.post("/toggle-changes/:id", toggleChanges);

export default router;