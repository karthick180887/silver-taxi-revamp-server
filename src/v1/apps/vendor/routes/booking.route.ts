import express from "express";
import {
    getAllVendorBookings,
    getVendorBookingById,
    createVendorBookingController,
    updateVendorBookingController,
    deleteVendorBooking,
    getVendorSpecificBookings,
    fetchDrivers,
    assignDriver,
    assignAllDrivers,
    getVehicleTypes,
    toggleChanges,
    getHourlyPackages,
    fetchDriversWithLocation,
    getVendorSpecificBookingCounts,
    cancelBookingByVendor
} from "../controller/booking.controller";

const router = express.Router()

// ==================== GET ROUTES (Specific routes first) ====================

// Get all vendor bookings
router.get('/', getAllVendorBookings)

// Get specific vendor bookings by status
router.get('/specific', getVendorSpecificBookings)

router.get("/counts", getVendorSpecificBookingCounts);

// Fetch all drivers
router.get('/drivers', fetchDrivers)

// Fetch drivers with location
router.get('/drivers-location', fetchDriversWithLocation)

// Fetch drivers by phone (auto-suggestion)
router.get('/driver/:phone', fetchDrivers)

// Get vehicle types
router.get('/vehicle-types', getVehicleTypes)

router.get("/hourly-packages", getHourlyPackages);

// ==================== POST ROUTES (Specific routes first) ====================

// Create a new vendor booking with precomputed calculation
router.post('/', createVendorBookingController)

// Assign all drivers to a booking
router.post('/:id/assign-all-drivers', assignAllDrivers)

// ==================== ROUTES WITH ID PARAMETER ====================

// Get a single vendor booking by ID
router.get('/:id', getVendorBookingById)

// Cancel a vendor booking
router.post('/:id/cancel', cancelBookingByVendor)

// Update a vendor booking
router.put('/:id', updateVendorBookingController)


// Update a vendor booking with automatic calculation
// router.put('/:id/with-calculation', updateVendorBookingWithCalculation)

// Delete a vendor booking
router.delete('/:id', deleteVendorBooking)

// Assign specific driver to a booking
router.post('/assign-driver', assignDriver)

router.post("/toggle-changes/:id", toggleChanges);


export default router;
