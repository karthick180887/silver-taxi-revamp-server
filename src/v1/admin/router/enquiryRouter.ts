import express from "express";
import {
    getAllEnquiries,
    createEnquiry,
    updateEnquiry,
    deleteEnquiry,
    getEnquiryById,
    multiDeleteEnquiries,
    getVendorEnquiries,
    toggleChanges
} from "../controller/enquiryController";

const router = express.Router();

router.get("/vendor", getVendorEnquiries);

router.get("/", getAllEnquiries);

router.post("/", createEnquiry);

router.get("/:id", getEnquiryById);

router.put("/:id", updateEnquiry);

router.delete("/:id", deleteEnquiry);

router.delete("/", multiDeleteEnquiries);

router.post("/toggle-changes/:id", toggleChanges);

export default router;