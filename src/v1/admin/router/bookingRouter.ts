import { Router } from "express";
import {
    createBooking,
    deleteBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    multiDeleteBookings,
    toggleChanges,
    fairCalculation,
    assignDriver,
    getVendorBookings,
    getDriverBookings,
    assignAllDrivers,
    getVendorBookingsById,
    getBookingDashboard,
    getRecentBookings
} from "../controller/bookingController";


const router = Router();

router.get("/dashboard", getBookingDashboard);

router.get("/recent", getRecentBookings);

router.get("/vendor", getVendorBookings);

router.get("/vendor/:id", getVendorBookingsById);

router.get("/driver/:id", getDriverBookings);

router.get("/", getAllBookings);

router.get("/:id", getBookingById);

router.post("/", createBooking);

router.post("/assign-driver", assignDriver);

router.post("/:id/assign-driver", assignAllDrivers);

router.put("/:id", updateBooking);

router.delete("/:id", deleteBooking);

router.delete("/", multiDeleteBookings);

router.post("/toggle-changes/:id", toggleChanges);

router.post("/fair-calculation", fairCalculation);

export default router;