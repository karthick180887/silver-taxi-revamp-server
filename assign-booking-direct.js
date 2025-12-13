/**
 * Direct script to assign booking SLTB260102443 to driver with phone 9944226010
 * Run with: node assign-booking-direct.js
 * 
 * Prerequisites: 
 * 1. Backend server must be running
 * 2. You need to get driverId and adminId from database first
 */

const axios = require('axios');

const BOOKING_ID = 'SLTB260102443';
const DRIVER_PHONE = '9944226010';
const API_URL = process.env.API_URL || 'http://localhost:3060';

console.log('📋 To assign this booking, you need to:');
console.log('');
console.log('Step 1: Run this SQL query to find the driver:');
console.log(`SELECT "driverId", "adminId", "name", "phone" FROM drivers WHERE phone = '${DRIVER_PHONE}' OR phone LIKE '%${DRIVER_PHONE}%';`);
console.log('');
console.log('Step 2: Update the variables below and run this script again:');
console.log('');

// TODO: Update these after running the SQL query
const DRIVER_ID = 'YOUR_DRIVER_ID_HERE';
const ADMIN_ID = 'YOUR_ADMIN_ID_HERE';

if (DRIVER_ID === 'YOUR_DRIVER_ID_HERE' || ADMIN_ID === 'YOUR_ADMIN_ID_HERE') {
  console.log('❌ Please update DRIVER_ID and ADMIN_ID first!');
  console.log('');
  console.log('After updating, run: node assign-booking-direct.js');
  process.exit(1);
}

async function assignBooking() {
  try {
    console.log('🚀 Assigning booking...');
    console.log(`   Booking ID: ${BOOKING_ID}`);
    console.log(`   Driver ID: ${DRIVER_ID}`);
    console.log(`   Admin ID: ${ADMIN_ID}`);
    console.log('');

    const response = await axios.post(
      `${API_URL}/admin/bookings/assign-driver`,
      {
        bookingId: BOOKING_ID,
        driverId: DRIVER_ID,
        adminId: ADMIN_ID,
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
    console.log('📱 Notifications sent via API:');
    console.log('   ✅ Socket.IO (NEW_TRIP_OFFER event)');
    console.log('   ✅ FCM Push Notification');
    console.log('   ✅ Driver notification record created');
    console.log('');
    console.log('🎉 Done! Driver with phone', DRIVER_PHONE, 'should receive the notification.');
  } catch (error) {
    console.error('❌ Error assigning booking:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received. Is server running at:', API_URL);
      console.error('   Error:', error.message);
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

assignBooking();

