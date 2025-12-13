# Assign Booking SLTB260102443 to Driver 9944226010

## Quick Steps

### Step 1: Find Driver by Phone
Run this SQL query in your PostgreSQL database:

```sql
SELECT "driverId", "adminId", "name", "phone", "isActive"
FROM drivers 
WHERE phone = '9944226010' 
   OR phone LIKE '%9944226010%'
   OR phone = '+919944226010'
   OR phone = '919944226010';
```

### Step 2: Call the API
Once you have the `driverId` and `adminId` from Step 1, use one of these methods:

#### Option A: PowerShell (Windows)
```powershell
$body = @{
    bookingId = "SLTB260102443"
    driverId = "PASTE_DRIVER_ID_HERE"
    adminId = "PASTE_ADMIN_ID_HERE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3060/admin/bookings/assign-driver" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

#### Option B: cURL
```bash
curl -X POST "http://localhost:3060/admin/bookings/assign-driver" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "SLTB260102443",
    "driverId": "PASTE_DRIVER_ID_HERE",
    "adminId": "PASTE_ADMIN_ID_HERE"
  }'
```

#### Option C: Use the PowerShell Script
1. Edit `assign-booking-quick.ps1`
2. Update `$DRIVER_ID` and `$ADMIN_ID` with values from Step 1
3. Run: `.\assign-booking-quick.ps1`

## What Happens

When you call the API, it will:
- ✅ Assign the booking to the specific driver
- ✅ Send Socket.IO notification (`NEW_TRIP_OFFER` event) to that driver only
- ✅ Send FCM push notification to that driver only
- ✅ Create driver notification record in database

## API Endpoint Details

**Endpoint:** `POST /admin/bookings/assign-driver`

**Request Body:**
```json
{
  "bookingId": "SLTB260102443",
  "driverId": "DRIVER_ID_FROM_SQL",
  "adminId": "ADMIN_ID_FROM_SQL"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver assigned successfully",
  "data": { /* booking object */ }
}
```

## Verification

After assignment, you can verify by:
1. Checking the booking in database:
```sql
SELECT "bookingId", "driverId", "driverName", "driverPhone", "driverAccepted", "assignAllDriver"
FROM bookings
WHERE "bookingId" = 'SLTB260102443';
```

2. The driver should receive:
   - Socket.IO notification (if app is connected)
   - FCM push notification
   - Notification in the app's notification list

