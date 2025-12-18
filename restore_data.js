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
        console.log('✅ Connected');

        const id = 'SLTB260102126';

        // Correct details as per User's screenshot/request
        const pickup = JSON.stringify({
            address: "Salem, Tamil Nadu, India",
            lat: 11.6643,
            lng: 78.1460,
            name: "Salem"
        });

        const drop = JSON.stringify({
            address: "Gandhinagar, Gujarat, India",
            lat: 23.2156,
            lng: 72.6369,
            name: "Gandhinagar"
        });

        // Update the booking
        await sequelize.query(`
            UPDATE bookings 
            SET "pickup" = :pickup, 
                "drop" = :drop,
                "name" = 'Karthick Selvam',
                "phone" = '9944226010' 
            WHERE "bookingId" = :id
        `, {
            replacements: { pickup, drop, id }
        });

        console.log('✅ Successfully restored booking data for ID:', id);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

run();
