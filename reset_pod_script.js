const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
    host: 'postgres-postgresql-primary',
    user: 'taxi_user',
    password: 'taxi_password',
    database: 'defaultdb'
});

(async () => {
    try {
        await client.connect();
        console.log("Connected to Internal DB from Pod!");

        const email = 'silvertaxi@gmail.com';
        const newPassword = '12345678'; // User requested this specific password
        const hash = await bcrypt.hash(newPassword, 10);

        const res = await client.query(
            'UPDATE "admin" SET "password" = $1 WHERE "email" = $2 RETURNING email',
            [hash, email]
        );

        if (res.rows.length > 0) {
            console.log(`SUCCESS: Password for ${email} has been reset to ${newPassword}`);
        } else {
            console.log(`FAILURE: User ${email} not found.`);
        }

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        await client.end();
    }
})();
