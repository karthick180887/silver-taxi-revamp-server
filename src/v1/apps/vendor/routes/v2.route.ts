import { Router } from "express";
import bookingRouter from "./v2/booking.route";

const router = Router();

router.use('/bookings', bookingRouter);

export default router;