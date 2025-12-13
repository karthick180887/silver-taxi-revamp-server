/**
 * Script to assign booking SLTB260102443 to driver with phone 9944226010
 * Run with: node assign-booking-to-driver.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3060';
const BOOKING_ID = 'SLTB260102443';
const DRIVER_PHONE = '9944226010';

async function assignBookingToDriver() {
  try {
    console.log('🔍 Step 1: Finding driver by phone number...');
    
    // First, we need to find the driver by phone number
    // This might require querying the database or using an admin API
    // For now, let's try to find the driver through the admin API if available
    // Or we can use a direct database query
    
    console.log('📝 Note: This script requires:');
    console.log('   1. Driver lookup by phone number');
    console.log('   2. Admin ID');
    console.log('   3. API endpoint: POST /admin/booking/assign-driver');
    console.log('');
    console.log('📋 Required API call:');
    console.log('   POST /admin/booking/assign-driver');
    console.log('   Body: {');
    console.log(`     "bookingId": "${BOOKING_ID}",`);
    console.log(`     "driverId": "<DRIVER_ID_FROM_PHONE>",`);
    console.log('     "adminId": "<ADMIN_ID>"');
    console.log('   }');
    console.log('');
    console.log('💡 The API will automatically:');
    console.log('   - Assign the booking to the driver');
    console.log('   - Send Socket.IO notification (NEW_TRIP_OFFER event)');
    console.log('   - Send FCM push notification');
    console.log('   - Create driver notification record');
    
    // If you have direct database access, you can run this SQL:
    console.log('');
    console.log('🗄️  SQL Query to find driver:');
    console.log(`   SELECT "driverId", "adminId", "name", "phone" FROM drivers WHERE phone = '${DRIVER_PHONE}' OR phone LIKE '%${DRIVER_PHONE}%';`);
    console.log('');
    console.log('📞 Then use the driverId in the API call above.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// If you want to make the actual API call, uncomment and fill in the values:
/*
async function makeAssignment() {
  const ADMIN_ID = 'YOUR_ADMIN_ID'; // Get from database or config
  const DRIVER_ID = 'YOUR_DRIVER_ID'; // Get from SQL query above
  
  try {
    const response = await axios.post(`${BASE_URL}/admin/booking/assign-driver`, {
      bookingId: BOOKING_ID,
      driverId: DRIVER_ID,
      adminId: ADMIN_ID,
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if required
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    console.log('✅ Booking assigned successfully!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Error assigning booking:', error.response?.data || error.message);
  }
}
*/

assignBookingToDriver();

