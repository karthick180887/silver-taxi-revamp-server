import { Router } from "express";
import {
    getAllOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer,
    toggleChanges,
    multiDeleteOffers
} from "../controller/offersController";
import upload from "../../../utils/multer.fileUpload";
const router = Router();

router.get("/", getAllOffers);

router.get("/:id", getOfferById);

router.post("/",upload.single("bannerImage"), createOffer);

router.put("/:id", updateOffer);

router.delete("/:id", deleteOffer);

router.delete("/", multiDeleteOffers);

router.post("/toggle-changes/:id", toggleChanges);

export default router;