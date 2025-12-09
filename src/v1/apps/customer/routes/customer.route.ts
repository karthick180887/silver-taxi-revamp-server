import express, { Router } from "express";
import { getCustomerDetails, getTopDestinations, updateProfile, fcmTokenUpdate , getAdminDetails} from "../controller/customer.controller";
import { getServices } from "../controller/common.controller";
const router: Router = express.Router();


router.get("/get-details", getCustomerDetails);

router.get("/get-destinations", getTopDestinations);

router.get("/services", getServices)


router.get("/admin-details", getAdminDetails);

router.post("/profile-update", updateProfile);

router.put("/fcm-update", fcmTokenUpdate);




export default router