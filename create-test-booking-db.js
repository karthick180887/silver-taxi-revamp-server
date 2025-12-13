// Script to create a test booking directly in the database
const { Sequelize } = require('sequelize');

// Database connection (adjust as needed)
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'silver_taxi',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    logging: false
});

async function createTestBooking() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        const [results] = await sequelize.query(`
            INSERT INTO bookings (
                "adminId",
                "name",
                "email",
                "phone",
                "pickup",
                "drop",
                "pickupDateTime",
                "serviceType",
                "vehicleType",
                "status",
                "type",
                "paymentMethod",
                "paymentStatus",
                "estimatedAmount",
                "discountAmount",
                "finalAmount",
                "advanceAmount",
                "upPaidAmount",
                "distance",
                "assignAllDriver",
                "driverAccepted",
                "createdBy",
                "startOtp",
                "endOtp",
                "createdAt",
                "updatedAt"
            ) VALUES (
                :adminId,
                :name,
                :email,
                :phone,
                :pickup,
                :drop,
                :pickupDateTime,
                :serviceType,
                :vehicleType,
                :status,
                :type,
                :paymentMethod,
                :paymentStatus,
                :estimatedAmount,
                :discountAmount,
                :finalAmount,
                :advanceAmount,
                :upPaidAmount,
                :distance,
                :assignAllDriver,
                :driverAccepted,
                :createdBy,
                :startOtp,
                :endOtp,
                NOW(),
                NOW()
            )
            RETURNING "bookingId", "id", "adminId", "status", "assignAllDriver", "driverAccepted"
        `, {
            replacements: {
                adminId: 'admin-1',  // Adjust if needed
                name: 'Test Customer',
                email: 'test@example.com',
                phone: '9876543210',
                pickup: 'Test Pickup Location, Test City',
                drop: 'Test Drop Location, Test City',
                pickupDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                serviceType: 'One way',
                vehicleType: 'Sedan',
                status: 'Booking Confirmed',
                type: 'Manual',
                paymentMethod: 'Cash',
                paymentStatus: 'Unpaid',
                estimatedAmount: 500,
                discountAmount: 0,
                finalAmount: 500,
                advanceAmount: 0,
                upPaidAmount: 500,
                distance: 10,
                assignAllDriver: true,  // Broadcast to all drivers
                driverAccepted: 'pending',
                createdBy: 'Admin',
                startOtp: '1234',
                endOtp: '5678'
            }
        });

        if (results && results.length > 0) {
            const booking = results[0];
            console.log('\n✅ Test booking created successfully!');
            console.log('Booking Details:');
            console.log(`  Booking ID: ${booking.bookingId}`);
            console.log(`  Admin ID: ${booking.adminId}`);
            console.log(`  Status: ${booking.status}`);
            console.log(`  Assign All Drivers: ${booking.assignAllDriver}`);
            console.log(`  Driver Accepted: ${booking.driverAccepted}`);
            console.log('\n📱 This booking should now appear in the Flutter app as a new trip offer!');
        } else {
            console.log('⚠️ Booking created but no data returned');
        }

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error creating test booking:', error.message);
        if (error.original) {
            console.error('Original error:', error.original.message);
        }
        process.exit(1);
    }
}

createTestBooking();

