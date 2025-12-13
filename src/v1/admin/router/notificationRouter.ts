import express from 'express';
import multer from 'multer';
import upload from '../../../utils/multer.fileUpload';
import {
    getAllNotifications,
    markAsRead,
    markAllAsRead,
    markAllAsVendorRead,
    getAllVendorNotifications,
    getAllOffsetNotifications,
    getAllVendorOffsetNotifications,
    // Custom notification APIs
    createCustomNotification,
    editCustomNotification,
    getAllCustomNotifications,
    getCustomNotificationById,
    deleteCustomNotification,
    sendCustomNotification,
    testNotificationEndpoint,
    sendToDrivers
} from '../controller/notificationController';

const router = express.Router();


// Route to get all notifications
router.get('/', getAllNotifications);

// Route to get all notifications with offset
router.get('/offset', getAllOffsetNotifications);
// Route to mark all notifications as read

router.put('/read-all', markAllAsRead);

// Route to mark a specific notification as read
router.put('/read/:id', markAsRead);

// vendor routes
// Route to get all notifications for a vendor
router.get('/vendor', getAllVendorNotifications);

// Route to get all notifications for a vendor with offset
router.get('/vendor/offset', getAllVendorOffsetNotifications);

// Route to mark all notifications as read for a vendor
router.put('/vendor/read-all', markAllAsVendorRead);

// ==================== CUSTOM NOTIFICATION ROUTES ====================

// 1. Create custom notification
router.post('/custom', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Handle Multer-specific errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Max size is 5MB.',
                    error: err.code
                });
            }
            return res.status(400).json({
                success: false,
                message: `Multer error: ${err.message}`,
                error: err.code
            });
        } else if (err) {
            // Handle other errors
            return res.status(500).json({
                success: false,
                message: `Unexpected error: ${err.message}`,
                error: err
            });
        }
        next();
    });
}, createCustomNotification);

// 2. Edit custom notification
router.put('/custom/:templateId', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Handle Multer-specific errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Max size is 5MB.',
                    error: err.code
                });
            }
            return res.status(400).json({
                success: false,
                message: `Multer error: ${err.message}`,
                error: err.code
            });
        } else if (err) {
            // Handle other errors
            return res.status(500).json({
                success: false,
                message: `Unexpected error: ${err.message}`,
                error: err
            });
        }
        next();
    });
}, editCustomNotification);

// 3. View all custom notifications
router.get('/custom', getAllCustomNotifications);

// 4. View individual custom notification
router.get('/custom/:templateId', getCustomNotificationById);

// 5. Delete custom notification
router.delete('/custom/:templateId', deleteCustomNotification);

// 6. Send custom notification
router.post('/custom/:templateId/send', sendCustomNotification);

// 8. Send to drivers (Broadcast or Specific)
router.post('/send-drivers', sendToDrivers);

// 7. Test endpoint for debugging
router.post('/test', testNotificationEndpoint);

export default router;
