import express, { Router } from "express";
import { customerCreateBooking,specificBooking, getSingleBooking, cancelBooking } from "../controller/booking.controller";
const router: Router = express.Router();


router.post("/create", customerCreateBooking);

router.get("/specific-bookings", specificBooking);

router.get("/single-booking/:id", getSingleBooking);

router.put("/cancel/:id", cancelBooking);


export default router