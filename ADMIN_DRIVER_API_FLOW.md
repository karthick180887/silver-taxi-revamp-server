# Admin Driver API Flow Documentation

**Base Path**: `/v1/drivers`  
**Controller**: `src/v1/admin/controller/driverController.ts`  
**Router**: `src/v1/admin/router/driverRouter.ts`

---

## Database Tables Impacted

| Table Name | Model | Description |
|------------|-------|-------------|
| `drivers` | `Driver` | Main driver information table |
| `driver_wallets` | `DriverWallet` | Driver wallet balance and transactions |
| `wallet_transactions` | `WalletTransaction` | Individual wallet transaction records |
| `driver_wallet_requests` | `DriverWalletRequest` | Driver wallet add/withdraw requests |
| `vehicles` | `Vehicle` | Vehicle information linked to drivers |
| `driver_booking_logs` | `DriverBookingLog` | Driver booking history |
| `admins` | `Admin` | Admin user information (for lookups) |
| `driver_notifications` | (via `createDriverNotification`) | Driver notification records |

---

## API Endpoints

### 1. Get All Drivers

**Endpoint**: `GET /v1/drivers`  
**Function**: `getAllDrivers`

#### Request Payload
```typescript
Query Params:
  - adminId: string (required) // Can be in query or body

Body (optional):
  - adminId: string (required if not in query)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Drivers retrieved successfully",
  data: Driver[] // Array of driver objects with wallet included
}

Error (400):
{
  success: false,
  message: "adminId is required in Driver"
}

Error (500):
{
  success: false,
  message: "Error fetching drivers"
}
```

#### Database Operations
- **READ**: `drivers` table (filtered by `adminId`)
- **READ**: `driver_wallets` table (joined via `include`)

#### Related Operations
- None

---

### 2. Get Active Drivers

**Endpoint**: `GET /v1/drivers/active`  
**Function**: `getActiveDrivers`

#### Request Payload
```typescript
Query Params:
  - adminId: string (required)

Body (optional):
  - adminId: string (required if not in query)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Active drivers retrieved successfully",
  data: Driver[] // Array of active drivers with wallet included
}

Error (500):
{
  success: false,
  message: "Error fetching active drivers"
}
```

#### Database Operations
- **READ**: `drivers` table (filtered by `adminId` AND `isActive = true`)
- **READ**: `driver_wallets` table (joined via `include`)

#### Related Operations
- None

---

### 3. Get Driver By ID

**Endpoint**: `GET /v1/drivers/:id`  
**Function**: `getDriverById`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // driverId

Query Params:
  - None

Body:
  - None
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Driver retrieved successfully",
  data: Driver // Driver object with wallet and vehicles included
}

Error (404):
{
  success: false,
  message: "Driver not found"
}

Error (500):
{
  success: false,
  message: "Error fetching driver"
}
```

#### Database Operations
- **READ**: `drivers` table (filtered by `driverId`)
- **READ**: `driver_wallets` table (joined via `include`)
- **READ**: `vehicles` table (joined via `include`)

#### Related Operations
- None

---

### 4. Create Driver

**Endpoint**: `POST /v1/drivers`  
**Function**: `createDriver`  
**Middleware**: `upload.single("licenseImage")` (Multer file upload)

#### Request Payload
```typescript
Body (multipart/form-data):
  - adminId: string (required) // Can be in query or body
  - name: string (required)
  - phone: string (required)
  - license: string (required)
  - email: string (optional)
  - address: string (optional)
  - licenseValidity: string (optional)
  - aadharNumber: string (optional)
  - vehicleId: string (optional)
  - isActive: boolean (optional, default: true)
  - remark: string (optional)
  - walletAmount: number (optional, default: 0)
  - licenseImage: File (optional) // Multipart file upload

Query Params (optional):
  - adminId: string (required if not in body)
```

#### Response
```typescript
Success (201):
{
  success: true,
  message: "Driver created successfully",
  data: Driver // Newly created driver object
}

Error (400):
{
  success: false,
  message: "Missing required fields (name, phone, license)"
}

