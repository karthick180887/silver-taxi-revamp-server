import { z } from 'zod';
import dayjs from '../../utils/dayjs';

// Helper function to check if date is in the future using DayJS
const isFutureDate = (date: string) => {
    const parsedDate = dayjs(date);
    return parsedDate.isValid() && parsedDate.isAfter(dayjs());
};

// Helper function to validate date format
const isValidDateFormat = (date: string) => {
    return dayjs(date).isValid();
};

// Schema for creating custom notification
export const createCustomNotificationSchema = z.object({
    // Required fields from NotificationTemplates model
    title: z.string()
        .min(1, "Title is required")
        .max(255, "Title cannot exceed 255 characters"),
    message: z.string()
        .min(1, "Message is required")
        .max(1000, "Message cannot exceed 1000 characters"),
    
    // Optional fields that map to NotificationTemplates model
    target: z.enum(['vendor', 'driver', 'customer', 'none'], {
        errorMap: () => ({ message: "Target must be one of: vendor, driver, customer, none" })
    }).optional().default('customer'),
    type: z.string()
        .max(255, "Type cannot exceed 255 characters")
        .optional()
        .default('custom_notification'),
    route: z.string()
        .max(255, "Route cannot exceed 255 characters")
        .optional()
        .nullable(),
    particularIds: z.array(z.string())
        .optional()
        .default([]),
    
    // Fields that go into the data JSON object
    // Note: image is handled separately in controller for file upload
    targetAudience: z.enum(['all', 'specific', 'vendor'], {
        errorMap: () => ({ message: "Target audience must be one of: all, specific, vendor" })
    }).optional().default('all'),
    targetCustomerIds: z.array(z.string()).optional().default([]),
    vendorId: z.string().optional().nullable(),
    
    // Scheduling fields
    scheduledAt: z.string()
        .refine(isValidDateFormat, "Invalid date format")
        .refine(isFutureDate, "Scheduled date must be in the future")
        .optional(),
    time: z.string()
        .max(20, "Time string cannot exceed 20 characters")
        .optional()
        .nullable()
}).refine((data) => {
    // Validation for specific target audience
    if (data.targetAudience === 'specific') {
        return data.particularIds && data.particularIds.length > 0;
    }
    return true;
}, {
    message: "At least one customer ID is required for specific audience",
    path: ["targetCustomerIds"]
}).refine((data) => {
    // Validation for particularIds when target is specified
    if (data.particularIds && data.particularIds.length > 0) {
        if (data.target === 'customer' || data.target === 'driver') {
            return true;
        }
        return false;
    }
    return true;
}, {
    message: "Target must be 'customer' or 'driver' when particularIds are provided",
    path: ["target"]
});

// Schema for updating custom notification
export const updateCustomNotificationSchema = z.object({
    // Optional fields that can be updated
    title: z.string()
        .min(1, "Title must be at least 1 character long")
        .max(255, "Title cannot exceed 255 characters")
        .optional(),
    message: z.string()
        .min(1, "Message must be at least 1 character long")
        .max(1000, "Message cannot exceed 1000 characters")
        .optional(),
    target: z.enum(['vendor', 'driver', 'customer', 'none'], {
        errorMap: () => ({ message: "Target must be one of: vendor, driver, customer, none" })
    }).optional(),
    type: z.string()
        .max(255, "Type cannot exceed 255 characters")
        .optional(),
    route: z.string()
        .max(255, "Route cannot exceed 255 characters")
        .optional()
        .nullable(),
    particularIds: z.array(z.string()).optional(),
    
    // Fields that go into the data JSON object
    // Note: image is handled separately in controller for file upload
    targetAudience: z.enum(['all', 'specific', 'vendor'], {
        errorMap: () => ({ message: "Target audience must be one of: all, specific, vendor" })
    }).optional(),
    targetCustomerIds: z.array(z.string()).optional(),
    vendorId: z.string().optional().nullable(),
    
    // Scheduling fields
    scheduledAt: z.string()
        .refine(isValidDateFormat, "Invalid date format")
        .refine(isFutureDate, "Scheduled date must be in the future")
        .optional(),
    time: z.string()
        .max(20, "Time string cannot exceed 20 characters")
        .optional()
        .nullable()
}).refine((data) => {
    // Validation for specific target audience
    if (data.targetAudience === 'specific') {
        return data.targetCustomerIds && data.targetCustomerIds.length > 0;
    }
    return true;
}, {
    message: "At least one customer ID is required for specific audience",
    path: ["targetCustomerIds"]
}).refine((data) => {
    // Validation for particularIds when target is specified
    if (data.particularIds && data.particularIds.length > 0) {
        if (data.target === 'customer' || data.target === 'driver') {
            return true;
        }
        return false;
    }
    return true;
}, {
    message: "Target must be 'customer' or 'driver' when particularIds are provided",
    path: ["target"]
});

// Schema for query parameters
export const getCustomNotificationsQuerySchema = z.object({
    target: z.enum(['vendor', 'driver', 'customer', 'none']).optional(),
    type: z.string().optional()
});

// Schema for templateId parameter
export const customNotificationIdSchema = z.object({
    templateId: z.string()
        .min(1, "Template ID is required")
});

// Schema for send notification request
export const sendCustomNotificationSchema = z.object({});

// Schema for filtering notifications
export const filterCustomNotificationsSchema = z.object({
    status: z.boolean().optional(),
    target: z.enum(['vendor', 'driver', 'customer', 'none']).optional(),
    type: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number()
        .int("Page must be an integer")
        .min(1, "Page must be at least 1")
        .default(1),
    limit: z.coerce.number()
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
        .default(10)
});
