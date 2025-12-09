# 📄 Cursor Prompt – Activity Log Implementation Guide

> ⚠️ **Do not** modify any existing logic, models, functions, or routes unless absolutely necessary.

---

## ✅ Goal

Implement centralized **Activity Logging** for the following core modules:

- `Booking`
- `Driver`  
- `Vendor`

These logs track **what changed**, **by whom**, **when**, and **context**—with clear model-level separation.

---

## 🧱 Step 1: Define Sequelize Models

### 1.1 `BookingActivityLog`
```typescript
export interface BookingActivityLogAttributes {
  id: number;
  adminId: string;
  bookingId: string;
  action: string;
  message: string;
  fieldChanged: string;
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
  additionalInfo?: any;
}
```

### 1.2 `DriverActivityLog`
```typescript
export interface DriverActivityLogAttributes {
  id: number;
  adminId: string;
  driverId: string;
  action: string;
  message: string;
  fieldChanged: string;
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
  additionalInfo?: any;
}
```

### 1.3 `VendorActivityLog`
```typescript
export interface VendorActivityLogAttributes {
  id: number;
  adminId: string;
  vendorId: string;
  action: string;
  message: string;
  fieldChanged: string;
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
  additionalInfo?: any;
}
```

🧠 Store `additionalInfo` as `JSONB` if supported by your DB config for dynamic log context.

---

## 🔄 Step 2: Sync Models

Register your activity log models in:
`src/v1/core/models/index.ts`

Example:
```typescript
import { BookingActivityLog } from './bookingActivityLog';
import { DriverActivityLog } from './driverActivityLog';
import { VendorActivityLog } from './vendorActivityLog';

BookingActivityLog.sync();
DriverActivityLog.sync();
VendorActivityLog.sync();
```

---

## 🔧 Step 3: Add Logging Functions

Location:
`src/v1/core/function/activityLog.ts`

Define 3 async utility functions:
```typescript
export const bookingActivity = async (data: BookingActivityLogAttributes): Promise<void> => {
  try {
    await BookingActivityLog.create(data);
  } catch (err) {
    debug.info(`Booking Activity Log Failed: ${err}`);
  }
};

export const driverActivity = async (data: DriverActivityLogAttributes): Promise<void> => {
  try {
    await DriverActivityLog.create(data);
  } catch (err) {
    debug.info(`Driver Activity Log Failed: ${err}`);
  }
};

export const vendorActivity = async (data: VendorActivityLogAttributes): Promise<void> => {
  try {
    await VendorActivityLog.create(data);
  } catch (err) {
    debug.info(`Vendor Activity Log Failed: ${err}`);
  }
};
```

🔁 Always wrap these with try-catch to avoid application crashes.

---

## 🔌 Step 4: Use Log Functions in Controllers

Where to integrate:
- `bookingActivity` → `src/v1/admin/controller/bookingController.ts`
- `driverActivity` → `src/v1/admin/controller/driverController.ts`
- `vendorActivity` → `src/v1/admin/controller/vendorController.ts`

Use only after successful mutation. Example:
```typescript
await vendorActivity({
  adminId,
  vendorId: newVendor.vendorId,
  action: "CREATE",
  message: "New vendor created",
  fieldsChanged: "ALL",
  newValue: JSON.stringify(newVendor),
  timestamp: new Date(),
});
```

---

## 📡 Step 5: Activity Log API Controllers & Routes

### Add Controllers in Fn :
- `bookingActivityLog` → `src/v1/admin/controller/bookingController.ts`
- `driverActivityLog` → `src/v1/admin/controller/driverController.ts`
- `vendorActivityLog` → `src/v1/admin/controller/vendorController.ts`

Each should have endpoints to:
- `GET /activity-log/:id` specific log entry

Optional: filter by date/adminId/related entity id

---

## 📌 Notes & Best Practices
-  Do not modify existing models/functions/routes.
-  Use try-catch everywhere.
-  Avoid crashes — logging should never break core flow.
-  Use timestamp + message + context in logs.
- Reuse centralized log functions from activityLog.ts.