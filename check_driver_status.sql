-- Check Driver Online Status Query
-- Run this to see which drivers are currently online/offline

-- 1. View all drivers with their online status for your admin
SELECT 
    "driverId",
    "name",
    "phone",
    "isOnline",
    "isActive",
    "adminVerified",
    "fcmToken" IS NOT NULL AS "has_fcm_token",
    "geoLocation" IS NOT NULL AS "has_location",
    "onlineTime",
    "offlineTime",
    "totalOnlineTime"
FROM "Drivers"
WHERE "adminId" = 'SLTA241231693'  -- Replace with your adminId
ORDER BY "isOnline" DESC, "isActive" DESC, "name";

-- 2. Count online vs offline drivers
SELECT 
    "isOnline",
    "isActive",
    COUNT(*) as count
FROM "Drivers"
WHERE "adminId" = 'SLTA241231693'
GROUP BY "isOnline", "isActive"
ORDER BY "isOnline" DESC, "isActive" DESC;

-- 3. Find drivers that should be available for assignment (Active + Online)
SELECT 
    "driverId",
    "name",
    "phone",
    "fcmToken"
FROM "Drivers"
WHERE "adminId" = 'SLTA241231693'
  AND "isActive" = true
  AND "isOnline" = true
  AND "adminVerified" = 'Approved';

-- 4. Quick fix: Set a specific driver online (for testing)
-- UPDATE "Drivers" 
-- SET "isOnline" = true, "onlineTime" = NOW()
-- WHERE "driverId" = 'DRIVER_ID_HERE';

-- 5. Quick fix: Set ALL active drivers online (USE WITH CAUTION)
-- UPDATE "Drivers" 
-- SET "isOnline" = true, "onlineTime" = NOW()
-- WHERE "adminId" = 'SLTA241231693'
--   AND "isActive" = true
--   AND "adminVerified" = 'Approved';
