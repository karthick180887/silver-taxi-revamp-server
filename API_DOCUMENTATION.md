# Silver Taxi API Documentation

Complete list of all APIs organized by category.

## Base URLs
- **Admin APIs**: `/v1/*`
- **Driver App APIs**: `/app/*`
- **Customer App APIs**: `/customer/*`
- **Vendor App APIs**: `/vendor/*`
- **Website APIs**: `/website/*`
- **Public APIs**: `/global/*`
- **Auth APIs**: `/auth/*`

---

## 1. ADMIN APIs (`/v1/*`)

### Authentication (`/auth`)
- `POST /auth/login` - Admin login
- `POST /auth/admin/login` - Admin login (alternative)
- `POST /auth/vendor/login` - Vendor login via admin
- `POST /auth/register` - Admin registration

### Bookings (`/v1/bookings`)
- `GET /v1/bookings/dashboard` - Get dashboard data
- `GET /v1/bookings/vendor` - Get vendor bookings
- `GET /v1/bookings/recent` - Get recent bookings
- `GET /v1/bookings/vendor/:id` - Get bookings by vendor ID
- `GET /v1/bookings/driver/:id` - Get bookings by driver ID
- `GET /v1/bookings` - Get all bookings
- `GET /v1/bookings/:id` - Get booking by ID
- `POST /v1/bookings` - Create booking
- `POST /v1/bookings/assign-driver` - Assign driver to booking
- `POST /v1/bookings/:id/assign-driver` - Assign all drivers to booking
- `PUT /v1/bookings/:id` - Update booking
- `POST /v1/bookings/manual-complete/:id` - Manually complete booking
- `DELETE /v1/bookings/:id` - Delete booking
- `DELETE /v1/bookings` - Delete multiple bookings
- `POST /v1/bookings/toggle-changes/:id` - Toggle booking changes
- `POST /v1/bookings/fair-calculation` - Calculate fare

### Drivers (`/v1/drivers`)
- `GET /v1/drivers/active` - Get active drivers
- `GET /v1/drivers/wallet/transactions` - Get all driver wallet transactions
- `GET /v1/drivers/wallet/requests` - Get all driver wallet requests
- `GET /v1/drivers/wallet/request/:id` - Get driver wallet request by ID
- `GET /v1/drivers/wallet/:id/transactions` - Get driver wallet transactions by driver ID
- `GET /v1/drivers/wallet/:id` - Get driver wallet by ID
- `POST /v1/drivers/wallet/add/:id` - Add amount to driver wallet
- `POST /v1/drivers/wallet/minus/:id` - Deduct amount from driver wallet
- `POST /v1/drivers/wallet/bulk-request` - Bulk wallet request
- `PUT /v1/drivers/verification/:id` - Update driver verification status
- `PUT /v1/drivers/wallet/request/:id` - Approve/reject driver wallet request
- `GET /v1/drivers` - Get all drivers
- `GET /v1/drivers/location` - Get all drivers with location
- `POST /v1/drivers` - Create driver (with license image upload)
- `PUT /v1/drivers/:id` - Update driver
- `DELETE /v1/drivers/:id` - Delete driver
- `DELETE /v1/drivers` - Delete multiple drivers
- `GET /v1/drivers/:id` - Get driver by ID

### Customers (`/v1/customers`)
- `POST /v1/customers` - Create customer
- `GET /v1/customers` - Get all customers
- `GET /v1/customers/vendor` - Get vendor customers
- `GET /v1/customers/:id` - Get customer by ID
- `POST /v1/customers` - Get admin and vendor customers (POST)
- `DELETE /v1/customers/:id` - Delete customer
- `DELETE /v1/customers` - Delete multiple customers
- `GET /v1/customers/bookings/:id` - Get bookings by customer ID

### Vendors (`/v1/vendors`)
- `GET /v1/vendors` - Get all vendors
- `GET /v1/vendors/wallet-amount` - Get vendor wallet amount
- `GET /v1/vendors/wallet/transactions` - Get all vendor wallet transactions
- `GET /v1/vendors/wallet/transactions/history` - Get vendor wallet transaction history
- `GET /v1/vendors/wallet/:id/transactions` - Get vendor wallet transactions by vendor ID
- `GET /v1/vendors/wallet/:id` - Get vendor wallet by ID
- `GET /v1/vendors/bank-details/:id` - Get vendor UPI/bank details
- `POST /v1/vendors/wallet/add/:id` - Add amount to vendor wallet
- `POST /v1/vendors/wallet/minus/:id` - Deduct amount from vendor wallet
- `POST /v1/vendors/wallet/:id/transactions` - Update wallet transaction status
- `PUT /v1/vendors/toggle-changes/:id` - Toggle vendor status
- `POST /v1/vendors` - Create vendor
- `PUT /v1/vendors/:id` - Update vendor
- `DELETE /v1/vendors/:id` - Delete vendor
- `DELETE /v1/vendors` - Delete multiple vendors
- `GET /v1/vendors/:id` - Get vendor by ID

