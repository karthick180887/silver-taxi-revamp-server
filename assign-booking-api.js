/**
 * API script to assign booking SLTB260102443 to driver with phone 9944226010
 * 
 * Prerequisites:
 * 1. Find driverId by running: SELECT "driverId", "adminId" FROM drivers WHERE phone = '9944226010';
 * 2. Update DRIVER_ID and ADMIN_ID below
 * 3. Update BASE_URL if needed
 * 4. Add auth token if API requires authentication
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3060';
const BOOKING_ID = 'SLTB260102443';

// TODO: Update these values after running the SQL query
const DRIVER_ID = 'YOUR_DRIVER_ID_HERE'; // Get from: SELECT "driverId" FROM drivers WHERE phone = '9944226010';
const ADMIN_ID = 'YOUR_ADMIN_ID_HERE';   // Get from: SELECT "adminId" FROM drivers WHERE phone = '9944226010';

async function assignBooking() {
  if (DRIVER_ID === 'YOUR_DRIVER_ID_HERE' || ADMIN_ID === 'YOUR_ADMIN_ID_HERE') {
    console.error('❌ Please update DRIVER_ID and ADMIN_ID in this script first!');
    console.log('');
    console.log('Run this SQL query to get the values:');
    console.log("SELECT \"driverId\", \"adminId\" FROM drivers WHERE phone = '9944226010';");
    return;
  }

  try {
    console.log('🚀 Assigning booking to driver...');
    console.log(`   Booking ID: ${BOOKING_ID}`);
    console.log(`   Driver ID: ${DRIVER_ID}`);
    console.log(`   Admin ID: ${ADMIN_ID}`);
    console.log('');

    const response = await axios.post(
      `${BASE_URL}/admin/booking/assign-driver`,
      {
        bookingId: BOOKING_ID,
        driverId: DRIVER_ID,
        adminId: ADMIN_ID,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Uncomment and add if API requires authentication:
          // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
        },
        timeout: 30000, // 30 seconds
      }
    );

    console.log('✅ Booking assigned successfully!');
    console.log('');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('📱 Notifications sent via:');
    console.log('   - Socket.IO (NEW_TRIP_OFFER event)');
    console.log('   - FCM Push Notification');
    console.log('   - Driver notification record created');
  } catch (error) {
    console.error('❌ Error assigning booking:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received. Check if server is running at:', BASE_URL);
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

assignBooking();