Error (500):
{
  success: false,
  message: "Error creating driver"
}
```

#### Database Operations
- **CREATE**: `drivers` table (new driver record)
- **CREATE**: `driver_wallets` table (new wallet record)
- **UPDATE**: `drivers` table (sets `driverId` and `walletId`)

#### Related Operations
- **File Upload**: Uploads `licenseImage` to MinIO/DigitalOcean Spaces (if provided)
- **File Cleanup**: Deletes temporary uploaded file after processing

---

### 5. Update Driver

**Endpoint**: `PUT /v1/drivers/:id`  
**Function**: `updateDriver`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // driverId

Body:
  - name: string (optional)
  - phone: string (optional)
  - email: string (optional)
  - driverImageUrl: string (optional)
  - address: string (optional)
  - isActive: boolean (optional)
  - aadharNumber: string (optional)
  - license: string (optional)
  - licenseValidity: string (optional)
  - licenseImage: string (optional)
  - vehicleId: string (optional)
  - remark: string (optional)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Driver updated successfully",
  data: Driver // Updated driver object
}

Error (404):
{
  success: false,
  message: "Driver not found"
}

Error (500):
{
  success: false,
  message: "Error updating driver"
}
```

#### Database Operations
- **READ**: `drivers` table (find by `driverId`)
- **UPDATE**: `drivers` table (update driver fields)

#### Related Operations
- None

---

### 6. Delete Driver

**Endpoint**: `DELETE /v1/drivers/:id`  
**Function**: `deleteDriver`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // driverId

Query Params:
  - adminId: string (required)

Body (optional):
  - adminId: string (required if not in query)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Driver deleted successfully"
}

Error (404):
{
  success: false,
  message: "Driver not found"
}

Error (500):
{
  success: false,
  message: "Error deleting driver"
}
```

#### Database Operations
- **READ**: `drivers` table (find by `driverId`)
- **READ**: `vehicles` table (find all vehicles for driver)
- **READ**: `driver_booking_logs` table (find all logs for driver)
- **READ**: `driver_wallets` table (find wallet by `walletId`)
- **DELETE**: `driver_wallets` table (force delete)
- **DELETE**: `driver_booking_logs` table (force delete all logs)
- **DELETE**: `vehicles` table (force delete all vehicles)
- **DELETE**: `drivers` table (force delete driver)

**Note**: Uses database transaction for atomicity. All deletions are hard deletes (`force: true`).

#### Related Operations
- None

---

### 7. Multi-Delete Drivers

**Endpoint**: `DELETE /v1/drivers`  
**Function**: `multiDeleteDrivers`

#### Request Payload
```typescript
Body:
  - driverIds: string[] (required) // Array of driverIds
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Drivers deleted successfully"
}

Error (400):
{
  success: false,
  message: "Invalid request: driverIds must be an array of driver IDs"
}

Error (404):
{
  success: false,
  message: "No drivers found with the provided IDs"
}

Error (500):
{
  success: false,
  message: "Error deleting drivers"
}
```

#### Database Operations
- **READ**: `drivers` table (find all by `driverIds`)
- **READ**: `driver_wallets` table (find all wallets)
- **READ**: `vehicles` table (find all vehicles)
- **DELETE**: `driver_wallets` table (force delete all)
- **DELETE**: `vehicles` table (force delete all)
- **DELETE**: `drivers` table (force delete all)

**Note**: All deletions are hard deletes (`force: true`).

#### Related Operations
- None

---

### 8. Get Driver Wallet

**Endpoint**: `GET /v1/drivers/wallet/:id`  
**Function**: `getDriverWallet`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // driverId
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Driver wallet retrieved successfully",
  data: DriverWallet // Wallet object
}

Error (404):
{
  success: false,
  message: "Driver not found" | "Wallet not found"
}

Error (500):
{
  success: false,
  message: "Error fetching driver wallet"
}
```

#### Database Operations
- **READ**: `drivers` table (find by `driverId`)
- **READ**: `driver_wallets` table (find by `walletId`)

#### Related Operations
- None

---

### 9. Add Wallet Amount

**Endpoint**: `POST /v1/drivers/wallet/add/:id`  
**Function**: `addDriverWallet`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // driverId

Body:
  - amount: number (required)
  - remark: string (required)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Wallet amount added successfully",
  data: DriverWallet // Updated wallet object
}

Error (400):
{
  success: false,
  message: "Remark is required"
}

Error (404):
{
  success: false,
  message: "Driver not found" | "Wallet not found"
}

