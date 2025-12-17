const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'primary',
    password: 'admin_password',
    port: 5434,
    ssl: false
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB");

        const admins = await client.query('SELECT "id", "adminId", "name" FROM "admin"');
        console.log("Admins:", JSON.stringify(admins.rows, null, 2));

        const services = await client.query('SELECT "id", "serviceId", "adminId", "name" FROM "services"');
        console.log("Services:", JSON.stringify(services.rows, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
