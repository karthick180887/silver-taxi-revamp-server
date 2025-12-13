# Admin Booking Assignment Endpoints

## Available Endpoints Under `/admin/bookings`

### 1. Assign Single Driver to Booking
**Endpoint:** `POST /admin/bookings/assign-driver`

**Purpose:** Assign a specific driver to a booking. Sends notification only to that driver via API (Socket.IO + FCM).

**Request Body:**
```json
{
  "bookingId": "SLTB260102443",
  "driverId": "SLTD260105672",
  "adminId": "admin-1"
}
```

**Query Parameters (alternative):**
- `adminId` can also be passed as query parameter: `?adminId=admin-1`

**What it does:**
- ✅ Assigns the booking to the specified driver
- ✅ Sets `assignAllDriver = false`
- ✅ Sets `driverAccepted = 'pending'`
- ✅ Sends Socket.IO notification (`NEW_TRIP_OFFER` event) to the driver
- ✅ Sends FCM push notification to the driver
- ✅ Creates driver notification record in database

**Response:**
```json
{
  "success": true,
  "message": "Driver assigned successfully",
  "data": { /* booking object */ }
}
```

---

### 2. Assign All Drivers (Broadcast)
**Endpoint:** `POST /admin/bookings/:id/assign-driver`

**Purpose:** Broadcast booking to all active drivers. Sends notifications to all active drivers.

**URL Parameters:**
- `:id` - The booking ID (e.g., `SLTB260102443`)

**Request Body:**
```json
{
  "adminId": "admin-1"
}
```

**Query Parameters (alternative):**
- `adminId` can also be passed as query parameter: `?adminId=admin-1`

**What it does:**
- ✅ Sets `assignAllDriver = true`
- ✅ Sets `driverId = null` (no specific driver assigned)
- ✅ Sets `driverAccepted = 'pending'`
- ✅ Sends Socket.IO notifications to ALL active drivers
- ✅ Sends FCM batch notifications to ALL active drivers
- ✅ Creates notification records for ALL active drivers

**Response:**
```json
{
  "success": true,
  "message": "Batch notifications sent to X drivers",
  "booking": { /* booking object */ }
}
```

---

## Other Available Endpoints Under `/admin/bookings`

### GET Endpoints:
- `GET /admin/bookings/dashboard` - Get dashboard data
- `GET /admin/bookings/vendor` - Get vendor bookings
- `GET /admin/bookings/recent` - Get recent bookings
- `GET /admin/bookings/vendor/:id` - Get bookings by vendor ID
- `GET /admin/bookings/driver/:id` - Get bookings by driver ID
- `GET /admin/bookings` - Get all bookings
- `GET /admin/bookings/:id` - Get booking by ID

### POST Endpoints:
- `POST /admin/bookings` - Create booking
- `POST /admin/bookings/assign-driver` - **Assign single driver** ⭐
- `POST /admin/bookings/:id/assign-driver` - **Assign all drivers (broadcast)** ⭐
- `POST /admin/bookings/manual-complete/:id` - Manually complete booking
- `POST /admin/bookings/toggle-changes/:id` - Toggle booking changes
- `POST /admin/bookings/fair-calculation` - Calculate fare

### PUT Endpoints:
- `PUT /admin/bookings/:id` - Update booking

### DELETE Endpoints:
- `DELETE /admin/bookings/:id` - Delete booking
- `DELETE /admin/bookings` - Delete multiple bookings

---

## For Your Use Case: Assign SLTB260102443 to Driver 9944226010

### Step 1: Find Driver by Phone
Run this SQL query:
```sql
SELECT "driverId", "adminId", "name", "phone", "isActive"
FROM drivers 
WHERE phone = '9944226010' 
   OR phone LIKE '%9944226010%'
   OR phone = '+919944226010'
   OR phone = '919944226010';
```

### Step 2: Call the API
Use the `POST /admin/bookings/assign-driver` endpoint:

**PowerShell:**
```powershell
$body = @{
    bookingId = "SLTB260102443"
    driverId = "DRIVER_ID_FROM_STEP_1"
    adminId = "ADMIN_ID_FROM_STEP_1"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3060/admin/bookings/assign-driver" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**cURL:**
```bash
curl -X POST "http://localhost:3060/admin/bookings/assign-driver" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "SLTB260102443",
    "driverId": "DRIVER_ID_FROM_STEP_1",
    "adminId": "ADMIN_ID_FROM_STEP_1"
  }'
```

**Node.js/TypeScript:**
```typescript
const response = await axios.post('http://localhost:3060/admin/bookings/assign-driver', {
  bookingId: 'SLTB260102443',
  driverId: 'DRIVER_ID_FROM_STEP_1',
  adminId: 'ADMIN_ID_FROM_STEP_1',
});
```

---

## Notification Flow

When you call `POST /admin/bookings/assign-driver`:

1. **Database Update:**
   - Booking is assigned to the driver
   - `driverId`, `driverName`, `driverPhone` are set
   - `assignAllDriver = false`
   - `driverAccepted = 'pending'`

2. **Notifications Sent (via API only):**
   - ✅ **Socket.IO**: Emits `NEW_TRIP_OFFER` event to the driver's socket room
   - ✅ **FCM Push**: Sends push notification to driver's FCM token
   - ✅ **Database**: Creates a notification record in `driver_notifications` table

3. **No SMS or Email** - Only API-based notifications (Socket.IO + FCM)

---

## Notes

- The endpoint validates that:
  - Driver exists and is active
  - Booking exists and is not completed/cancelled
  - Driver is not already assigned to another active booking
- If a previous driver was assigned, they are automatically unassigned
- All notifications are sent asynchronously (non-blocking)