Error (500):
{
  success: false,
  message: "Error adding wallet amount"
}
```

#### Database Operations
- **READ**: `drivers` table (find by `driverId`)
- **READ**: `driver_wallets` table (find by `walletId`)
- **READ**: `admins` table (find admin for name lookup)
- **UPDATE**: `driver_wallets` table (increment `balance`, `plusAmount`, `totalAmount`)
- **CREATE**: `wallet_transactions` table (new transaction record)
- **CREATE**: `driver_notifications` table (via `createDriverNotification`)

#### Related Operations
- **FCM Notification**: Sends push notification to driver's device (if `fcmToken` exists)
- **Transaction ID Generation**: Generates unique transaction ID using nanoid

---

### 10. Subtract Wallet Amount

**Endpoint**: `POST /v1/drivers/wallet/minus/:id`  
**Function**: `minusDriverWallet`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // driverId

Body:
  - amount: number (required)
  - remark: string (required)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Wallet amount subtracted successfully",
  data: DriverWallet // Updated wallet object
}

Error (400):
{
  success: false,
  message: "Remark is required"
}

Error (404):
{
  success: false,
  message: "Driver not found" | "Wallet not found"
}

Error (500):
{
  success: false,
  message: "Error subtracting wallet amount"
}
```

#### Database Operations
- **READ**: `drivers` table (find by `driverId`)
- **READ**: `driver_wallets` table (find by `walletId`)
- **READ**: `admins` table (find admin for name lookup)
- **UPDATE**: `driver_wallets` table (decrement `balance`, increment `minusAmount`, decrement `totalAmount`)
- **CREATE**: `wallet_transactions` table (new transaction record)
- **CREATE**: `driver_notifications` table (via `createDriverNotification`)

#### Related Operations
- **FCM Notification**: Sends push notification to driver's device (if `fcmToken` exists)
- **Transaction ID Generation**: Generates unique transaction ID using nanoid

---

### 11. Get All Driver Wallet Transactions

**Endpoint**: `GET /v1/drivers/wallet/transactions`  
**Function**: `getAllDriverWalletTrans`

#### Request Payload
```typescript
Query Params:
  - adminId: string (required)

Body (optional):
  - adminId: string (required if not in query)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Wallet transactions fetched successfully",
  data: WalletTransaction[] // Array of transaction objects
}

Error (500):
{
  success: false,
  message: "Internal server error",
  error: any
}
```

#### Database Operations
- **READ**: `wallet_transactions` table (filtered by `adminId` AND `vendorId IS NULL`, ordered by `createdAt DESC`)

#### Related Operations
- None

---

### 12. Get Driver Wallet Transactions

**Endpoint**: `GET /v1/drivers/wallet/:id/transactions`  
**Function**: `getDriverWalletTrans`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // driverId

Query Params:
  - adminId: string (required)

Body (optional):
  - adminId: string (required if not in query)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Wallet transactions fetched successfully",
  data: WalletTransaction[] // Array of transaction objects for specific driver
}

Error (500):
{
  success: false,
  message: "Internal server error",
  error: any
}
```

#### Database Operations
- **READ**: `wallet_transactions` table (filtered by `adminId` AND `driverId`, ordered by `createdAt DESC`)

#### Related Operations
- None

---

### 13. Get All Driver Wallet Requests

**Endpoint**: `GET /v1/drivers/wallet/requests`  
**Function**: `getAllDriverWalletRequests`

#### Request Payload
```typescript
Query Params:
  - adminId: string (required)

Body (optional):
  - adminId: string (required if not in query)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Driver wallet requests fetched successfully",
  data: DriverWalletRequest[] // Array of wallet request objects
}

Error (400):
{
  success: false,
  message: "Admin ID is required"
}

Error (500):
{
  success: false,
  message: "Error fetching driver wallet requests"
}
```

#### Database Operations
- **READ**: `driver_wallet_requests` table (filtered by `adminId`, ordered by `createdAt DESC`)

#### Related Operations
- None

---

### 14. Get Driver Wallet Request By ID

**Endpoint**: `GET /v1/drivers/wallet/request/:id`  
**Function**: `getDriverWalletRequestById`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // requestId

Query Params:
  - adminId: string (required)

Body (optional):
  - adminId: string (required if not in query)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "single Driver wallet request fetched successfully",
  data: DriverWalletRequest // Wallet request object
}

Error (400):
{
  success: false,
  message: "Admin ID and request ID are required"
}

Error (404):
{
  success: false,
  message: "Request not found"
}

Error (500):
{
  success: false,
  message: "Error fetching driver wallet request"
}
```

#### Database Operations
- **READ**: `driver_wallet_requests` table (filtered by `requestId` AND `adminId`, ordered by `createdAt DESC`)

#### Related Operations
- None

---

### 15. Approve or Reject Driver Wallet Request

**Endpoint**: `PUT /v1/drivers/wallet/request/:id`  
**Function**: `approveOrRejectDriverWalletRequest`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // driverId

Query Params:
  - adminId: string (required)

