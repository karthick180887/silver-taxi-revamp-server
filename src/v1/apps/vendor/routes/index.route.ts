import express from "express";
import authRoute from "./auth.route";
import vendorRoute from "./vendor.route";
import bookingRoute from "./booking.route";
import estimationRoute from "./estimation.route";
import { getConfigKeys } from "../controller/auth.controller"

const router = express.Router();

// Vendor authentication routes
router.use('/auth', authRoute);

// Vendor booking routes
router.use('/bookings', bookingRoute);

// Vendor estimation routes
router.use('/estimation', estimationRoute);

// Vendor specific routes
router.use('/', vendorRoute);

router.get('/config-keys', getConfigKeys);

export default router;
