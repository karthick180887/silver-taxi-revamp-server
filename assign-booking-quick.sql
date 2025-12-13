-- Quick SQL to find driver and get info needed for API call
-- Run this query first to get driverId and adminId

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

-- After getting driverId and adminId, use this PowerShell command:
-- (Replace DRIVER_ID and ADMIN_ID with actual values)

/*
$body = @{
    bookingId = "SLTB260102443"
    driverId = "DRIVER_ID_FROM_ABOVE"
    adminId = "ADMIN_ID_FROM_ABOVE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3060/admin/bookings/assign-driver" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
*/