### Vehicles (`/v1/vehicles`)
- `GET /v1/vehicles` - Get all vehicles
- `GET /v1/vehicles/admin` - Get all vehicles (admin view)
- `GET /v1/vehicles/active` - Get active vehicles
- `GET /v1/vehicles/types` - Get vehicle types
- `GET /v1/vehicles/:id` - Get vehicle by ID
- `POST /v1/vehicles` - Create vehicle (with image upload)
- `POST /v1/vehicles/types/add` - Create vehicle type
- `PUT /v1/vehicles/types/accept/:name` - Accept vehicle type
- `PUT /v1/vehicles/:id` - Update vehicle
- `DELETE /v1/vehicles/:id` - Delete vehicle
- `DELETE /v1/vehicles/types/:name` - Delete vehicle type
- `DELETE /v1/vehicles` - Delete multiple vehicles

### Services (`/v1/services`)
- `GET /v1/services` - Get all services
- `GET /v1/services/by-name` - Get service by name
- `GET /v1/services/:id` - Get service by ID
- `POST /v1/services` - Create service
- `PUT /v1/services` - Update service (without ID)
- `PUT /v1/services/:id` - Update service
- `DELETE /v1/services/:id` - Delete service
- `GET /v1/services/packages/:type` - Get packages by type
- `POST /v1/services/packages` - Create package
- `DELETE /v1/services/packages/:id` - Delete package
- `GET /v1/services/packages/vehicle/:vehicleId/service/:serviceId/:type` - Get package tariff by vehicle and service
- `GET /v1/services/packages/vendor/vehicle/:vehicleId/service/:serviceId/:type` - Get vendor package tariff

### Tariffs (`/v1/tariffs`)
- `GET /v1/tariffs` - Get all tariffs
- `GET /v1/tariffs/vendor` - Get vendor tariffs
- `GET /v1/tariffs/:id` - Get tariff by ID
- `POST /v1/tariffs` - Create tariff
- `PUT /v1/tariffs/:id` - Update tariff
- `DELETE /v1/tariffs/:id` - Delete tariff
- `GET /v1/tariffs/vehicle/:vehicleId/service/:serviceId/createdBy/:createdBy` - Get tariff by vehicle and service
- `GET /v1/tariffs/service/:serviceId` - Get tariff by service ID
- `GET /v1/tariffs/active` - Get all active tariffs

### Enquiries (`/v1/enquiries`)
- `GET /v1/enquiries/vendor` - Get vendor enquiries
- `GET /v1/enquiries` - Get all enquiries
- `POST /v1/enquiries` - Create enquiry
- `GET /v1/enquiries/:id` - Get enquiry by ID
- `PUT /v1/enquiries/:id` - Update enquiry
- `DELETE /v1/enquiries/:id` - Delete enquiry
- `DELETE /v1/enquiries` - Delete multiple enquiries
- `POST /v1/enquiries/toggle-changes/:id` - Toggle enquiry changes

### Invoices (`/v1/invoices`)
- `GET /v1/invoices` - Get all invoices
- `GET /v1/invoices/vendor` - Get vendor invoices
- `GET /v1/invoices/:id` - Get invoice by ID
- `POST /v1/invoices` - Create invoice
- `PUT /v1/invoices/:id` - Update invoice
- `DELETE /v1/invoices/:id` - Delete invoice
- `DELETE /v1/invoices` - Delete multiple invoices
- `PUT /v1/invoices/toggle-changes/:id` - Toggle invoice changes

### Offers (`/v1/offers`)
- `GET /v1/offers` - Get all offers
- `GET /v1/offers/:id` - Get offer by ID
- `POST /v1/offers` - Create offer (with banner image upload)
- `PUT /v1/offers/:id` - Update offer
- `DELETE /v1/offers/:id` - Delete offer
- `DELETE /v1/offers` - Delete multiple offers
- `POST /v1/offers/toggle-changes/:id` - Toggle offer changes