Body:
  - status: string (required) // "approved" | "rejected"
  - type: string (required) // "add" | "withdraw"
  - remark: string (optional)
  - paymentMethod: string (optional) // Required for "withdraw" type when approved
  - tnxPaymentId: string (optional) // Required for "withdraw" type when approved
```

#### Response
```typescript
Success (200) - Approved:
{
  success: true,
  message: "Wallet request approved successfully",
  data: DriverWallet // Updated wallet object
}

Success (200) - Rejected:
{
  success: true,
  message: "Wallet request rejected successfully",
  data: DriverWalletRequest // Updated request object
}

Error (400):
{
  success: false,
  message: "Status, type and id are required" | "Invalid status"
}

Error (404):
{
  success: false,
  message: "Driver not found" | "Request not found" | "Wallet not found"
}

Error (500):
{
  success: false,
  message: "Error approving driver wallet request"
}
```

#### Database Operations
- **READ**: `drivers` table (find by `driverId` AND `adminId`)
- **READ**: `admins` table (find admin for name lookup)
- **READ**: `driver_wallet_requests` table (find pending request by `driverId`, `type`, `adminId`)
- **READ**: `driver_wallets` table (find by `walletId`)
- **UPDATE**: `driver_wallet_requests` table (update `status`, `remark`, `transId`, `paymentMethod`, `tnxPaymentId`)
- **UPDATE**: `driver_wallets` table (update `balance`, `plusAmount`/`minusAmount`, `totalAmount`)
- **CREATE**: `wallet_transactions` table (new transaction record)
- **CREATE**: `driver_notifications` table (via `createDriverNotification`)

#### Related Operations
- **FCM Notification**: Sends push notification to driver's device (if `fcmToken` exists)
- **Transaction ID Generation**: Generates unique transaction ID using `generateTransactionId()`

**Note**: 
- If `status === "approved"` and `type === "add"`: Increments wallet balance
- If `status === "approved"` and `type === "withdraw"`: Decrements wallet balance
- If `status === "rejected"`: Only updates request status, no wallet changes

---

### 16. Wallet Bulk Request

**Endpoint**: `POST /v1/drivers/wallet/bulk-request`  
**Function**: `walletBulkRequest`

#### Request Payload
```typescript
Query Params:
  - adminId: string (required)

Body:
  - amount: number (required)
  - reason: string (required)
  - days: number (optional)
  - adjustmentType: string (required) // Validation via walletBulkRequestSchema
  - status: boolean (optional) // Filter by driver active status
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Wallet bulk request sent to queue"
}

Error (400):
{
  success: false,
  message: "Admin ID is required" | Validation errors array,
  errors: Array<{ field: string, message: string }>
}

Error (500):
{
  success: false,
  message: "Error fetching driver wallet request"
}
```

#### Database Operations
- **PUBLISH**: RabbitMQ queue (`walletBulkRequest` topic)

#### Related Operations
- **RabbitMQ**: Publishes bulk wallet request job to queue for async processing
- **Validation**: Uses `walletBulkRequestSchema` for request validation

**Note**: This endpoint only publishes the request to a queue. Actual processing happens asynchronously via RabbitMQ consumer.

---

### 17. Update Verification Status

**Endpoint**: `PUT /v1/drivers/verification/:id`  
**Function**: `verificationStatus`

#### Request Payload
```typescript
URL Params:
  - id: string (required) // driverId

Query Params:
  - adminId: string (required)
  - tenantId: string (optional)

Body:
  - vehicleId: string (required)
  
  // Driver verification fields
  - profileVerified: string (optional) // "accepted" | "rejected" | "pending"
  - remark: string (optional)
  - panCardVerified: string (optional)
  - panCardRemark: string (optional)
  - aadharImageFrontVerified: string (optional)
  - aadharImageFrontRemark: string (optional)
  - aadharBackVerified: string (optional)
  - aadharBackRemark: string (optional)
  - licenseImageFrontVerified: string (optional)
  - licenseImageFrontRemark: string (optional)
  - licenseImageBackVerified: string (optional)
  - licenseImageBackRemark: string (optional)
  
  // Vehicle verification fields
  - vehicleProfileVerified: string (optional)
  - vehicleRemark: string (optional)
  - rcFrontVerified: string (optional)
  - rcFrontRemark: string (optional)
  - rcBackVerified: string (optional)
  - rcBackRemark: string (optional)
  - pollutionImageVerified: string (optional)
  - pollutionImageRemark: string (optional)
  - insuranceVerified: string (optional)
  - insuranceRemark: string (optional)
