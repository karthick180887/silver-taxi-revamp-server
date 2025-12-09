import { Router } from "express";
import {
    fcmTokenUpdate, getAdminDetails, getDriverDetails,
    onlineStatusUpdate, driverPaymentDetailsCreate, driverPaymentDetailsUpdate,
    driverPaymentDetailsGet, driverPaymentDetailsGetById,
    driverPaymentDetailsToggle,
    locationUpdate
} from "../controller/driver.controller";

const router = Router();

router.get('/get-details', getDriverDetails);
router.get('/admin-get-details', getAdminDetails);

router.put('/fcm-token/update', fcmTokenUpdate);
router.put('/location-update', locationUpdate);
router.put('/online-status', onlineStatusUpdate);

// Driver Payment Details
router.get('/payment-details', driverPaymentDetailsGet);
router.get('/payment-details/:id', driverPaymentDetailsGetById);
router.post('/payment-details', driverPaymentDetailsCreate);
router.put('/payment-details/:id', driverPaymentDetailsUpdate);
router.put('/payment-details/:id/:type', driverPaymentDetailsToggle);

export default router   