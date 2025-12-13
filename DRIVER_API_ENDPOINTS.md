# Driver API Endpoints - Complete Mapping

## Summary
This document lists all driver-related API endpoints available in the backend and their corresponding Flutter API client methods.

## ✅ All Endpoints Wired

### Authentication (`/app/auth`)
- ✅ `GET /app/auth/access-token` → `getAccessToken()`
- ✅ `GET /app/auth/status/:id` → `getDriverStatus()`
- ✅ `POST /app/auth/login/:type` → `sendLoginOtp()`, `verifyLoginOtp()`
- ✅ `POST /app/auth/signup-otp/:type` → `sendSignupOtp()`, `verifySignupOtp()`
- ✅ `POST /app/auth/signup/:step` → `signupStep()`

### Driver Profile (`/app/driver`)
- ✅ `GET /app/driver/get-details` → `fetchDriverDetails()`
- ✅ `GET /app/driver/admin-get-details` → `fetchAdminDetails()`
- ✅ `PUT /app/driver/fcm-token/update` → `updateFCMToken()` (Fixed: was POST)
- ✅ `PUT /app/driver/location-update` → `updateLocation()` (Fixed: was POST)
- ✅ `PUT /app/driver/online-status` → `updateOnlineStatus()`
- ✅ `GET /app/driver/payment-details` → `getPaymentDetailsList()`
- ✅ `GET /app/driver/payment-details/:id` → `getPaymentDetail()`
- ✅ `POST /app/driver/payment-details` → `createPaymentDetails()`
- ✅ `PUT /app/driver/payment-details/:id` → `updatePaymentDetails()`
- ✅ `PUT /app/driver/payment-details/:id/:type` → `togglePaymentMethod()`

### Wallet (`/app/wallet`)
- ✅ `GET /app/wallet/` → `fetchWallet()`
- ✅ `GET /app/wallet/history` → `fetchWalletHistory()`, `getTransactionHistory()`
- ✅ `POST /app/wallet/amount/add` → `addWalletAmount()` (NEW)
- ✅ `POST /app/wallet/request/:type` → `requestPayout()`
- ✅ `GET /app/wallet/requests` → `getWalletRequests()`, `getPayoutRequests()`

### Bookings (`/app/booking`)
- ✅ `GET /app/booking/all` → `getAllBookings()`
- ✅ `GET /app/booking/specific` → `getBookingsByStatus()`
- ✅ `GET /app/booking/counts` → `fetchBookingCounts()`, `getTripCounts()`, `fetchTripCounts()`
- ✅ `GET /app/booking/single/:id` → `getSingleBooking()`, `getBookingDetails()` (NEW)
- ✅ `POST /app/booking/accept/:id` → `acceptOrRejectBooking()`, `acceptTrip()`, `acceptBooking()`, `respondBooking()`, `rejectBooking()` (Consolidated)

### V2 Bookings (`/app/v2/booking`)
- ✅ `GET /app/v2/booking/all` → `getV2AllBookings()` (NEW)
- ✅ `GET /app/v2/booking/specific` → `getV2BookingsByStatus()` (NEW)
- ✅ `GET /app/v2/booking/single/:id` → `getV2SingleBooking()` (NEW)

### Trips (`/app/trip`)
- ✅ `GET /app/trip/summary/:id` → `getTripSummary()`
- ✅ `GET /app/trip/payment/order/:id` → `getOrCreateRazorpayOrder()` (NEW)
- ✅ `POST /app/trip/start/:id` → `startTrip()`
- ✅ `POST /app/trip/end/:id` → `endTrip()`
- ✅ `POST /app/trip/completed/:id` → `completeTrip()`
- ✅ `POST /app/trip/cancel/:id` → `cancelTrip()`
- ✅ `POST /app/trip/payment/verify/:id` → `verifyTripPayment()`
- ✅ `POST /app/trip/send-otp/:type/:id` → `sendOtp()`, `sendTripOtp()`

### Vehicles (`/app/vehicle`)
- ✅ `GET /app/vehicle/types` → `getVehicleTypes()`
- ✅ `GET /app/vehicle/get-details` → `getVehicles()`, `getDriverVehicles()`, `getVehicleList()`
- ✅ `POST /app/vehicle/add` → `createVehicle()`, `addVehicle()` (Fixed path)
- ✅ `PUT /app/vehicle/update` → `updateVehicle()` (Fixed: no vehicleId in path)
- ✅ `PUT /app/vehicle/change-status` → `setVehicleStatus()` (NEW)
- ✅ `DELETE /app/vehicle/types/:type` → `deleteVehicleType()` (NEW)

