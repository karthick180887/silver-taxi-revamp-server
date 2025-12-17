
import 'dotenv/config'; // Load env vars
import { Service, Admin } from "../src/v1/core/models";
import { sequelize } from "../src/common/db/postgres";

async function run() {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        const admins = await Admin.findAll();
        console.log("Admins found:", JSON.stringify(admins.map(a => ({ id: a.id, adminId: a.adminId, name: a.name })), null, 2));

        const services = await Service.findAll();
        console.log("Services found:", JSON.stringify(services.map(s => ({ id: s.id, serviceId: s.serviceId, adminId: s.adminId, name: s.name })), null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

run();
