// Script to create a test booking directly in the database
import { sequelize } from './src/common/db/postgres';
import { Booking } from './src/v1/core/models/booking';
import dayjs from './src/utils/dayjs';

async function createTestBooking() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Generate booking ID format
        const phone = '9876543210';
        let cleanedPhone = phone.replace(/^\+?91|\D/g, '');
        cleanedPhone = cleanedPhone.slice(0, 6);

        const pickupDateTime = dayjs().add(2, 'hours').toDate();

        // Create the booking
        const newBooking = await Booking.create({
            adminId: 'admin-1',  // You may need to adjust this
            name: 'Test Customer',
            email: 'test@example.com',
            phone: `91 ${cleanedPhone}`,
            pickup: 'Test Pickup Location, Test City',
            drop: 'Test Drop Location, Test City',
            pickupDateTime,
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
            endOtp: '5678',
        } as any);

        // Generate bookingId
        newBooking.bookingId = `SLTB${cleanedPhone}${newBooking.id}`;
        await newBooking.save();

        console.log('\n✅ Test booking created successfully!');
        console.log('Booking Details:');
        console.log(`  Booking ID: ${newBooking.bookingId}`);
        console.log(`  Admin ID: ${newBooking.adminId}`);
        console.log(`  Status: ${newBooking.status}`);
        console.log(`  Assign All Drivers: ${newBooking.assignAllDriver}`);
        console.log(`  Driver Accepted: ${newBooking.driverAccepted}`);
        console.log(`  Pickup: ${newBooking.pickup}`);
        console.log(`  Drop: ${newBooking.drop}`);
        console.log(`  Fare: ₹${newBooking.finalAmount}`);
        console.log('\n📱 This booking should now appear in the Flutter app as a new trip offer!');
        console.log('🔔 Socket.IO event should be emitted to all connected drivers!');

        await sequelize.close();
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error creating test booking:', error.message);
        if (error.original) {
            console.error('Original error:', error.original.message);
        }
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

createTestBooking();

