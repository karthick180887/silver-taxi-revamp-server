import { Router } from "express";
import {
    tripStarted, tripEnd,
    getTripSummary, tripOtpSend,
    tripCompleted, verifyTripPayment,
    getOrCreateRazorpayOrder,
    driverTripCancellation,
    saveGpsPoints,
    getGpsPoints
} from "../controller/trip.controller";


const router = Router();

// Trip summary
router.get("/summary/:id", getTripSummary);

// (Optional) Get or create Razorpay order for retry
router.get("/payment/order/:id", getOrCreateRazorpayOrder);

// GPS Points - Save (during trip) and Retrieve (on app restart)
router.post("/gps-points/:id", saveGpsPoints);
router.get("/gps-points/:id", getGpsPoints);

// Start trip
router.post("/start/:id", tripStarted);

// End trip (maybe before payment)
router.post("/end/:id", tripEnd);

// Complete trip (marks as complete + generates Razorpay order if needed)
router.post("/completed/:id", tripCompleted);

// Cancel trip
router.post("/cancel/:id", driverTripCancellation);

// Verify Razorpay payment after success
router.post("/payment/verify/:id", verifyTripPayment);

// OTP (with type as query param for clarity)
router.post("/send-otp/:type/:id", tripOtpSend); // ?type=driver



export default router