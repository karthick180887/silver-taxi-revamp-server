# 🚀 Silver Taxi Revamp Server - Coding Rules & Standards

## 📋 Table of Contents
1. [Project Structure](#project-structure)
2. [Code Organization](#code-organization)
3. [Function & Logic Rules](#function--logic-rules)
4. [Documentation Standards](#documentation-standards)
5. [Error Handling](#error-handling)
6. [Performance Guidelines](#performance-guidelines)
7. [Security Standards](#security-standards)
8. [Testing Guidelines](#testing-guidelines)
9. [Database Rules](#database-rules)
10. [API Design Rules](#api-design-rules)

---

## 🏗️ Project Structure

### Directory Organization
```
src/
├── app.ts                    # Main Express app configuration
├── server.ts                 # HTTP server setup and initialization
├── common/                   # Shared utilities and services
│   ├── configs/             # Configuration files
│   ├── db/                  # Database connections
│   ├── functions/           # Shared global business logic only
│   ├── middleware/          # Express middleware
│   ├── services/            # External service integrations
│   ├── types/               # Global typeScript type definitions
│   └── validations/         # Input validation schemas using zod only 
├── utils/                   # Utility functions
│   ├── cron/                # Cron Folder for cron jobs  
│   ├── dayjs.ts             # Function use to handle the date Fn or date manipulation 
│   ├── env.ts               # Use env values for avoid process.env.value 
│   ├── logger.ts            # Inside 3 log function for logger(req logs),infoLogger(Fn |Controller entry and exit) , debugLogger (debug the catch error or Fn value)
│   ├── minio.image.ts       # Use minio to upload images           
│   ├── multer.fileUpload.ts # Use to process the images in buffer                      
├── v1/                      # API version 1
│   ├── admin/               # Admin panel APIs
│   ├── apps/                # Apps APIs
│   │   ├── driver/          # Driver app APIs 
│   │   ├── customer/        # Customer app APIs 
│   ├── core/                # Core business logic
│   │   ├── function         # Inside all types of Fn 
│   │   ├── models/          # All sequelize model inside 'DB Table' (index.ts - model sync && table relationships ) 
│   ├── public/              # Public APIs
│   ├── website/             # v1 folder inside used function and model,controller  APIs
│   ├── types/               # Website APIs
│   └── webhook/             # Webhook handlers (now only in the razorpay)


```

### File Naming Conventions
- **Controllers**: `*.controller.ts` (e.g., `bookingController.ts`)
- **Routers**: `*.router.ts` or `*.route.ts` (e.g., `bookingRouter.ts`)
- **Models**: `*.ts` (e.g., `booking.ts`)
- **Services**: `*.service.ts` (e.g., `mail.service.ts`)
- **Middleware**: `*.ts` (e.g., `auth.ts`)
- **Types**: `*.d.ts` or `*.ts` (e.g., `booking.d.ts`)

---

## 📦 Code Organization

### 1. Import Organization
```typescript
// 1. Node.js built-ins
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';

// 2. Third-party libraries
import cors from 'cors';
import dayjs from 'dayjs';

// 3. Internal modules (absolute paths)
import { auth } from './common/middleware/auth';
import { logger } from './utils/logger';

// 4. Relative imports
import { Booking } from '../models/booking';

import { debugLogger as debug, infoLogger as log } from "../../../utils/logger";
# used
  log.info(`Commission Calculation Start $>> ${{
            debitedId,
            amount,
            serviceId,
            debitedBy,
            bookingId,
            creditAmount
        }}`);

 debug.info(`Trip complete error: ${error}`);


### 2. Class and Interface Organization
```typescript
// 1. Interfaces first
interface BookingAttributes {
    id: number;
    bookingId: string;
    // ... other properties
}

// 2. Type definitions
type BookingStatus = "Started" | "Completed" | "Cancelled" | "Not-Started";

// 3. Classes
class Booking extends Model<BookingAttributes> implements BookingAttributes {
    // Properties
    public id!: number;
    public bookingId!: string;
    
    // Methods
    public static async findByBookingId(bookingId: string) {
        // Implementation
    }
}
```

### 3. Function Organization
```typescript
// 1. Helper/Utility functions
const generateTransactionId = async (): Promise<string> => {
    // Implementation
};

// 2. Business logic functions
const calculateCommission = async (params: CommissionParams): Promise<CommissionResult> => {
    // Implementation
};

// 3. Controller functions
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    // Implementation
};
```

---

## ⚙️ Function & Logic Rules

### 1. Function Structure
```typescript
/**
 * Creates a new booking with validation and business logic
 * @param req - Express request object
 * @param res - Express response object
 * @returns Promise<void>
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Input validation
        const { adminId, customerId, pickup, drop } = req.body;
        
        if (!adminId || !customerId) {
            res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
            return;
        }

        // 2. Business logic
        const booking = await Booking.create({
            bookingId: await generateBookingId(),
            adminId,
            customerId,
            pickup,
            drop,
            // ... other fields
        });

        // 3. Side effects (notifications, emails, etc.)
        await sendBookingConfirmation(booking);
        await createNotification({
            title: "New Booking",
            message: `Booking ${booking.bookingId} created`,
            adminId
        });

        // 4. Response
        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking
        });

    } catch (error) {
        logger.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
```

### 2. Business Logic Separation
```typescript
// ✅ GOOD: Separate business logic into dedicated functions
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookingData = req.body;
        
        // Validate input
        const validation = await validateBookingData(bookingData);
         if (!validData.success) {
            const formattedErrors = validData.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: formattedErrors,
            });
            return;
        }

        // Calculate pricing
        const pricing = await calculateBookingPrice(bookingData);
        
        // Create booking
        const booking = await createBookingRecord({
            ...bookingData,
            ...pricing
        });

        // Handle side effects
        await handleBookingSideEffects(booking);

        res.status(201).json({
            success: true,
            data: booking
        });

    } catch (error) {
        debug.info(`# Driver signup for adminId: ${adminId} type ${type} error >> ${error}`);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
};

// ❌ BAD: All logic in controller
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    // 200+ lines of mixed logic
};
```

## 📝 Documentation Standards

### 1. Function Documentation
```typescript
/**
 * Calculates commission for a booking transaction
 * 
 * @param params - Commission calculation parameters
 * @param params.debitedId - ID of the entity being debited
 * @param params.amount - Transaction amount
 * @param params.serviceId - Service ID for commission calculation
 * @param params.debitedBy - Type of entity (Vendor or Driver)
 * @param params.bookingId - Associated booking ID
 * @param params.creditAmount - Optional credit amount (default: 0)
 * 
 * @returns Promise<CommissionCalculationResult> - Commission calculation result
 * 
 * @example
 * ```typescript
 * const result = await commissionCalculation({
 *   debitedId: "driver123",
 *   amount: 1000,
 *   serviceId: "service456",
 *   debitedBy: "Driver",
 *   bookingId: "booking789"
 * });
 * ```
 * 
 * @throws {Error} When service not found
 * @throws {Error} When user or wallet not found
 */
export const commissionCalculation = async ({
    debitedId, amount, serviceId,
    debitedBy, bookingId, creditAmount = 0
}: CommissionCalculationParams): Promise<CommissionCalculationResult> => {
    // Implementation
};
```

### 2. Interface Documentation
```typescript
/**
 * Represents a booking entity in the system
 * 
 * @interface BookingAttributes
 * @property {number} id - Primary key
 * @property {string} bookingId - Unique booking identifier
 * @property {string} adminId - Associated admin ID
 * @property {string} customerId - Associated customer ID
 * @property {string} name - Customer name
 * @property {string} phone - Customer phone number
 * @property {Date} pickupDateTime - Pickup date and time
 * @property {string} pickup - Pickup location
 * @property {string} drop - Drop location
 * @property {number} distance - Trip distance in kilometers
 * @property {number} estimatedAmount - Estimated trip cost
 * @property {number} finalAmount - Final trip cost after discounts
 * @property {BookingStatus} status - Current booking status
 * @property {PaymentMethod} paymentMethod - Payment method used
 * @property {PaymentStatus} paymentStatus - Payment status
 * @property {string} createdBy - Who created the booking
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
interface BookingAttributes {
    id: number;
    bookingId: string;
    adminId: string;
    customerId: string;
    name: string;
    phone: string;
    pickupDateTime: Date;
    pickup: string;
    drop: string;
    distance: number;
    estimatedAmount: number;
    finalAmount: number;
    status: BookingStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    createdBy: "Admin" | "Vendor" | "User";
    createdAt: Date;
    updatedAt: Date;
}
```

### 3. Class Documentation
```typescript
/**
 * Booking model representing taxi booking entities
 * 
 * Handles all booking-related database operations including:
 * - Creating new bookings
 * - Updating booking status
 * - Calculating pricing
 * - Managing payment status
 * 
 * @class Booking
 * @extends {Model<BookingAttributes, BookingCreationAttributes>}
 * @implements {BookingAttributes}
 * 
 * @example
 * ```typescript
 * // Create a new booking
 * const booking = await Booking.create({
 *   bookingId: "BK123456",
 *   adminId: "admin123",
 *   customerId: "customer456",
 *   name: "John Doe",
 *   phone: "1234567890",
 *   pickupDateTime: new Date(),
 *   pickup: "Airport",
 *   drop: "Downtown",
 *   distance: 25.5,
 *   estimatedAmount: 500,
 *   finalAmount: 450,
 *   status: "Not-Started",
 *   paymentMethod: "Cash",
 *   paymentStatus: "Unpaid",
 *   createdBy: "Admin"
 * });
 * 
 * // Find booking by ID
 * const booking = await Booking.findOne({
 *   where: { bookingId: "BK123456" }
 * });
 * ```
 */
class Booking extends Model<BookingAttributes, BookingCreationAttributes> 
    implements BookingAttributes {
    
    // Properties documentation
    /** Primary key */
    public id!: number;
    
    /** Unique booking identifier */
    public bookingId!: string;
    
    /** Associated admin ID */
    public adminId!: string;
    
    // ... other properties
    
    /**
     * Finds booking by booking ID
     * 
     * @param bookingId - The booking ID to search for
     * @returns Promise<Booking | null> - Found booking or null
     */
    public static async findByBookingId(bookingId: string): Promise<Booking | null> {
        return this.findOne({ where: { bookingId } });
    }
    
    /**
     * Updates booking status
     * 
     * @param status - New status to set
     * @returns Promise<void>
     */
    public async updateStatus(status: BookingStatus): Promise<void> {
        this.status = status;
        await this.save();
    }
}
```

### 4. Module Documentation
```typescript
/**
 * @fileoverview Booking controller module
 * 
 * This module handles all booking-related HTTP requests including:
 * - CRUD operations for bookings
 * - Booking status management
 * - Driver assignment
 * - Payment processing
 * - Commission calculations
 * 
 * @module bookingController
 * @author Silver Taxi Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * @fileoverview Commission calculation utilities
 * 
 * Provides functions for calculating and processing commission
 * for drivers and vendors based on booking transactions.
 * 
 * @module commissionCalculation
 * @author Silver Taxi Team
 * @version 1.0.0
 * @since 2024-01-01
 */
```

---

## ⚡ Performance Guidelines

### 1. Database Optimization
```typescript
// ✅ GOOD: Optimized queries
const getBookingsWithDetails = async (adminId: string) => {
    return await Booking.findAll({
        where: { adminId },
        include: [
            {
                model: Customer,
                as: 'customer',
                attributes: ['name', 'phone', 'email']
            },
            {
                model: Driver,
                as: 'driver',
                attributes: ['name', 'phone']
            }
        ],
        attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
        order: [['createdAt', 'DESC']],
    });
};

// ❌ BAD: N+1 query problem
const getBookingsWithDetails = async (adminId: string) => {
    const bookings = await Booking.findAll({ where: { adminId } });
    
    for (const booking of bookings) {
        booking.customer = await Customer.findOne(booking.customerId);
        booking.driver = await Driver.findOne(booking.driverId);
    }
    
    return bookings;
};
```

### 3. Async/Await Best Practices
```typescript
// ✅ GOOD: Proper async/await usage
export const processBooking = async (bookingData: any): Promise<Booking> => {
    // Parallel operations
    const [customer, driver, tariff] = await Promise.all([
        Customer.findOne(bookingData.customerId),
        Driver.findOne(bookingData.driverId),
        Tariff.findOne(bookingData.tariffId)
    ]);
    
    // Sequential operations that depend on each other
    const pricing = await calculatePricing(tariff, bookingData);
    const booking = await Booking.create({
        ...bookingData,
        ...pricing
    });
    
    // Fire and forget operations
    Promise.all([
        sendBookingConfirmation(booking),
        createNotification(booking),
        updateDriverStatus(driver, 'assigned')
    ]).catch(error => {
        debug.info(`Background operations failed:', ${error}`);
    });
    
    return booking;
};
```


## 🔒 Security Standards

### 2. Authentication & Authorization
```typescript
// Role-based access control
import { auth, websiteAuth, appAuth } from './common/middleware/auth';

// Usage
app.use("/app", appAuth, appRouter)
app.use('/website', websiteAuth, websiteRouter)
app.use('/v1', auth, adminRouter)
```

---

## 🧪 Testing Guidelines

### 1. Unit Test Structure
```typescript
// bookingController.test.ts
import { createBooking, getBooking } from './bookingController';
import { Booking } from '../models/booking';

describe('Booking Controller', () => {
    beforeEach(() => {
        // Setup test database
        jest.clearAllMocks();
    });
    
    describe('createBooking', () => {
        it('should create a booking with valid data', async () => {
            // Arrange
            const mockReq = {
                body: {
                    adminId: 'admin123',
                    customerId: 'customer456',
                    pickup: 'Airport',
                    drop: 'Downtown',
                    pickupDateTime: new Date()
                }
            } as Request;
            
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;
            
            jest.spyOn(Booking, 'create').mockResolvedValue({
                bookingId: 'BK123456',
                ...mockReq.body
            } as any);
            
            // Act
            await createBooking(mockReq, mockRes);
            
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Booking created successfully",
                data: expect.objectContaining({
                    bookingId: 'BK123456'
                })
            });
        });
        
        it('should return 400 for missing required fields', async () => {
            // Arrange
            const mockReq = {
                body: {
                    adminId: 'admin123'
                    // Missing required fields
                }
            } as Request;
            
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;
            
            // Act
            await createBooking(mockReq, mockRes);
            
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('required')
            });
        });
    });
});
```

### 2. Integration Test Structure
```typescript
// booking.integration.test.ts
import request from 'supertest';
import app from '../app';
import { Booking } from '../models/booking';

describe('Booking API Integration', () => {
    beforeAll(async () => {
        // Setup test database
        await Booking.sync({ force: true });
    });
    
    afterAll(async () => {
        // Cleanup
        await Booking.destroy({ where: {} });
    });
    
    describe('POST /v1/bookings', () => {
        it('should create a booking successfully', async () => {
            const bookingData = {
                adminId: 'admin123',
                customerId: 'customer456',
                pickup: 'Airport',
                drop: 'Downtown',
                pickupDateTime: new Date().toISOString()
            };
            
            const response = await request(app)
                .post('/v1/bookings')
                .send(bookingData)
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.bookingId).toBeDefined();
        });
    });
});
```

---

## 🗄️ Database Rules

### 1. Model Associations
```typescript
// Define associations in models/index.ts
export const setupAssociations = (): void => {
    // One-to-Many relationships
    Customer.hasMany(Booking, { 
        foreignKey: 'customerId', 
        sourceKey: 'customerId', 
        as: 'bookings' 
    });
    Booking.belongsTo(Customer, { 
        foreignKey: 'customerId', 
        targetKey: 'customerId', 
        as: 'customer' 
    });
    
    // One-to-One relationships
    Driver.hasOne(DriverWallet, { 
        foreignKey: 'driverId', 
        sourceKey: 'driverId', 
        as: 'wallet' 
    });
    DriverWallet.belongsTo(Driver, { 
        foreignKey: 'driverId', 
        targetKey: 'driverId', 
        as: 'driver' 
    });
};
```

### 2. Migration Strategy
```typescript
// Database sync with proper ordering
export async function syncDatabase(options: SyncOptions = { alter: true }) {
    try {
        console.log("🔁 Starting database sync...");
        
        // 1. Core tables first
        await Admin.sync(options);
        await Vendor.sync(options);
        await Customer.sync(options);
        
        // 2. User-related tables
        await Driver.sync(options);
        await Vehicle.sync(options);
        
        // 3. Wallet system
        await DriverWallet.sync(options);
        await VendorWallet.sync(options);
        await WalletTransaction.sync(options);
        
        // 4. Business logic tables
        await Service.sync(options);
        await Tariff.sync(options);
        await Booking.sync(options);
        
        console.log("🎉 Database sync completed successfully.");
    } catch (error) {
        console.error("❌ Error syncing database:", error);
        throw error;
    }
}
```

---

## 🌐 API Design Rules

### 1. RESTful Endpoints
```typescript
// Standard REST patterns
const bookingRoutes = {
    // GET /bookings - List all bookings
    'GET /bookings': getAllBookings,
    
    // GET /bookings/:id - Get specific booking
    'GET /bookings/:id': getBookingById,
    
    // POST /bookings - Create new booking
    'POST /bookings': createBooking,
    
    // PUT /bookings/:id - Update booking
    'PUT /bookings/:id': updateBooking,
    
    // DELETE /bookings/:id - Delete booking
    'DELETE /bookings/:id': deleteBooking,
    
    // Custom actions
    'POST /bookings/:id/assign-driver': assignDriver,
    'POST /bookings/:id/start-trip': startTrip,
    'POST /bookings/:id/complete-trip': completeTrip
};
```

### 2. Response Format
```typescript
// Standard response format
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Success response
const successResponse = <T>(data: T, message: string = "Success"): ApiResponse<T> => ({
    success: true,
    message,
    data
});

// Error response
const errorResponse = (message: string, errors?: string[]): ApiResponse => ({
    success: false,
    message,
    errors
});
```

### 3. Pagination
```typescript
// Pagination helper
export const paginateResults = async <T>(
    query: any,
    page: number = 1,
    limit: number = 10
): Promise<{
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}> => {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await query.findAndCountAll({
        limit,
        offset,
        distinct: true
    });
    
    return {
        data: rows,
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    };
};
```

---

## 📊 Monitoring & Logging

### 1. Structured Logging
```typescript
// Enhanced logger with context
export const logBookingOperation = (
    operation: string,
    bookingId: string,
    adminId: string,
    details?: any
): void => {
    log.info('Booking operation', {
        operation,
        bookingId,
        adminId,
        timestamp: new Date().toISOString(),
        details
    });
};

// Usage
logBookingOperation('create', booking.bookingId, booking.adminId, {
    customerId: booking.customerId,
    amount: booking.finalAmount
});
```

### 2. Performance Monitoring
```typescript
// Request timing middleware
export const requestTimer = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });
    
    next();
};
```

---

## 🔄 Version Control Rules

### 1. Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(booking): add commission calculation logic
fix(auth): resolve token validation issue
docs(api): update booking endpoint documentation
refactor(utils): extract common validation functions
test(booking): add unit tests for createBooking
```

### 2. Branch Naming
- `feature/booking-commission-calculation`
- `bugfix/auth-token-validation`
- `hotfix/critical-payment-issue`
- `refactor/booking-controller`
- `docs/api-documentation`

---

## 📋 Code Review Checklist

### Before Submitting PR:
- [ ] Code follows project structure and naming conventions
- [ ] All functions have proper documentation
- [ ] Error handling is implemented
- [ ] Input validation is in place
- [ ] Database queries are optimized
- [ ] Security measures are implemented
- [ ] Tests are written and passing
- [ ] Logging is appropriate
- [ ] No console.log statements in production code
- [ ] TypeScript types are properly defined
- [ ] No hardcoded values
- [ ] Environment variables are used for configuration
- [ ] Code is properly formatted
- [ ] No unused imports or variables

---

For questions about these coding rules:
- Create an issue in the repository
- Contact the development team
- Refer to existing code examples in the codebase

---

*Last updated: January 2024*
*Version: 1.0.0* 