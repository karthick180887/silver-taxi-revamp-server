import express from "express";
import vehicleRouter from "./vehicleRouter";
import tariffRouter from "./tariffRouter";
import enquiryRouter from "./enquiryRouter"
import bookingRouter from "./bookingRouter";
import ipTrackingRouter from "./ipTrackingRouter"
import toggleRouter from "./toggleRouter";
import companyProfileRouter from "./companyProfileRouter";
import driverRouter from "./driverRouter";
import invoiceRouter from "./invoiceRouter";
import serviceRouter from "./serviceRouter";
import vendorRouter from "./vendorRouter";
import paymentTransRouter from "./paymentTransRouter";
import offersRouter from "./offersRouter";
import customerRouter from "./customerRouter";
import allIncludesRouter from "./allIncludesRouter";
import dynamicRoutesRouter from "./dynamicRoutesRouter";
import { uploadCompanyProfileImage } from "../controller/companyProfileController";
import upload from "../../../utils/multer.fileUpload";
import transactionRouter from "./transactionRouter";
import notificationRouter from "./notificationRouter";
import popularRoutesRouter from "./popularRoutesRouter";
import allPriceChangesRouter from './allPriceChangeRouter';
import blogRouter from "./blogRouter";
import promoCodeRouter from "./promoCodeRouter";
import permitChargesRouter from "./permitChargesRouter";
import multer from "multer";
import { columnVisibilityController, getColumnVisibilityController } from "../controller/toggleController";
import { testDocumentExpiry } from "../../core/function/cronJobs";
import { getAllConfigKeys, storeConfigKeys } from "../../admin/controller/authController";

const router = express.Router();

// Routes for admins
router.use('/vehicles', vehicleRouter);

router.use('/ip-tracking', ipTrackingRouter);

router.use('/vendors', vendorRouter);

router.use('/drivers', driverRouter);

router.use('/image-upload', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Handle Multer-specific errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Max size is 5MB.',
                    error: err.code
                });
            }
            return res.status(400).json({
                success: false,
                message: `Multer error: ${err.message}`,
                error: err.code
            });
        } else if (err) {
            // Handle other errors
            return res.status(500).json({
                success: false,
                message: `Unexpected error: ${err.message}`,
                error: err
            });
        }
        next();
    });
}, uploadCompanyProfileImage);

router.use('/toggles-change', toggleRouter);

router.use('/company-profile', companyProfileRouter);

router.use('/offers', offersRouter);

router.use('/promo-codes', promoCodeRouter);


router.use('/all-includes', allIncludesRouter);

router.use('/dynamic-routes', dynamicRoutesRouter);

router.use('/services', serviceRouter);

router.use('/tariffs', tariffRouter);

router.use('/enquiries', enquiryRouter);

router.use('/bookings', bookingRouter);

router.use('/invoices', invoiceRouter);

router.use('/payment-transactions', paymentTransRouter);

router.use('/customers', customerRouter);

router.use('/wallet-transactions', transactionRouter);

router.use('/notifications', notificationRouter);

router.use('/popular-routes', popularRoutesRouter);

router.use('/blogs', blogRouter);

router.use('/all-price-changes', allPriceChangesRouter);

router.use('/permit-charges', permitChargesRouter);

router.get('/column-visibility/:table', getColumnVisibilityController);

router.post('/column-visibility/:table', columnVisibilityController);

router.get('/config-keys', getAllConfigKeys);

router.post('/config-keys', storeConfigKeys);

// Test endpoint for document expiry check
router.get('/test-document-expiry', async (req, res) => {
    try {
        await testDocumentExpiry();
        res.json({ success: true, message: 'Document expiry check completed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error running document expiry check', error });
    }
});

export default router;
