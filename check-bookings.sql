-- SQL Query to check new bookings in the database
-- Run this query in your PostgreSQL database

-- Count summary of new bookings
SELECT 
  COUNT(*) as total_new_bookings,
  COUNT(CASE WHEN "assignAllDriver" = true AND "driverId" IS NULL THEN 1 END) as broadcast_bookings,
  COUNT(CASE WHEN "driverId" IS NOT NULL THEN 1 END) as assigned_bookings
FROM bookings
WHERE status = 'Booking Confirmed'
  AND "driverAccepted" = 'pending'
  AND "deletedAt" IS NULL;

-- Detailed list of new bookings
SELECT 
  "bookingId",
  "driverId",
  "assignAllDriver",
  status,
  "driverAccepted",
  pickup,
  drop as "drop",
  "createdAt",
  "adminId"
FROM bookings
WHERE status = 'Booking Confirmed'
  AND "driverAccepted" = 'pending'
  AND "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT 20;

-- Check bookings for a specific driver (replace 'YOUR_DRIVER_ID' with actual driver ID)
-- SELECT 
--   "bookingId",
--   "driverId",
--   "assignAllDriver",
--   status,
--   "driverAccepted",
--   "createdAt"
-- FROM bookings
-- WHERE status = 'Booking Confirmed'
--   AND "driverAccepted" = 'pending'
--   AND "deletedAt" IS NULL
--   AND (
--     "driverId" = 'YOUR_DRIVER_ID' 
--     OR ("assignAllDriver" = true AND "driverId" IS NULL)
--   )
-- ORDER BY "createdAt" DESC;

