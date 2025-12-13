# Vendor API Endpoints - Flutter Wiring Status

This vendor Flutter client (`vendor_app/lib/api_client.dart`) wires **every documented vendor endpoint** without touching the backend.

- Base URL: `ApiConfig.baseUrl` from `shared/lib/api_config.dart`
- Auth: bearer token required after `/vendor/auth/login`

## ✅ Auth
- `POST /vendor/auth/login` → `login()`

## ✅ Vendor
- `GET /vendor/profile` → `fetchProfile()`
- `GET /vendor/transactions` → `fetchTransactions()`
- `POST /vendor/fcm-token` → `updateFcmToken()`
- `POST /vendor/payment-details` → `createPaymentDetails()`
- `GET /vendor/payment-details` → `listPaymentDetails()`
- `GET /vendor/payment-details/:id` → `getPaymentDetail()`
- `PUT /vendor/payment-details/:id` → `updatePaymentDetail()`
- `PATCH /vendor/payment-details/:id/:type` → `togglePaymentDetail()`
- `GET /vendor/config-keys` → `getConfigKeys()`
- `GET /vendor/version/get` → `getVersion()`

## ✅ Bookings (v1)
- `GET /vendor/bookings` → `getAllBookings()`
- `GET /vendor/bookings/specific` → `getSpecificBookings()`
- `GET /vendor/bookings/counts` → `getBookingCounts()`
- `GET /vendor/bookings/drivers` → `getDrivers()`
- `GET /vendor/bookings/drivers-location` → `getDriversWithLocation()`
- `GET /vendor/bookings/driver/:phone` → `getDriverByPhone()`
- `GET /vendor/bookings/vehicle-types` → `getVehicleTypes()`
- `GET /vendor/bookings/hourly-packages` → `getHourlyPackages()`
- `POST /vendor/bookings` → `createBooking()`
- `POST /vendor/bookings/:id/assign-all-drivers` → `assignAllDrivers()`
- `GET /vendor/bookings/:id` → `getBookingById()`
- `POST /vendor/bookings/:id/cancel` → `cancelBooking()`
- `PUT /vendor/bookings/:id` → `updateBooking()`
- `DELETE /vendor/bookings/:id` → `deleteBooking()`
- `POST /vendor/bookings/assign-driver` → `assignDriver()`
- `POST /vendor/bookings/toggle-changes/:id` → `toggleChanges()`

## ✅ Bookings (v2)
- `GET /vendor/v2/bookings` → `getAllBookingsV2()`
- `GET /vendor/v2/bookings/specific` → `getSpecificBookingsV2()`
- `GET /vendor/v2/bookings/:id` → `getBookingByIdV2()`

## ✅ Estimation
- `POST /vendor/estimation` → `estimateFare()`

## Usage Notes
- Set API host in `shared/lib/api_config.dart` to match your server.
- Paste a valid vendor JWT in the demo screen (`vendor_app/lib/main.dart`) to trigger calls.
- Methods return `ApiResult { success, message, data, statusCode }` for easy handling.

