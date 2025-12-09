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
import { distancePriceController } from "../controller/distancePrice.controller";
// import { calculationController } from "../controller/calculation.controller";
import { offersController } from "../controller/offers.controller";
import enquiryRoute from "../routers/enquiry.route";
import bookingRoutes from "../routers/booking.route";


const router = Router();

router.use("/enquiry", enquiryRoute);

router.use("/booking", bookingRoutes );

router.get("/services", getAllActiveServices);

router.get("/tariffs", getAllActiveTariffs);

router.get("/vehicles", getAllActiveVehicles);

router.get("/blogs", getAllBlogs);

router.get("/blogs/:id", getSingleBlog);

router.get("/dynamic-routes", getAllActiveDynamicRoutes);

router.get("/popular-routes", getAllActivePopularRoutes);

router.get("/company-profile", getCompanyProfile);

router.get("/offers", offersController);

router.post("/ip-address", storeIpAddress);

router.get("/include-exclude/service/:id", getIncludeAndExclude);

// router.post("/", calculationController);

router.post("/", distancePriceController);




export default router;