### Promo Codes (`/v1/promo-codes`)
- `GET /v1/promo-codes` - Get all promo codes
- `GET /v1/promo-codes/:id` - Get promo code by ID
- `POST /v1/promo-codes` - Create promo code (with banner image upload)
- `PUT /v1/promo-codes/:id` - Update promo code
- `DELETE /v1/promo-codes/:id` - Delete promo code
- `DELETE /v1/promo-codes` - Delete multiple promo codes
- `POST /v1/promo-codes/toggle-changes/:id` - Toggle promo code changes

### Notifications (`/v1/notifications`)
- `GET /v1/notifications` - Get all notifications
- `GET /v1/notifications/offset` - Get notifications with offset
- `PUT /v1/notifications/read-all` - Mark all notifications as read
- `PUT /v1/notifications/read/:id` - Mark notification as read
- `GET /v1/notifications/vendor` - Get vendor notifications
- `GET /v1/notifications/vendor/offset` - Get vendor notifications with offset
- `PUT /v1/notifications/vendor/read-all` - Mark all vendor notifications as read
- `POST /v1/notifications/custom` - Create custom notification (with image upload)
- `PUT /v1/notifications/custom/:templateId` - Edit custom notification (with image upload)
- `GET /v1/notifications/custom` - Get all custom notifications
- `GET /v1/notifications/custom/:templateId` - Get custom notification by ID
- `DELETE /v1/notifications/custom/:templateId` - Delete custom notification
- `POST /v1/notifications/custom/:templateId/send` - Send custom notification
- `POST /v1/notifications/test` - Test notification endpoint

### Company Profile (`/v1/company-profile`)
- `GET /v1/company-profile` - Get all company profiles
- `GET /v1/company-profile/vendor` - Get vendor company profiles
- `GET /v1/company-profile/:id` - Get company profile by ID
- `POST /v1/company-profile` - Create company profile (with logo upload)
- `PUT /v1/company-profile/:id` - Update company profile
- `DELETE /v1/company-profile/:id` - Delete company profile

### Payment Transactions (`/v1/payment-transactions`)
- (Routes defined in paymentTransRouter)

### Wallet Transactions (`/v1/wallet-transactions`)
- (Routes defined in transactionRouter)

### Popular Routes (`/v1/popular-routes`)
- (Routes defined in popularRoutesRouter)

### Blogs (`/v1/blogs`)
- (Routes defined in blogRouter)

### All Includes (`/v1/all-includes`)
- (Routes defined in allIncludesRouter)

### Dynamic Routes (`/v1/dynamic-routes`)
- (Routes defined in dynamicRoutesRouter)

### All Price Changes (`/v1/all-price-changes`)
- (Routes defined in allPriceChangesRouter)

### Permit Charges (`/v1/permit-charges`)
- (Routes defined in permitChargesRouter)

### IP Tracking (`/v1/ip-tracking`)
- (Routes defined in ipTrackingRouter)

### Toggles (`/v1/toggles-change`)
- (Routes defined in toggleRouter)

### Image Upload (`/v1/image-upload`)
- `POST /v1/image-upload` - Upload company profile image

### Column Visibility (`/v1/column-visibility`)
- `GET /v1/column-visibility/:table` - Get column visibility
- `POST /v1/column-visibility/:table` - Set column visibility

### Config Keys (`/v1/config-keys`)
- `GET /v1/config-keys` - Get all config keys
- `POST /v1/config-keys` - Store config keys

### Test Endpoint (`/v1/test-document-expiry`)
- `GET /v1/test-document-expiry` - Test document expiry check

---

## 2. DRIVER APP APIs (`/app/*`)

### Authentication (`/app/auth`)
- `GET /app/auth/access-token` - Get access token
- `GET /app/auth/status/:id` - Get driver status
- `POST /app/auth/login/:type` - Driver login
- `POST /app/auth/signup-otp/:type` - Driver signup OTP
- `POST /app/auth/signup/:step` - Driver signup steps

### Driver (`/app/driver`)
- `GET /app/driver/get-details` - Get driver details
- `GET /app/driver/admin-get-details` - Get admin driver details
- `PUT /app/driver/fcm-token/update` - Update FCM token
- `PUT /app/driver/location-update` - Update driver location
- `PUT /app/driver/online-status` - Update online status
- `GET /app/driver/payment-details` - Get payment details
- `GET /app/driver/payment-details/:id` - Get payment details by ID
- `POST /app/driver/payment-details` - Create payment details
- `PUT /app/driver/payment-details/:id` - Update payment details
- `PUT /app/driver/payment-details/:id/:type` - Toggle payment details

