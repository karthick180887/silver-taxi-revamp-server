-- Fix orphaned vendorId in bookings table
-- This sets vendorId to NULL for bookings that reference non-existent vendors

UPDATE bookings 
SET "vendorId" = NULL 
WHERE "vendorId" IS NOT NULL 
AND "vendorId" NOT IN (SELECT "vendorId" FROM vendor WHERE "vendorId" IS NOT NULL);
