
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('MaxPool2', 'doadmin', 'AVNS_RVqHkzaibQ9jV7opqjE', {
    host: 'db-postgresql-blr1-87455-do-user-23068629-0.f.db.ondigitalocean.com',
    dialect: 'postgres',
    port: 25061,
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const debugData = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected successfully (Debug Mode).");

        // Check Customer counts
        const [results] = await sequelize.query(`SELECT "adminId", count(*) as count FROM "customers" GROUP BY "adminId"`);
        console.log("Customer Counts by AdminId:", results);

        const [total] = await sequelize.query(`SELECT count(*) as total FROM "customers"`);
        console.log("Total Customers:", total[0]);

    } catch (error) {
        console.error("Error connecting or querying DB:", error);
    } finally {
        await sequelize.close();
    }
};

debugData();
