import { Router } from "express";
import {
    getAllActiveServices,
    getAllActiveTariffs,
    getAllActiveVehicles,
    storeIpAddress,
    getAllActiveDynamicRoutes,
    getCompanyProfile,
    getBookingStatus,
    getIncludeAndExclude,
    getAllActivePopularRoutes,
    getAllBlogs,
    getSingleBlog
} from "../controller/website.controller";
import { bookingCreate, bookingUpdate } from "../controller/booking.controller";
import { redisConfigController } from "../controller/config.controller";
import { distancePriceController } from "../controller/distancePrice.controller";
// import { calculationController } from "../controller/calculation.controller";
import { enquiryController } from "../controller/enquiry.controller";
import { offersController } from "../controller/offers.controller";
import bookingRouter from "./booking.route"
import enquiryRouter from "./enquiry.route"
import websiteRouter from "./website.route"

const router = Router();

router.use("/booking", bookingRouter)

router.use("/enquiry", enquiryRouter);

router.use("/", websiteRouter);

export default router;
    