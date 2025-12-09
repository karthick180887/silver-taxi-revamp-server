import { Router } from "express";
import { getAllVendorBookings, getVendorBookingById, getVendorSpecificBookings } from "../../controller/v2/booking.controller";

const router = Router();

router.get('/', getAllVendorBookings);

// IMPORTANT: /specific must come before /:id to avoid route conflicts
router.get('/specific', getVendorSpecificBookings);

router.get('/:id', getVendorBookingById);

export default router;