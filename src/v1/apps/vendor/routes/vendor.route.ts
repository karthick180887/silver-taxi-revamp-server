import express from "express";
import { fcmTokenUpdate, getVendorProfile, getVendorWalletTransactions, vendorPaymentDetailsCreate, vendorPaymentDetailsGet, vendorPaymentDetailsUpdate, vendorPaymentDetailsToggle, vendorPaymentDetailsGetById } from "../controller/vendor.controller";

const router = express.Router()

router.get('/profile', getVendorProfile)
router.get('/transactions', getVendorWalletTransactions)
router.post('/fcm-token', fcmTokenUpdate)


router.post('/payment-details', vendorPaymentDetailsCreate)
router.get('/payment-details', vendorPaymentDetailsGet)
router.put('/payment-details/:id', vendorPaymentDetailsUpdate)
router.patch('/payment-details/:id/:type', vendorPaymentDetailsToggle)
router.get('/payment-details/:id', vendorPaymentDetailsGetById)





export default router;
