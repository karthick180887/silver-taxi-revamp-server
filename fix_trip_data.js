const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'localhost',
    port: 5434,
    database: 'defaultdb',
    username: 'taxi_user',
    password: 'taxi_password',
    logging: console.log
});

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Known Connected');

        // Find latest booking
        const [results] = await sequelize.query(`
            SELECT "bookingId" FROM bookings ORDER BY "createdAt" DESC LIMIT 1
        `);

        if (!results.length) {
            console.log('No booking found');
            return;
        }

        const id = results[0].bookingId;
        console.log('Found latest booking:', id);

        // Define valid locations
        const pickup = JSON.stringify({
            address: "Salem New Bus Stand, Tamil Nadu",
            lat: 11.6643,
            lng: 78.1460,
            name: "Salem New Bus Stand"
        });

        const drop = JSON.stringify({
            address: "Gandhinagar, Salem, Tamil Nadu",
            lat: 11.6853,
            lng: 78.1360,
            name: "Gandhinagar"
        });

        // Update the booking
        await sequelize.query(`
            UPDATE bookings 
            SET "pickup" = :pickup, 
                "drop" = :drop,
                "name" = 'John Doe',
                "phone" = '9944226010' 
            WHERE "bookingId" = :id
        `, {
            replacements: { pickup, drop, id }
        });

        console.log('✅ Successfully updated booking data for ID:', id);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

run();
