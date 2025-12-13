// Script to check new bookings in the database
// Run with: npx ts-node check-bookings.ts

import { sequelize } from './src/common/db/postgres';
import { Booking } from './src/v1/core/models';

async function checkBookings() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Count new bookings
    const totalNewBookings = await Booking.count({
      where: {
        status: 'Booking Confirmed',
        driverAccepted: 'pending',
      },
    });

    const broadcastBookings = await Booking.count({
      where: {
        status: 'Booking Confirmed',
        driverAccepted: 'pending',
        assignAllDriver: true,
        driverId: null,
      },
    });

    const assignedBookings = await Booking.count({
      where: {
        status: 'Booking Confirmed',
        driverAccepted: 'pending',
        driverId: { [sequelize.Sequelize.Op.ne]: null },
      },
    });

    console.log('📊 NEW BOOKINGS SUMMARY (Booking Confirmed, driverAccepted = pending):');
    console.log('==========================================');
    console.log(`Total New Bookings: ${totalNewBookings}`);
    console.log(`  - Broadcast (assignAllDriver=true, driverId=null): ${broadcastBookings}`);
    console.log(`  - Assigned to specific driver: ${assignedBookings}`);
    console.log('');

    // Get detailed list
    const bookings = await Booking.findAll({
      where: {
        status: 'Booking Confirmed',
        driverAccepted: 'pending',
      },
      attributes: [
        'bookingId',
        'driverId',
        'assignAllDriver',
        'status',
        'driverAccepted',
        'pickup',
        'drop',
        'createdAt',
        'adminId',
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    console.log('📋 RECENT NEW BOOKINGS (Last 20):');
    console.log('==========================================');
    if (bookings.length === 0) {
      console.log('No new bookings found.');
    } else {
      bookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking ID: ${booking.bookingId}`);
        console.log(`   Driver ID: ${booking.driverId || 'NULL (Broadcast)'}`);
        console.log(`   Assign All Drivers: ${booking.assignAllDriver ? 'Yes' : 'No'}`);
        console.log(`   Admin ID: ${booking.adminId}`);
        console.log(`   Created: ${booking.createdAt}`);
        console.log(`   Pickup: ${booking.pickup || 'N/A'}`);
        console.log(`   Drop: ${booking.drop || 'N/A'}`);
      });
    }

    // Check for specific driver if provided
    const driverId = process.argv[2];
    if (driverId) {
      console.log(`\n\n🔍 BOOKINGS FOR DRIVER: ${driverId}`);
      console.log('==========================================');

      const { Op } = sequelize.Sequelize;
      const driverBookings = await Booking.findAll({
        where: {
          status: 'Booking Confirmed',
          driverAccepted: 'pending',
          [Op.or]: [
            { driverId: driverId },
            { assignAllDriver: true, driverId: null },
          ],
        },
        attributes: [
          'bookingId',
          'driverId',
          'assignAllDriver',
          'status',
          'driverAccepted',
          'createdAt',
        ],
        order: [['createdAt', 'DESC']],
      });

      console.log(`Found ${driverBookings.length} bookings for driver ${driverId}:`);
      driverBookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking ID: ${booking.bookingId}`);
        console.log(`   Type: ${booking.driverId === driverId ? 'Assigned' : 'Broadcast'}`);
        console.log(`   Created: ${booking.createdAt}`);
      });
    }

    await sequelize.close();
    console.log('\n✅ Query completed.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkBookings();