### Bookings (`/app/booking`)
- `GET /app/booking/all` - Get all bookings
- `GET /app/booking/specific` - Get specific bookings
- `GET /app/booking/counts` - Get booking counts
- `GET /app/booking/single/:id` - Get single booking by ID
- `POST /app/booking/accept/:id` - Accept or reject booking

### Bookings V2 (`/app/v2/booking`)
- `GET /app/v2/booking/all` - Get all bookings (v2)
- `GET /app/v2/booking/specific` - Get specific bookings (v2)
- `GET /app/v2/booking/single/:id` - Get single booking by ID (v2)

### Trips (`/app/trip`)
- `GET /app/trip/summary/:id` - Get trip summary
- `GET /app/trip/payment/order/:id` - Get or create Razorpay order
- `POST /app/trip/start/:id` - Start trip
- `POST /app/trip/end/:id` - End trip
- `POST /app/trip/completed/:id` - Complete trip
- `POST /app/trip/cancel/:id` - Cancel trip (driver cancellation)
- `POST /app/trip/payment/verify/:id` - Verify trip payment
- `POST /app/trip/send-otp/:type/:id` - Send OTP (type=driver)

### Wallet (`/app/wallet`)
- `GET /app/wallet` - Get wallet
- `GET /app/wallet/history` - Get wallet transaction history
- `POST /app/wallet/amount/add` - Add wallet amount
- `POST /app/wallet/request/:type` - Request wallet (type: add/minus)
- `GET /app/wallet/requests` - Get wallet requests

### Vehicle (`/app/vehicle`)
- `GET /app/vehicle/types` - Get vehicle types
- `GET /app/vehicle/get-details` - Get vehicle details
- `POST /app/vehicle/add` - Add vehicle
- `PUT /app/vehicle/update` - Update vehicle
- `PUT /app/vehicle/change-status` - Change vehicle status
- `DELETE /app/vehicle/types/:type` - Delete vehicle type

### Notifications (`/app/notification`)
- `GET /app/notification/all` - Get all notifications
- `GET /app/notification/offset` - Get notifications with offset
- `GET /app/notification/:id` - Get single notification
- `PUT /app/notification/read-all` - Mark all as read
- `PUT /app/notification/read/:id` - Mark as read
- `DELETE /app/notification/delete` - Bulk delete notifications

### Analytics (`/app/analytics`)
- `GET /app/analytics/get` - Get driver analytics
- `GET /app/analytics/get/graph` - Get graph earnings

### Earnings (`/app/earnings`)
- `GET /app/earnings/get` - Get driver earnings

### Image Upload (`/app/image-upload`)
- `POST /app/image-upload` - Upload image

### Other Endpoints
- `GET /app/charges` - Get charges
- `GET /app/states` - Get all states
- `GET /app/cities` - Get cities
- `GET /app/config-keys` - Get config keys
- `GET /app/version/get` - Get versions

---

## 3. CUSTOMER APP APIs (`/customer/*`)

### Authentication (`/customer/auth`)
- `POST /customer/auth/login/:type` - Customer login
- `POST /customer/auth/signup-otp/:type` - Customer signup OTP

### Customer (`/customer`)
- `GET /customer/get-details` - Get customer details
- `GET /customer/get-destinations` - Get top destinations
- `GET /customer/services` - Get services
- `GET /customer/admin-details` - Get admin details
- `POST /customer/profile-update` - Update profile
- `PUT /customer/fcm-update` - Update FCM token

### Bookings (`/customer/booking`)
- `POST /customer/booking/create` - Create booking
- `GET /customer/booking/specific-bookings` - Get specific bookings
- `GET /customer/booking/single-booking/:id` - Get single booking by ID
- `PUT /customer/booking/cancel/:id` - Cancel booking

### Wallet (`/customer/wallet`)
- `GET /customer/wallet` - Get wallet
- `GET /customer/wallet/history` - Get wallet transaction history

### Enquiry (`/customer/enquiry`)
- `GET /customer/enquiry/hourly-packages` - Get hourly packages
- `POST /customer/enquiry/get-estimation` - Get fare estimation

