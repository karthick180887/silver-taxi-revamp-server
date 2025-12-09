import { Router } from "express";
import { enquiryController } from "../controller/enquiry.controller";
import { saveEnquiry } from "../controller/enquiry.controller";

const router = Router();

router.post("/", enquiryController);

router.post("/saveEnquiry", saveEnquiry);

export default router;
