import { Router } from "express";
import { getAllBooking, getSingleBooking, specificBooking } from "../../controller/v2/booking.controller";

const router = Router();

router.get("/all", getAllBooking);

router.get("/specific", specificBooking);

router.get("/single/:id", getSingleBooking);


export default router