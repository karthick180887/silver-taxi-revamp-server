/**
 * Quick script to assign booking SLTB260102443 to driver with phone 9944226010
 * Run with: npx ts-node scripts/assign-booking-now.ts
 */

import { sequelize } from '../common/db/postgres';
import { Driver } from '../v1/core/models/driver';
import { Booking } from '../v1/core/models/booking';
import axios from 'axios';

const BOOKING_ID = 'SLTB260102443';
const DRIVER_PHONE = '9944226010';
const API_URL = process.env.API_URL || 'http://localhost:3060';

async function assignBookingNow() {
  try {
    console.log('🔍 Finding driver by phone:', DRIVER_PHONE);
    
    // Try different phone formats
    const phoneVariations = [
      DRIVER_PHONE,
      `+91${DRIVER_PHONE}`,
      `91${DRIVER_PHONE}`,
      `+${DRIVER_PHONE}`,
    ];
    
    let driver = null;
    for (const phone of phoneVariations) {
      driver = await Driver.findOne({
        where: { phone },
      });
      if (driver) {
        console.log(`✅ Found driver with phone format: ${phone}`);
        break;
      }
    }
    
    // Also try LIKE search
    if (!driver) {
      const drivers = await Driver.findAll({
        where: {
          phone: {
            [require('sequelize').Op.like]: `%${DRIVER_PHONE}%`,
          },
        },
        limit: 1,
      });
      if (drivers.length > 0) {
        driver = drivers[0];
        console.log(`✅ Found driver with LIKE search`);
      }
    }

    if (!driver) {
      console.error('❌ Driver not found with phone:', DRIVER_PHONE);
      console.log('\n💡 Available drivers (showing first 5):');
      const allDrivers = await Driver.findAll({
        attributes: ['driverId', 'name', 'phone', 'adminId', 'isActive'],
        limit: 5,
      });
      allDrivers.forEach(d => {
        console.log(`   - ${d.phone} (${d.driverId}) - ${d.name}`);
      });
      process.exit(1);
    }

    console.log('\n✅ Driver found:');
    console.log(`   Driver ID: ${driver.driverId}`);
    console.log(`   Name: ${driver.name}`);
    console.log(`   Phone: ${driver.phone}`);
    console.log(`   Admin ID: ${driver.adminId}`);
    console.log(`   Active: ${driver.isActive}`);

    if (!driver.isActive) {
      console.error('\n❌ Driver is not active. Cannot assign booking.');
      process.exit(1);
    }

    // Check booking
    console.log('\n🔍 Checking booking:', BOOKING_ID);
    const booking = await Booking.findOne({
      where: { bookingId: BOOKING_ID },
    });

    if (!booking) {
      console.error(`❌ Booking not found: ${BOOKING_ID}`);
      process.exit(1);
    }

    console.log('✅ Booking found:');
    console.log(`   Booking ID: ${booking.bookingId}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Admin ID: ${booking.adminId}`);
    console.log(`   Current Driver: ${booking.driverId || 'None'}`);

    // Use booking's adminId if driver's adminId is not available
    const adminId = driver.adminId || booking.adminId;
    if (!adminId) {
      console.error('❌ Cannot determine adminId');
      process.exit(1);
    }

    // Call API
    console.log('\n🚀 Assigning booking via API...');
    console.log(`   API: ${API_URL}/admin/bookings/assign-driver`);
    console.log(`   Booking: ${BOOKING_ID}`);
    console.log(`   Driver: ${driver.driverId}`);
    console.log(`   Admin: ${adminId}`);

    const response = await axios.post(
      `${API_URL}/admin/bookings/assign-driver`,
      {
        bookingId: BOOKING_ID,
        driverId: driver.driverId,
        adminId: adminId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('\n✅ Booking assigned successfully!');
    console.log('\nResponse:', JSON.stringify(response.data, null, 2));
    console.log('\n📱 Notifications sent:');
    console.log('   ✅ Socket.IO (NEW_TRIP_OFFER event)');
    console.log('   ✅ FCM Push Notification');
    console.log('   ✅ Driver notification record created');
    console.log('\n🎉 Done!');
  } catch (error: any) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received. Is the server running at:', API_URL);
      console.error('   Error:', error.message);
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

assignBookingNow();

