import { Sequelize } from 'sequelize';
import { Enquiry, Admin } from './src/v1/core/models';

const sequelize = new Sequelize('silver_taxi', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
    logging: false,
    dialectOptions: {
        ssl: false
    }
});

async function checkData() {
    try {
        console.log('Connecting to DB with standalone Sequelize...');
        await sequelize.authenticate();
        console.log('Connected.');

        // We need to init models if we use standalone sequelize? 
        // Actually, the models are already init-ed in their files using the exported 'sequelize' instance.
        // This is tricky. The models import 'sequelize' from 'postgres.ts'.
        // If I use a new instance here, the models won't use it.
        // To query raw, I can just use sequelize.query.

        const [results, metadata] = await sequelize.query("SELECT count(*) FROM enquires");
        console.log('Enquiries Count (Raw):', results);

        const [admins] = await sequelize.query("SELECT * FROM admins LIMIT 5");
        console.log('Admins (Raw):', admins);

        const [enqs] = await sequelize.query("SELECT * FROM enquires LIMIT 5");
        console.log('Enquiries (Raw):', enqs);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkData();
