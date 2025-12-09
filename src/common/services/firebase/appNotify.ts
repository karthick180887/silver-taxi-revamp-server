import admin from '../../db/firebase';
import { BatchResponse, MulticastMessage } from 'firebase-admin/messaging';

interface NotificationPayload {
  title?: string;
  message?: string;
  ids: any;
  data?: Record<string, string>;
  image?: string;
}

// Track sent notifications to prevent duplicates
const sentNotifications = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 5000; // 5 seconds cooldown

// Generate unique notification ID
const generateNotificationId = (token: string, payload: NotificationPayload): string => {
  const baseId = `${token}_${payload.data?.type || 'general'}_${payload.data?.bookingId || payload.data?.notificationId || Date.now()}`;
  return baseId;
};

// Check if notification was recently sent
const isNotificationRecentlySent = (notificationId: string): boolean => {
  const lastSent = sentNotifications.get(notificationId);
  if (!lastSent) return false;

  const timeSinceLastSent = Date.now() - lastSent;
  return timeSinceLastSent < NOTIFICATION_COOLDOWN;
};

// Clean up old entries from sentNotifications map
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (now - timestamp > NOTIFICATION_COOLDOWN) {
      sentNotifications.delete(key);
    }
  }
}, 60000); // Clean up every minute

export const sendToSingleToken = async (token: string, payload: NotificationPayload) => {
  try {
    const message = {
      notification: payload.title ? {
        title: payload.title,
        body: payload.message,
        imageUrl: payload.image || '',
      } : {},
      data: payload.data || {},
      token,
    };

    // console.log("Sending notification to app >> :", message);
    return await admin.messaging().send(message);
  } catch (err: any) {
    console.log("FCM Notification Send Error :>", err)
  }
};

export const sendToMultipleTokens = async (tokens: string[], payload: NotificationPayload) => {
  try {
    const messages = tokens.map((token) =>
      admin.messaging().send({
        token,
        notification: {
          title: payload.title,
          body: payload.message,
        },
        data: payload.data || {},
      })
    );

    const results = await Promise.allSettled(messages);

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    return {
      successCount,
      failureCount,
      responses: results,
    };
  } catch (err: any) {
    console.log("FCM Notification Send Error :>", err)
  }
};

export const sendCustomNotifications = async (tokens: string[], payload: NotificationPayload) => {
  try {
    // Validate payload before sending
    if (!payload.title || !payload.message || payload.title.trim() === '' || payload.message.trim() === '') {
      console.error("Invalid notification payload: title or message is empty");

    }

    // Filter out empty tokens
    const validTokens = tokens.filter(token => token && token.trim() !== '');

    if (validTokens.length === 0) {
      console.error("No valid FCM tokens provided");
      return {
        successCount: 0,
        failureCount: 0,
        responses: [],
        error: "No valid FCM tokens provided"
      };
    }

    console.log(`Sending custom notification to ${validTokens.length} tokens:`, {
      title: payload.title,
      message: payload.message,
      uniqueId: payload.data?.uniqueId
    });

    const messages = validTokens.map((token) => {
      // Generate unique notification ID
      const notificationId = generateNotificationId(token, payload);

      // Check for duplicate notifications
      if (isNotificationRecentlySent(notificationId)) {
        console.log(`Skipping duplicate custom notification for token: ${token.substring(0, 20)}...`);
        return Promise.resolve({ status: 'skipped', reason: 'duplicate' });
      }

      // Mark notification as sent
      sentNotifications.set(notificationId, Date.now());

      return admin.messaging().send({
        token,
        notification: {
          title: payload.title,
          body: payload.message,
          imageUrl: payload.image || '',
        },
        data: payload.data || {},

      });
    });

    const results = await Promise.allSettled(messages);

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;
    const skippedCount = results.filter((r) =>
      r.status === "fulfilled" && r.value && (r.value as any).status === 'skipped'
    ).length;

    return {
      successCount,
      failureCount,
      skippedCount,
      responses: results,
    };
  } catch (err: any) {
    console.error("FCM Notification Send Error:", err);
    return {
      successCount: 0,
      failureCount: tokens.length,
      responses: [],
      error: err.message
    };
  }
};

export const sendToTopic = async (topic: string, payload: NotificationPayload) => {
  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.message,
      },
      data: payload.data || {},
      topic,
    };

    return await admin.messaging().send(message);
  } catch (err: any) {
    console.log("FCM Notification Send Error :>", err)
  }
};

// Batch sending with sendMulticast
const MAX_BATCH = 500; // FCM limit for multicast
const CONCURRENCY = 5; // Concurrent batches

// Helper to chunk array
const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

// Send one batch using sendMulticast
const sendBatch = async (tokens: string[], payload: NotificationPayload) => {
  try {
    const message: MulticastMessage = {
      tokens,
      notification: payload.title ? {
        title: payload.title,
        body: payload.message || '',
        imageUrl: payload.image,
      } : undefined,
      data: payload.data || {},
      android: {
        priority: 'high' as const,
      },
    };

    const messaging = admin.messaging();
    const response: BatchResponse = await messaging.sendEachForMulticast(message);
    
    // Extract invalid tokens for cleanup
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx: number) => {
      if (!resp.success) {
        const err = resp.error;
        // Common cleanup errors
        if (err && (
          err.code === 'messaging/invalid-registration-token' ||
          err.code === 'messaging/registration-token-not-registered'
        )) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (err: any) {
    console.error("FCM Batch Send Error:", err);
    return {
      successCount: 0,
      failureCount: tokens.length,
      invalidTokens: [],
      error: err.message,
    };
  }
};

// Send to all tokens in batches with concurrency control
export const sendBatchNotifications = async (
  tokens: string[],
  payload: NotificationPayload
) => {
  try {
    // Filter out empty tokens
    const validTokens = tokens.filter(token => token && token.trim() !== '');
    
    if (validTokens.length === 0) {
      console.error("No valid FCM tokens provided for batch send");
      return {
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
        batches: [],
        error: "No valid FCM tokens provided"
      };
    }

    const batches = chunkArray(validTokens, MAX_BATCH);
    const results: any[] = [];
    let cursor = 0;

    // Simple concurrency limiter
    const pool = new Array(CONCURRENCY).fill(Promise.resolve());
    
    const worker = async () => {
      while (cursor < batches.length) {
        const batchIndex = cursor++;
        const batchTokens = batches[batchIndex];
        
        try {
          const res = await sendBatch(batchTokens, payload);
          results.push({ batchIndex, ...res });
        } catch (err: any) {
          console.error(`Batch error for batch ${batchIndex}:`, err);
          results.push({ batchIndex, error: String(err) });
        }
      }
    };

    await Promise.all(pool.map(() => worker()));

    // Aggregate results
    const totalSuccess = results.reduce((sum, r) => sum + (r.successCount || 0), 0);
    const totalFailure = results.reduce((sum, r) => sum + (r.failureCount || 0), 0);
    const allInvalidTokens = results.reduce((acc: string[], r) => {
      if (r.invalidTokens) {
        acc.push(...r.invalidTokens);
      }
      return acc;
    }, []);

    return {
      successCount: totalSuccess,
      failureCount: totalFailure,
      invalidTokens: allInvalidTokens,
      batches: results,
    };
  } catch (err: any) {
    console.error("FCM Batch Notifications Error:", err);
    return {
      successCount: 0,
      failureCount: tokens.length,
      invalidTokens: [],
      batches: [],
      error: err.message,
    };
  }
};