### Promo Codes (`/customer/promo-codes`)
- `GET /customer/promo-codes/get` - Get promo codes
- `GET /customer/promo-codes/:id` - Get promo code by ID
- `POST /customer/promo-codes/validate` - Validate promo code

### Offers (`/customer/offers`)
- `GET /customer/offers/get` - Get all offers
- `GET /customer/offers/:id` - Get offer by ID

### Notifications (`/customer/notifications`)
- `GET /customer/notifications/all` - Get all notifications

### Other Endpoints
- `GET /customer/config-keys` - Get config keys
- `GET /customer/version/get` - Get versions

---

## 4. VENDOR APP APIs (`/vendor/*`)

### Authentication (`/vendor/auth`)
- `POST /vendor/auth/login` - Vendor login

### Vendor (`/vendor`)
- `GET /vendor/profile` - Get vendor profile
- `GET /vendor/transactions` - Get vendor wallet transactions
- `POST /vendor/fcm-token` - Update FCM token
- `POST /vendor/payment-details` - Create payment details
- `GET /vendor/payment-details` - Get payment details
- `PUT /vendor/payment-details/:id` - Update payment details
- `PATCH /vendor/payment-details/:id/:type` - Toggle payment details
- `GET /vendor/payment-details/:id` - Get payment details by ID

### Bookings (`/vendor/bookings`)
- `GET /vendor/bookings` - Get all vendor bookings
- `GET /vendor/bookings/specific` - Get specific vendor bookings
- `GET /vendor/bookings/counts` - Get vendor booking counts
- `GET /vendor/bookings/drivers` - Fetch drivers
- `GET /vendor/bookings/drivers-location` - Fetch drivers with location
- `GET /vendor/bookings/driver/:phone` - Fetch drivers by phone
- `GET /vendor/bookings/vehicle-types` - Get vehicle types
- `GET /vendor/bookings/hourly-packages` - Get hourly packages
- `POST /vendor/bookings` - Create vendor booking
- `POST /vendor/bookings/:id/assign-all-drivers` - Assign all drivers
- `GET /vendor/bookings/:id` - Get vendor booking by ID
- `POST /vendor/bookings/:id/cancel` - Cancel booking by vendor
- `PUT /vendor/bookings/:id` - Update vendor booking
- `DELETE /vendor/bookings/:id` - Delete vendor booking
- `POST /vendor/bookings/assign-driver` - Assign driver
- `POST /vendor/bookings/toggle-changes/:id` - Toggle booking changes

### Estimation (`/vendor/estimation`)
- `POST /vendor/estimation` - Estimate fare

### Other Endpoints
- `GET /vendor/config-keys` - Get config keys
- `GET /vendor/version/get` - Get versions

---

## 5. WEBSITE APIs (`/website/*`)

### Services
- `GET /website/services` - Get all active services
- `GET /website/tariffs` - Get all active tariffs
- `GET /website/vehicles` - Get all active vehicles
- `GET /website/blogs` - Get all blogs
- `GET /website/blogs/:id` - Get single blog
- `GET /website/dynamic-routes` - Get all active dynamic routes
- `GET /website/popular-routes` - Get all active popular routes
- `GET /website/company-profile` - Get company profile
- `GET /website/offers` - Get offers
- `POST /website/ip-address` - Store IP address
- `GET /website/include-exclude/service/:id` - Get include and exclude by service ID
- `POST /website` - Distance price calculation

### Bookings (`/website/booking`)
- `GET /website/booking/booking-status/:id` - Get booking status
- `POST /website/booking` - Create booking
- `PUT /website/booking/:id` - Update booking
- `POST /website/booking/savebooking` - Save booking
- `GET /website/booking/invoice/:id` - Get booking invoice

### Enquiry (`/website/enquiry`)
- `POST /website/enquiry` - Create enquiry
- `POST /website/enquiry/saveEnquiry` - Save enquiry

---

## 6. PUBLIC APIs (`/global/*`)

- `POST /global/jwt/signup` - Generate JWT token
- `GET /global/distance` - Find distance

---

## 7. WEBHOOK APIs

- `POST /api/razorpay/webhook` - Razorpay webhook handler

---

## Notes

- All endpoints require authentication via Bearer token in Authorization header (except public endpoints)
- Image upload endpoints use multipart/form-data
- Most endpoints return JSON responses with `success` boolean and `message` fields
- Response time validation threshold: 1000ms (configurable in Locust tests)

