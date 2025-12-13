import express, { Router } from "express";
import authRoute from "./appAuth.route";
import bookingRouter from "./booking.route"
import upload from "../../../../utils/multer.fileUpload"
import { chargesController, uploadImage } from "../controller/fileUpload.controller"
import multer from "multer";
import walletRoute from "./wallet.route";
import tripRouter from "./trip.route";
import driverRouter from "./driver.route";
import notificationRouter from "./driverNotification.route";
import vehicleRouter from "./vehicle.route";
import analyticRouter from "./analytics.route";
import earningRouter from './earnings.route';
import { getAllStates, getCities } from "../controller/appAuth.controller";
import { getConfigKeys } from "../controller/driver.controller"

import { appAuth } from "../../../../common/middleware/auth";

const router: Router = express.Router();

router.use("/auth", authRoute);

// Apply Auth Middleware for protected routes
router.use(appAuth);

router.use("/analytics", analyticRouter);

router.use("/earnings", earningRouter);

router.use("/booking", bookingRouter);

router.use("/trip", tripRouter);

router.use("/vehicle", vehicleRouter);

router.use("/wallet", walletRoute);

router.use("/driver", driverRouter);

router.use('/notification', notificationRouter)

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
}, uploadImage);

router.get("/charges", chargesController);

router.get("/states", getAllStates);

router.get("/cities", getCities);

router.get("/config-keys", getConfigKeys);

export default router