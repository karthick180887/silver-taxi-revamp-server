import { Router } from "express";
import { getAllBooking, getSingleBooking, specificBooking, acceptOrRejectBooking, specificBookingCount } from "../controller/booking.controller";

const router = Router();

router.get("/all", getAllBooking);

router.get("/specific", specificBooking);

router.get("/counts", specificBookingCount);

router.get("/single/:id", getSingleBooking);

router.post("/accept/:id", acceptOrRejectBooking);


export default router