```

#### Response
```typescript
Success (200):
{
  success: true,
  message: "Verification field(s) updated successfully",
  updatedFields: Driver // Updated driver object with vehicle included
}

Error (400):
{
  success: false,
  message: "vehicleId is required"
}

Error (404):
{
  success: false,
  message: "Driver or vehicle is not found"
}

Error (500):
{
  success: false,
  message: "Error updating verification status",
  error: any
}
```

#### Database Operations
- **READ**: `drivers` table (find by `driverId` AND `adminId`)
- **READ**: `vehicles` table (find by `vehicleId`, joined with driver)
- **UPDATE**: `drivers` table (update verification fields, `isUpdated`, `documentVerified`, `adminVerified`, `isActive`)
- **UPDATE**: `vehicles` table (update verification fields, `isUpdated`, `documentVerified`, `adminVerified`)

**Note**: 
- Uses database transaction for atomicity
- Auto-sets `documentVerified = "accepted"` when all driver documents are accepted
- Auto-sets `documentVerified = "accepted"` when all vehicle documents are accepted
- Auto-sets `adminVerified = "Approved"` and `isActive = true` when all driver AND vehicle documents are accepted
- Sets `isUpdated = true` if any document is rejected
- Clears remarks when verification status is "accepted"

#### Related Operations
- None

---

## Summary Table

| Endpoint | Method | Primary Table | Secondary Tables | Side Effects |
|----------|--------|---------------|------------------|--------------|
| `/v1/drivers` | GET | `drivers` | `driver_wallets` | None |
| `/v1/drivers/active` | GET | `drivers` | `driver_wallets` | None |
| `/v1/drivers/:id` | GET | `drivers` | `driver_wallets`, `vehicles` | None |
| `/v1/drivers` | POST | `drivers` | `driver_wallets` | File upload, wallet creation |
| `/v1/drivers/:id` | PUT | `drivers` | None | None |
| `/v1/drivers/:id` | DELETE | `drivers` | `driver_wallets`, `vehicles`, `driver_booking_logs` | Hard delete all related records |
| `/v1/drivers` | DELETE | `drivers` | `driver_wallets`, `vehicles` | Hard delete multiple drivers |
| `/v1/drivers/wallet/:id` | GET | `driver_wallets` | `drivers` | None |
| `/v1/drivers/wallet/add/:id` | POST | `driver_wallets` | `wallet_transactions`, `driver_notifications` | FCM notification |
| `/v1/drivers/wallet/minus/:id` | POST | `driver_wallets` | `wallet_transactions`, `driver_notifications` | FCM notification |
| `/v1/drivers/wallet/transactions` | GET | `wallet_transactions` | None | None |
| `/v1/drivers/wallet/:id/transactions` | GET | `wallet_transactions` | None | None |
| `/v1/drivers/wallet/requests` | GET | `driver_wallet_requests` | None | None |
| `/v1/drivers/wallet/request/:id` | GET | `driver_wallet_requests` | None | None |
| `/v1/drivers/wallet/request/:id` | PUT | `driver_wallet_requests` | `driver_wallets`, `wallet_transactions`, `driver_notifications` | FCM notification |
| `/v1/drivers/wallet/bulk-request` | POST | None | None | RabbitMQ publish |
| `/v1/drivers/verification/:id` | PUT | `drivers` | `vehicles` | Auto-approval logic |

---

## Common Response Structure

All endpoints follow a consistent response structure:

```typescript
Success Response:
{
  success: true,
  message: string,
  data?: any // Endpoint-specific data
}

Error Response:
{
  success: false,
  message: string,
  error?: any // Only in development mode for 500 errors
}
```

---

## Authentication & Authorization

All endpoints require:
- `adminId` in query params or request body
- Admin authentication middleware (typically handled at router level)

---

## Notes

1. **File Uploads**: Only `createDriver` endpoint accepts file uploads (`licenseImage`)
2. **Hard Deletes**: `deleteDriver` and `multiDeleteDrivers` perform hard deletes (`force: true`)
3. **Transactions**: `deleteDriver` and `verificationStatus` use database transactions for atomicity
4. **Notifications**: Wallet operations (`addDriverWallet`, `minusDriverWallet`, `approveOrRejectDriverWalletRequest`) send FCM notifications
5. **Bulk Operations**: `walletBulkRequest` publishes to RabbitMQ for async processing
6. **Auto-Approval**: `verificationStatus` automatically sets `adminVerified = "Approved"` when all documents are accepted

