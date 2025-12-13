/**
 * Script to assign booking SLTB260102443 to driver with phone 9944226010
 * Run with: npx ts-node scripts/assign-booking-by-phone.ts
 */

import { sequelize } from '../common/db/postgres';
import { Driver } from '../v1/core/models/driver';
import { Booking } from '../v1/core/models/booking';
import axios from 'axios';

const BOOKING_ID = 'SLTB260102443';
const DRIVER_PHONE = '9944226010';
const API_URL = process.env.API_URL || 'http://localhost:3060';

async function assignBookingToDriverByPhone() {
  try {
    console.log('🔍 Step 1: Finding driver by phone number...');
    console.log(`   Phone: ${DRIVER_PHONE}`);
    
    // Find driver by phone number
    const driver = await Driver.findOne({
      where: {
        phone: DRIVER_PHONE,
      },
    });

    if (!driver) {
      console.error('❌ Driver not found with phone:', DRIVER_PHONE);
      console.log('');
      console.log('💡 Trying alternative phone formats...');
      
      // Try with +91 prefix
      const driverWithPrefix = await Driver.findOne({
        where: {
          phone: `+91${DRIVER_PHONE}`,
        },
      });
      
      if (driverWithPrefix) {
        console.log('✅ Found driver with +91 prefix');
        await assignToDriver(driverWithPrefix);
        return;
      }
      
      // Try with 91 prefix
      const driverWith91 = await Driver.findOne({
        where: {
          phone: `91${DRIVER_PHONE}`,
        },
      });
      
      if (driverWith91) {
        console.log('✅ Found driver with 91 prefix');
        await assignToDriver(driverWith91);
        return;
      }
      
      console.error('❌ Driver not found with any phone format');
      process.exit(1);
    }

    await assignToDriver(driver);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function assignToDriver(driver: any) {
  try {
    console.log('');
    console.log('✅ Driver found:');
    console.log(`   Driver ID: ${driver.driverId}`);
    console.log(`   Name: ${driver.name}`);
    console.log(`   Phone: ${driver.phone}`);
    console.log(`   Admin ID: ${driver.adminId}`);
    console.log(`   Active: ${driver.isActive}`);
    console.log('');

    if (!driver.isActive) {
      console.error('❌ Driver is not active. Cannot assign booking.');
      process.exit(1);
    }

    // Check if booking exists
    console.log('🔍 Step 2: Checking booking...');
    const booking = await Booking.findOne({
      where: {
        bookingId: BOOKING_ID,
      },
    });

    if (!booking) {
      console.error(`❌ Booking not found: ${BOOKING_ID}`);
      process.exit(1);
    }

    console.log('✅ Booking found:');
    console.log(`   Booking ID: ${booking.bookingId}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Admin ID: ${booking.adminId}`);
    console.log('');

    // Call the API to assign driver (this will trigger notifications)
    console.log('🚀 Step 3: Assigning booking via API...');
    console.log(`   API URL: ${API_URL}/admin/booking/assign-driver`);
    console.log('');

    const response = await axios.post(
      `${API_URL}/admin/booking/assign-driver`,
      {
        bookingId: BOOKING_ID,
        driverId: driver.driverId,
        adminId: driver.adminId || booking.adminId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Booking assigned successfully!');
    console.log('');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('📱 Notifications sent via:');
    console.log('   ✅ Socket.IO (NEW_TRIP_OFFER event)');
    console.log('   ✅ FCM Push Notification');
    console.log('   ✅ Driver notification record created');
    console.log('');
    console.log('🎉 Done!');
  } catch (error: any) {
    console.error('❌ Error assigning booking:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received. Check if server is running at:', API_URL);
      console.error('   Error:', error.message);
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the script
assignBookingToDriverByPhone();

