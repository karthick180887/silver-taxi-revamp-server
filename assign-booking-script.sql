-- Script to assign booking SLTB260102443 to driver with phone 9944226010
-- Run this in your PostgreSQL database

-- Step 1: Find the driver by phone number
SELECT 
    "driverId", 
    "adminId", 
    "name", 
    "phone",
    "isActive"
FROM drivers 
WHERE phone = '9944226010' 
   OR phone LIKE '%9944226010%'
   OR phone = '+919944226010'
   OR phone = '919944226010';

-- Step 2: Get the booking details
SELECT 
    "bookingId",
    "adminId",
    "driverId",
    "status",
    "driverAccepted",
    "assignAllDriver"
FROM bookings
WHERE "bookingId" = 'SLTB260102443';

-- Step 3: Update the booking (replace DRIVER_ID and ADMIN_ID with values from Step 1)
-- NOTE: This only updates the database. You still need to call the API to trigger notifications.
/*
UPDATE bookings
SET 
    "driverId" = 'DRIVER_ID_FROM_STEP_1',
    "driverName" = (SELECT name FROM drivers WHERE "driverId" = 'DRIVER_ID_FROM_STEP_1'),
    "driverPhone" = (SELECT phone FROM drivers WHERE "driverId" = 'DRIVER_ID_FROM_STEP_1'),
    "driverAccepted" = 'pending',
    "assignAllDriver" = false,
    "requestSentTime" = NOW(),
    "updatedAt" = NOW()
WHERE "bookingId" = 'SLTB260102443'
  AND "adminId" = 'ADMIN_ID_FROM_STEP_1';
*/

