import { sendNotification } from '../socket/websocket';
import { sendToSingleToken, sendToMultipleTokens } from '../firebase/appNotify';
import { createNotification, createDriverNotification, createCustomerNotification } from '../../../v1/core/function/notificationCreate';
import { debugLogger as debug, infoLogger as log } from '../../../utils/logger';

interface NotificationData {
  title: string;
  message: string;
  type?: string;
  adminId: string;
  vendorId?: string;
  customerId?: string;
  driverId?: string;
  bookingId?: string;
  notificationId?: string;
  channelKey?: string;
}

interface NotificationResult {
  success: boolean;
  websocketSent: boolean;
  fcmSent: boolean;
  error?: string;
  notificationId?: string;
}

// Track sent notifications to prevent duplicates
const sentNotifications = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 3000; // 3 seconds cooldown

// Generate unique notification key
const generateNotificationKey = (data: NotificationData): string => {
  const base = `${data.adminId}_${data.type || 'general'}_${data.bookingId || data.notificationId || Date.now()}`;
  return `${base}_${data.vendorId || 'no_vendor'}_${data.customerId || 'no_customer'}_${data.driverId || 'no_driver'}`;
};

// Check if notification was recently sent
const isNotificationRecentlySent = (key: string): boolean => {
  const lastSent = sentNotifications.get(key);
  if (!lastSent) return false;
  
  const timeSinceLastSent = Date.now() - lastSent;
  return timeSinceLastSent < NOTIFICATION_COOLDOWN;
};

// Clean up old entries
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (now - timestamp > NOTIFICATION_COOLDOWN) {
      sentNotifications.delete(key);
    }
  }
}, 60000); // Clean up every minute

export class NotificationManager {
  /**
   * Send notification to admin/vendor via websocket and database
   */
  static async sendAdminNotification(data: NotificationData): Promise<NotificationResult> {
    const notificationKey = generateNotificationKey(data);
    
    // Check for duplicate notifications
    if (isNotificationRecentlySent(notificationKey)) {
      debug.info(`Skipping duplicate admin notification: ${notificationKey}`);
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: 'Duplicate notification'
      };
    }

    // Mark notification as sent
    sentNotifications.set(notificationKey, Date.now());

