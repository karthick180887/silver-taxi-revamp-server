import { Router } from "express";
import {
    getAllCompanyProfiles,
    getCompanyProfileById,
    createCompanyProfile,
    updateCompanyProfile,
    deleteCompanyProfile,
    getVendorCompanyProfiles
} from "../controller/companyProfileController";
import upload from "../../../utils/multer.fileUpload";
const router = Router();

router.get("/", getAllCompanyProfiles);

router.get("/vendor", getVendorCompanyProfiles);

router.get("/:id", getCompanyProfileById);

router.post("/",upload.single("logo"), createCompanyProfile);

router.put("/:id", updateCompanyProfile);

router.delete("/:id", deleteCompanyProfile);

export default router; 