# Notification System Architecture

## Overview

The notification system in Silver Taxi handles real-time updates and push notifications for three primary actors: **Admin**, **Driver**, and **Customer** (and implicitly **Vendor**).

It utilizes a hybrid approach:
1.  **Socket.IO**: For real-time, in-app updates (e.g., "New Trip Offer" modal, Live Tracking).
2.  **Firebase Cloud Messaging (FCM)**: For background push notifications and system-wide alerts.
3.  **RabbitMQ**: As a message broker to offload FCM processing and other asynchronous tasks (WhatsApp).
4.  **Database**: Persists notifications for in-app "Notification Center" history.

## Components

### 1. Publishers (Trigger Points)
*   **API Controllers**: [bookingController.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/admin/controller/bookingController.ts), [trip.controller.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/apps/driver/controller/trip.controller.ts).
*   **Post-Hook Logic**: [postBookingCreation.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/core/function/postBookingCreation.ts) (triggered after `Booking.create`).
*   **RabbitMQ Publisher**: [publisher.ts](file:///e:/app/silver-taxi-revamp-server/src/common/services/rabbitmq/publisher.ts) (pushes to queues like `notification.fcm.driver`).

### 2. Message Broker (RabbitMQ)
*   Routes:
    *   `notification.fcm.driver`: Individual driver notifications.
    *   `notification.fcm.batch`: Bulk notifications (e.g., "Assign to All").
    *   `notification.fcm.customer`: Customer updates.
    *   `notification.fcm.vendor`: Vendor updates.
    *   `notification.whatsapp`: WhatsApp integration.

### 3. Consumers (Workers)
*   **Notification Worker** ([notificationWorker.ts](file:///e:/app/silver-taxi-revamp-server/src/common/services/rabbitmq/workers/notificationWorker.ts)):
    *   Listens to `notification.fcm.*` and `notification.whatsapp`.
    *   Delegates to [handleQueueMsgs.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/core/function/queue/handleQueueMsgs.ts).
    *   **Action**: Inserts into DB -> Sends FCM via Firebase Admin SDK.
    *   **Note**: Does *not* trigger Socket.IO events.

### 4. Real-Time Server (Socket.IO)
*   **Websocket Service** ([websocket.ts](file:///e:/app/silver-taxi-revamp-server/src/common/services/socket/websocket.ts)):
    *   Manages connections.
    *   Emits events: `NEW_TRIP_OFFER`, `TRIP_UPDATE`, `LIVE_TRACKING`.
    *   Triggered *directly* by Controllers or Post-Hooks, not by the Queue Worker.

---

## Detailed Notification Flows

### 1. New Booking (Specific Driver Assigned)
*   **Trigger**: `Booking.create` (via API) -> [postBookingCreation.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/core/function/postBookingCreation.ts).
*   **Flow**:
    1.  **DB**: `createDriverNotification` is called.
    2.  **Socket**: [emitNewTripOfferToDriver(driverId, data)](file:///e:/app/silver-taxi-revamp-server/src/common/services/socket/websocket.ts#114-148) is called immediately. The driver app (if open) receives `NEW_TRIP_OFFER` event.
    3.  **FCM**: `sendToSingleToken` is called (direct or via queue depending on implementation branch).*
        * *Observation: [postBookingCreation.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/core/function/postBookingCreation.ts) currently calls `createDriverNotification` (DB) but the queuing logic for FCM seems to be handled implicitly or is missing direct queue push in that specific file, possibly relying on `bookingController` or [assignDriver](file:///e:/app/silver-taxi-revamp-server/admin-dashboard/src/lib/api.ts#175-177) if updated later.*

### 2. New Booking (Assign All / Broadcast)
*   **Trigger A**: `Booking.create` with `assignAllDriver: true`.
    *   **Status**: **Incomplete**.
    *   Logic in [postBookingCreation.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/core/function/postBookingCreation.ts) checks for [assignAllDriver](file:///e:/app/silver-taxi-revamp-server/src/v1/admin/controller/bookingController.ts#1400-1499) but has a comment: `// Broadcast to all active drivers - Implementation pending fetching active drivers`.
    *   **Result**: No Socket event is emitted. No FCM is sent automatically at this stage unless handled elsewhere.
*   **Trigger B**: Admin clicks "Assign All" ([bookingController.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/admin/controller/bookingController.ts) -> [assignAllDrivers](file:///e:/app/silver-taxi-revamp-server/src/v1/admin/controller/bookingController.ts#1400-1499)).
    *   **Flow**:
        1.  Fetches **all** drivers for the admin.
        2.  **RabbitMQ**: Publishes `notification.fcm.batch` with all tokens.
        3.  **Worker**: Consumes message -> Sends Batch FCM.
    *   **Critical Gap**: **No Socket.IO event** ([emitNewTripOfferToDrivers](file:///e:/app/silver-taxi-revamp-server/src/common/services/socket/websocket.ts#149-193)) is triggered. Drivers will receive a Push Notification (system tray) but the app might not show the "New Request" modal instantly unless it refreshes data on FCM receipt.

### 3. Driver Assigns (Manual Admin Assignment)
*   **Trigger**: [bookingController.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/admin/controller/bookingController.ts) -> [assignDriver](file:///e:/app/silver-taxi-revamp-server/admin-dashboard/src/lib/api.ts#175-177).
*   **Flow**:
    1.  **RabbitMQ**: Publishes to `notification.fcm.driver`.
    2.  **Worker**: Consumes -> Creates DB Entry -> Sends FCM.
    3.  **Critical Gap**: **No Socket.IO event** is emitted in this controller function. The driver relies entirely on FCM.

### 4. Trip Started / Ended
*   **Trigger**: [trip.controller.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/apps/driver/controller/trip.controller.ts) -> [tripStarted](file:///e:/app/silver-taxi-revamp-server/src/v1/apps/driver/controller/trip.controller.ts#454-682) / [tripEnd](file:///e:/app/silver-taxi-revamp-server/src/v1/apps/driver/controller/trip.controller.ts#683-772).
*   **Flow**:
    1.  **DB**: Updates Booking Status.
    2.  **Socket**: Calls [emitTripUpdateToCustomer](file:///e:/app/silver-taxi-revamp-server/src/common/services/socket/websocket.ts#194-217) (Live Tracking).
        *   Event: `TRIP_STATUS_UPDATE` (or similar).
    3.  **FCM**: Sends direct FCM to Customer (`sendToSingleToken`).
    4.  **Admin/Vendor**: Creates DB notification + Internal Socket Event (for Admin Dashboard).

---

## Gap Analysis & Recommendations

### Critical Gaps
1.  **Missing "Assign All" Socket Broadcast**:
    *   When "Assign All" is clicked, drivers do not get the real-time `NEW_TRIP_OFFER` socket event. They only get an FCM.
    *   **Fix**: Update [assignAllDrivers](file:///e:/app/silver-taxi-revamp-server/src/v1/admin/controller/bookingController.ts#1400-1499) in [bookingController.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/admin/controller/bookingController.ts) to fetch active socket IDs (or broadcast to room) and call [emitNewTripOfferToDrivers(bookingData)](file:///e:/app/silver-taxi-revamp-server/src/common/services/socket/websocket.ts#149-193).

2.  **Missing "Specific Assign" Socket Event (Admin Panel)**:
    *   When Admin manually assigns a driver, no socket event is sent.
    *   **Fix**: Update [assignDriver](file:///e:/app/silver-taxi-revamp-server/admin-dashboard/src/lib/api.ts#175-177) in [bookingController.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/admin/controller/bookingController.ts) to call [emitNewTripOfferToDriver(driverId, bookingData)](file:///e:/app/silver-taxi-revamp-server/src/common/services/socket/websocket.ts#114-148).

3.  **Incomplete Post-Booking Broadcast**:
    *   The automatic broadcast logic in [postBookingCreation.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/core/function/postBookingCreation.ts) is commented out.
    *   **Fix**: Implement [emitNewTripOfferToDrivers](file:///e:/app/silver-taxi-revamp-server/src/common/services/socket/websocket.ts#149-193) in this file if "Auto-Assign All" is a desired feature.

### Architecture Improvements
*   **Decouple Socket from Controllers**: Currently, socket calls are mixed in controllers ([trip.controller.ts](file:///e:/app/silver-taxi-revamp-server/src/v1/apps/driver/controller/trip.controller.ts)) and post-hooks. It might be cleaner to have the [NotificationManager](file:///e:/app/silver-taxi-revamp-server/src/common/services/notification/notificationManager.ts#56-471) or a `SocketService` handle all "Booking State Change" events centrally, allowing both Socket and FCM to be triggered from a single source of truth.
