import { bookingCreate, bookingSave, bookingUpdate } from "../controller/booking.controller";
import { Router } from "express";
import { getBookingStatus } from "../controller/website.controller";

const router = Router();

router.get("/booking-status/:id", getBookingStatus);

router.post("/", bookingCreate);

router.put("/:id", bookingUpdate);

router.post("/savebooking", bookingSave);

export default router;
