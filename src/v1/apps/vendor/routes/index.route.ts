import express from "express";
import authRoute from "./auth.route";
import vendorRoute from "./vendor.route";
import bookingRoute from "./booking.route";
import estimationRoute from "./estimation.route";
import { getConfigKeys, getVersions } from "../controller/auth.controller"
import v2Route from "./v2.route";

const router = express.Router();

// Vendor authentication routes
router.use('/auth', authRoute);

// Vendor booking routes
router.use('/bookings', bookingRoute);

// Vendor estimation routes
router.use('/estimation', estimationRoute);

// Vendor specific routes
router.use('/', vendorRoute);

// Vendor v2 routes
router.use('/v2', v2Route);

router.get('/config-keys', getConfigKeys);

router.get('/version/get', getVersions);

export default router;
