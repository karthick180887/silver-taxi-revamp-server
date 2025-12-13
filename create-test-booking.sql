-- Create a test booking directly in the database
-- This will create a booking with status "Booking Confirmed" and assignAllDriver = true
-- so it will be visible to all drivers as a new trip offer

INSERT INTO bookings (
    "adminId",
    "name",
    "email",
    "phone",
    "pickup",
    "drop",
    "pickupDateTime",
    "serviceType",
    "vehicleType",
    "status",
    "type",
    "paymentMethod",
    "paymentStatus",
    "estimatedAmount",
    "discountAmount",
    "finalAmount",
    "advanceAmount",
    "upPaidAmount",
    "distance",
    "assignAllDriver",
    "driverAccepted",
    "createdBy",
    "startOtp",
    "endOtp",
    "createdAt",
    "updatedAt"
) VALUES (
    'admin-1',  -- Adjust adminId if needed
    'Test Customer',
    'test@example.com',
    '9876543210',
    'Test Pickup Location, Test City',
    'Test Drop Location, Test City',
    NOW() + INTERVAL '2 hours',  -- Pickup in 2 hours
    'One way',
    'Sedan',
    'Booking Confirmed',
    'Manual',
    'Cash',
    'Unpaid',
    500,
    0,
    500,
    0,
    500,
    10,
    true,  -- Broadcast to all drivers
    'pending',
    'Admin',
    '1234',
    '5678',
    NOW(),
    NOW()
)
RETURNING "bookingId", "id", "adminId", "status", "assignAllDriver", "driverAccepted";

