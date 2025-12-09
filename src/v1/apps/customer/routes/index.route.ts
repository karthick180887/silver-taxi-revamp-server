import express, { Router } from "express";
import authRoute from "../routes/auth.route";
import enquiryRoutes from "../routes/enquiry.route";
import bookingRoutes from "../routes/booking.route";
import customerRoutes from "../routes/customer.route";
import walletRoutes from "../routes/customer.wallet.route";
import promoCodeRoutes from "../routes/promoCode.route";
import offersRoutes from "../routes/offers.routes";
import notifications from "../routes/notifications.routes";
import { getConfigKeys, getVersions } from "../controller/common.controller";



const router: Router = express.Router();

router.use("/auth", authRoute);

router.use("/enquiry", enquiryRoutes);

router.use("/booking", bookingRoutes);

router.use("/", customerRoutes);

router.use("/wallet", walletRoutes);

router.use("/promo-codes", promoCodeRoutes);

router.use("/offers", offersRoutes);

router.use("/notifications", notifications);

router.use("/version/get", getVersions);

router.get("/config-keys", getConfigKeys);


export default router;