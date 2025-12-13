
import { sequelize } from './src/common/db/postgres';
import { Admin } from './src/v1/core/models/admin';
import bcrypt from 'bcrypt';

async function main() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // await sequelize.sync({ alter: true }); // Ensure table exists
        // console.log('Tables synced.');

        const email = 'admin@silvertaxi.in';
        const phone = '9999999999';
        const password = 'admin123';

        let admin = await Admin.findOne({ where: { email } });

        if (admin) {
            console.log('Admin already exists:', admin.toJSON());

            // Validate password
            const isMatch = await bcrypt.compare(password, admin.password);
            console.log('Password match:', isMatch);

            if (!isMatch) {
                console.log('Updating password...');
                const hash = await bcrypt.hash(password, 10);
                admin.password = hash;
                await admin.save();
                console.log('Password updated.');
            }
        } else {
            console.log('Creating admin...');
            const hash = await bcrypt.hash(password, 10);
            admin = await Admin.create({
                name: 'Super Admin',
                email,
                phone,
                password: hash,
                role: 'admin',
                adminId: 'admin-1',
                domain: 'silvertaxi.in'
            });
            console.log('Admin created:', admin.toJSON());
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

main();
