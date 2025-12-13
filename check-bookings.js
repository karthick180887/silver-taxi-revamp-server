// Script to check new bookings in the database
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.POSTGRES_HOST || 'db-postgresql-blr1-87455-do-user-23068629-0.f.db.ondigitalocean.com',
  port: Number(process.env.POSTGRES_PORT) || 25061,
  username: process.env.POSTGRES_USER || 'doadmin',
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || 'MaxPool2',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function checkBookings() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Query to count new bookings (Booking Confirmed status)
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_new_bookings,
        COUNT(CASE WHEN "assignAllDriver" = true AND "driverId" IS NULL THEN 1 END) as broadcast_bookings,
        COUNT(CASE WHEN "driverId" IS NOT NULL THEN 1 END) as assigned_bookings,
        COUNT(CASE WHEN "assignAllDriver" = true AND "driverId" IS NOT NULL THEN 1 END) as assigned_broadcast_bookings
      FROM bookings
      WHERE status = 'Booking Confirmed'
        AND "driverAccepted" = 'pending'
        AND "deletedAt" IS NULL
    `);

    console.log('📊 NEW BOOKINGS SUMMARY (Booking Confirmed, driverAccepted = pending):');
    console.log('==========================================');
    console.log(`Total New Bookings: ${results[0].total_new_bookings}`);
    console.log(`  - Broadcast (assignAllDriver=true, driverId=null): ${results[0].broadcast_bookings}`);
    console.log(`  - Assigned to specific driver: ${results[0].assigned_bookings}`);
    console.log(`  - Assigned broadcast (both conditions): ${results[0].assigned_broadcast_bookings}`);
    console.log('');

    // Get detailed list of new bookings
    const [bookings] = await sequelize.query(`
      SELECT 
        "bookingId",
        "driverId",
        "assignAllDriver",
        status,
        "driverAccepted",
        "pickupLocation",
        "dropLocation",
        "createdAt",
        "adminId"
      FROM bookings
      WHERE status = 'Booking Confirmed'
        AND "driverAccepted" = 'pending'
        AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 20
    `);

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
        console.log(`   Pickup: ${booking.pickupLocation || 'N/A'}`);
        console.log(`   Drop: ${booking.dropLocation || 'N/A'}`);
      });
    }

    // Check for a specific driver
    if (process.argv[2]) {
      const driverId = process.argv[2];
      console.log(`\n\n🔍 BOOKINGS FOR DRIVER: ${driverId}`);
      console.log('==========================================');
      
      const [driverBookings] = await sequelize.query(`
        SELECT 
          "bookingId",
          "driverId",
          "assignAllDriver",
          status,
          "driverAccepted",
          "createdAt"
        FROM bookings
        WHERE status = 'Booking Confirmed'
          AND "driverAccepted" = 'pending'
          AND "deletedAt" IS NULL
          AND (
            "driverId" = :driverId 
            OR ("assignAllDriver" = true AND "driverId" IS NULL)
          )
        ORDER BY "createdAt" DESC
      `, {
        replacements: { driverId }
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
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBookings();

