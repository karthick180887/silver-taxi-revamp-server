import { bookingCreate, bookingSave, bookingUpdate, getBookingInvoice } from "../controller/booking.controller";
import { Router } from "express";
import { getBookingStatus } from "../controller/website.controller";

const router = Router();

router.get("/booking-status/:id", getBookingStatus);

router.post("/", bookingCreate);

router.put("/:id", bookingUpdate);

router.post("/savebooking", bookingSave);

router.get("/invoice/:id", getBookingInvoice);

export default router;
