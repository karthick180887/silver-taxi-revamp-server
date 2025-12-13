import express from 'express';
import {
    getAllNotification,
    markAsRead,
    markAllAsRead,
    getAllOffsetNotification,
    getSingleNotification,
    bulkDeleteNotifications,
} from '../controller/driverNotification.controller';

const router = express.Router();


// Route to get all notifications
router.get('/all', getAllNotification);

// Route to get all notifications with offset
router.get('/offset', getAllOffsetNotification);
router.get('/', getAllOffsetNotification);

router.get('/:id', getSingleNotification);

// Route to mark all notifications as read
router.put('/read-all', markAllAsRead);

// Route to mark a specific notification as read
router.put('/read/:id', markAsRead);

router.delete('/delete', bulkDeleteNotifications);


export default router;
