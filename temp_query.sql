-- Check last location update timestamp for Karthick Selvam
SELECT "driverId", name, "isOnline", 
       "geoLocation"->>'lat' as lat,
       "geoLocation"->>'lng' as lng,
       "geoLocation"->>'lastUpdated' as last_location_update,
       "onlineTime",
       "offlineTime"
FROM drivers 
WHERE "driverId" = 'SLTD260105672';