    try {
      const time = new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }).format(new Date());

      const notificationPayload = {
        adminId: data.adminId,
        vendorId: data.vendorId || null,
        title: data.title,
        description: data.message,
        type: data.type || 'general',
        read: false,
        date: new Date(),
        time: time,
      };

      // Create notification in database
      const notificationResponse = await createNotification(notificationPayload as any);
      
      if (!notificationResponse.success) {
        debug.error('Failed to create admin notification in database');
        return {
          success: false,
          websocketSent: false,
          fcmSent: false,
          error: 'Database notification creation failed'
        };
      }

             // Send websocket notification
       const targetId = data.vendorId || data.adminId;
       sendNotification(targetId, {
         notificationId: notificationResponse.notificationId || undefined,
         title: data.title,
         description: data.message,
         type: data.type || 'general',
         read: false,
         date: new Date(),
         time: time,
       });

      log.info(`Admin notification sent successfully: ${notificationKey}`);
      
             return {
         success: true,
         websocketSent: true,
         fcmSent: false,
         notificationId: notificationResponse.notificationId || undefined
       };

    } catch (error) {
      debug.error(`Error sending admin notification: ${error}`);
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send notification to driver via FCM and database
   */
  static async sendDriverNotification(data: NotificationData): Promise<NotificationResult> {
    if (!data.driverId) {
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: 'Driver ID is required'
      };
    }

    const notificationKey = generateNotificationKey(data);
    
    // Check for duplicate notifications
    if (isNotificationRecentlySent(notificationKey)) {
      debug.info(`Skipping duplicate driver notification: ${notificationKey}`);
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: 'Duplicate notification'
      };
    }

    // Mark notification as sent
    sentNotifications.set(notificationKey, Date.now());

    try {
      // Create driver notification in database
      const notificationCreated = await createDriverNotification({
        title: data.title,
        message: data.message,
        ids: {
          adminId: data.adminId,
          driverId: data.driverId,
        },
        type: data.type || 'booking',
      });

      if (!notificationCreated) {
        debug.error('Failed to create driver notification in database');
        return {
          success: false,
          websocketSent: false,
          fcmSent: false,
          error: 'Database notification creation failed'
        };
      }

      // FCM notification will be handled by the calling function
      // since we need the driver's FCM token
      
      log.info(`Driver notification created successfully: ${notificationKey}`);
      
      return {
        success: true,
        websocketSent: false,
        fcmSent: false,
        notificationId: `driver_${data.driverId}_${Date.now()}`
      };

    } catch (error) {
      debug.error(`Error creating driver notification: ${error}`);
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send FCM notification to driver
   */
  static async sendDriverFCMNotification(
    fcmToken: string, 
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!fcmToken || fcmToken.trim() === '') {
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: 'Invalid FCM token'
      };
    }

    try {
      const fcmPayload = {
        ids: {
          adminId: data.adminId,
          bookingId: data.bookingId,
          driverId: data.driverId,
        },
        data: {
          title: data.title,
          message: data.message,
          type: data.type || 'new-booking',
          channelKey: data.channelKey || 'booking_channel',
          notificationId: data.notificationId || `driver_fcm_${data.driverId}_${Date.now()}`,
        },
      };

      const result = await sendToSingleToken(fcmToken, fcmPayload);
      
      if (result) {
        log.info(`FCM notification sent to driver ${data.driverId}`);
        return {
          success: true,
          websocketSent: false,
          fcmSent: true,
          notificationId: fcmPayload.data.notificationId
        };
      } else {
        return {
          success: false,
          websocketSent: false,
          fcmSent: false,
          error: 'FCM notification failed'
        };
      }

    } catch (error) {
      debug.error(`Error sending FCM notification to driver: ${error}`);
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send FCM notifications to multiple drivers
   */
  static async sendMultipleDriverFCMNotifications(
    fcmTokens: string[], 
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!fcmTokens || fcmTokens.length === 0) {
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: 'No FCM tokens provided'
      };
    }

    try {
      const fcmPayload = {
        ids: {
          adminId: data.adminId,
          bookingId: data.bookingId,
        },
        data: {
          title: data.title,
          message: data.message,
          type: data.type || 'new-booking',
          channelKey: data.channelKey || 'booking_channel',
          notificationId: data.notificationId || `all_drivers_${data.bookingId}_${Date.now()}`,
        },
      };

      const result = await sendToMultipleTokens(fcmTokens, fcmPayload);
      
             if (result && result.successCount > 0) {
         log.info(`FCM notifications sent to ${result.successCount} drivers`);
         return {
           success: true,
           websocketSent: false,
           fcmSent: true,
           notificationId: fcmPayload.data.notificationId
         };
       } else {
         return {
           success: false,
           websocketSent: false,
           fcmSent: false,
           error: `FCM notifications failed: ${result?.failureCount || 0} failures`
         };
       }

    } catch (error) {
      debug.error(`Error sending FCM notifications to drivers: ${error}`);
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send notification to customer via FCM and database
   */
  static async sendCustomerNotification(data: NotificationData): Promise<NotificationResult> {
    if (!data.customerId) {
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: 'Customer ID is required'
      };
    }

    const notificationKey = generateNotificationKey(data);
    
    // Check for duplicate notifications
    if (isNotificationRecentlySent(notificationKey)) {
      debug.info(`Skipping duplicate customer notification: ${notificationKey}`);
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: 'Duplicate notification'
      };
    }

    // Mark notification as sent
    sentNotifications.set(notificationKey, Date.now());

    try {
      // Create customer notification in database
      const notificationCreated = await createCustomerNotification({
        title: data.title,
        message: data.message,
        ids: {
          adminId: data.adminId,
          customerId: data.customerId
        },
        type: data.type || 'booking',
      });

      if (!notificationCreated) {
        debug.error('Failed to create customer notification in database');
        return {
          success: false,
          websocketSent: false,
          fcmSent: false,
          error: 'Database notification creation failed'
        };
      }

      log.info(`Customer notification created successfully: ${notificationKey}`);
      
      return {
        success: true,
        websocketSent: false,
        fcmSent: false,
        notificationId: `customer_${data.customerId}_${Date.now()}`
      };

    } catch (error) {
      debug.error(`Error creating customer notification: ${error}`);
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send FCM notification to customer
   */
  static async sendCustomerFCMNotification(
    fcmToken: string, 
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!fcmToken || fcmToken.trim() === '') {
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: 'Invalid FCM token'
      };
    }

    try {
      const fcmPayload = {
        ids: {
          adminId: data.adminId,
          bookingId: data.bookingId,
          customerId: data.customerId,
        },
        data: {
          title: data.title,
          message: data.message,
          type: data.type || 'customer-booking',
          channelKey: data.channelKey || 'customer_info',
          notificationId: data.notificationId || `customer_fcm_${data.customerId}_${Date.now()}`,
        },
      };

      const result = await sendToSingleToken(fcmToken, fcmPayload);
      
      if (result) {
        log.info(`FCM notification sent to customer ${data.customerId}`);
        return {
          success: true,
          websocketSent: false,
          fcmSent: true,
          notificationId: fcmPayload.data.notificationId
        };
      } else {
        return {
          success: false,
          websocketSent: false,
          fcmSent: false,
          error: 'FCM notification failed'
        };
      }

    } catch (error) {
      debug.error(`Error sending FCM notification to customer: ${error}`);
      return {
        success: false,
        websocketSent: false,
        fcmSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