### Notifications (`/app/notification`)
- ✅ `GET /app/notification/` → `getNotifications()`, `getAllNotifications()`
- ✅ `GET /app/notification/all` → `getNotifications()`
- ✅ `GET /app/notification/offset` → (via getAllOffsetNotification in backend)
- ✅ `GET /app/notification/:id` → `getSingleNotification()` (NEW)
- ✅ `PUT /app/notification/read-all` → `markAllNotificationsRead()`
- ✅ `PUT /app/notification/read/:id` → `markNotificationAsRead()` (Fixed: was PATCH)
- ✅ `DELETE /app/notification/delete` → `deleteNotifications()`

### Analytics (`/app/analytics`)
- ✅ `GET /app/analytics/get` → `getAnalytics()`, `getDriverAnalytics()` (Fixed path)
- ✅ `GET /app/analytics/get/graph` → `getEarningsGraph()` (Fixed path)

### Earnings (`/app/earnings`)
- ✅ `GET /app/earnings/get` → `getEarnings()` (Fixed path)

### Common (`/app/*`)
- ✅ `GET /app/charges` → `getCharges()`, `getChargesByCity()`
- ✅ `GET /app/states` → `getStates()` (Fixed path)
- ✅ `GET /app/cities` → `getCities()` (Fixed path)
- ✅ `GET /app/config-keys` → `getConfigKeys()` (Fixed path)
- ✅ `GET /app/version/get` → `getVersion()` (NEW)

### Image Upload (`/app/image-upload`)
- ✅ `POST /app/image-upload` → `uploadImage()`

### V2 Image Upload (`/app/v2/image-upload`)
- ✅ `POST /app/v2/image-upload` → (can use uploadImage with v2 path if needed)

## 🔧 Fixes Applied

1. **HTTP Method Corrections:**
   - `updateFCMToken()`: Changed from POST to PUT
   - `updateLocation()`: Changed from POST to PUT
   - `markNotificationAsRead()`: Changed from PATCH to PUT

2. **Endpoint Path Corrections:**
   - `getAnalytics()`: `/app/driver/analytics` → `/app/analytics/get`
   - `getEarnings()`: `/app/driver/earnings` → `/app/earnings/get`
   - `getEarningsGraph()`: `/app/driver/analytics` → `/app/analytics/get/graph`
   - `getStates()`: `/app/common/state/all` → `/app/states`
   - `getCities()`: `/app/common/city/all/:stateId` → `/app/cities`
   - `getConfigKeys()`: `/app/config/keys` → `/app/config-keys`
   - `createVehicle()`: `/app/vehicle` → `/app/vehicle/add`
   - `updateVehicle()`: `/app/vehicle/:id` → `/app/vehicle/update`
   - `getTripCounts()`: `/app/trip/counts` → `/app/booking/counts`

3. **Removed Duplicates:**
   - Removed duplicate `getDriverVehicles()` definition
   - Consolidated `acceptTrip()`, `acceptBooking()`, `respondBooking()`, `rejectBooking()` into `acceptOrRejectBooking()`
   - Consolidated `getTransactionHistory()` and `fetchWalletHistory()` (aliases)
   - Consolidated `getPayoutRequests()` and `getWalletRequests()` (aliases)

4. **Deprecated Non-Existent Endpoints:**
   - `getTripOtp()` - Backend doesn't have this endpoint
   - `getTripDetails()` - Use `getTripSummary()` or `getSingleBooking()` instead
   - `getAllTrips()` - Use `getAllBookings()` instead
   - `deleteVehicle()` - Backend doesn't have vehicle deletion endpoint
   - `getMonthlyEarnings()` - Backend doesn't have this endpoint
   - `getNotificationSettings()` - Backend doesn't have notification settings endpoints

5. **New Endpoints Added:**
   - `getSingleBooking()` - Get single booking details
   - `getV2AllBookings()` - V2 booking list
   - `getV2BookingsByStatus()` - V2 bookings by status
   - `getV2SingleBooking()` - V2 single booking
   - `getOrCreateRazorpayOrder()` - Get/create Razorpay order for trip
   - `getSingleNotification()` - Get single notification
   - `setVehicleStatus()` - Change vehicle status
   - `deleteVehicleType()` - Delete vehicle type
   - `addWalletAmount()` - Add amount to wallet
   - `getVersion()` - Get app version

## 📝 Notes

- All endpoints now match the backend routes exactly
- Duplicate methods have been consolidated with aliases for backward compatibility
- Non-existent endpoints have been deprecated with clear messages
- All HTTP methods match the backend expectations

