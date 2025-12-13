import { Sequelize, DataTypes, Op } from "sequelize";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';

// Load .env explicitly from CWD
const envPath = path.join(process.cwd(), '.env');
console.log("Looking for .env at:", envPath);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log("Loaded .env successfully.");
} else {
    console.log("Warning: .env file not found at:", envPath);
    // Try default
    dotenv.config();
}


console.log("DB Host:", process.env.POSTGRES_HOST);
console.log("DB Port:", process.env.POSTGRES_PORT);

const sequelize = new Sequelize(
    process.env.POSTGRES_DB as string,
    process.env.POSTGRES_USER as string,
    process.env.POSTGRES_PASSWORD as string,
    {
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT as string),
        dialect: "postgres",
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

// Define a minimal Booking model to run the count query
const Booking = sequelize.define("Booking", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    status: {
        type: DataTypes.ENUM("Booking Confirmed", "Started", "Completed", "Cancelled", "Not-Started", "Reassign", "Manual Completed"),
        allowNull: false,
    },
    adminId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    driverId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    assignAllDriver: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    vehicleType: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: "bookings",
    timestamps: true,
    paranoid: true, // soft deletes
});

async function checkCounts() {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");

        // Count all "Booking Confirmed"
        const count = await Booking.count({
            where: {
                status: "Booking Confirmed"
            }
        });

        console.log(`\n\n[RESULT] Total 'Booking Confirmed' count in DB: ${count}\n\n`);

        // Count broadcast
        const broadcastCount = await Booking.count({
            where: {
                status: "Booking Confirmed",
                driverId: null,
                assignAllDriver: true
            }
        });
        console.log(`[RESULT] Broadcast 'Booking Confirmed' count (assignAllDriver=true, driverId=null): ${broadcastCount}\n`);

        // Group by vehicleType for broadcast
        const byVehicle = await Booking.findAll({
            where: {
                status: "Booking Confirmed",
                driverId: null,
                assignAllDriver: true
            },
            attributes: ['vehicleType', [sequelize.fn('COUNT', sequelize.col('vehicleType')), 'count']],
            group: ['vehicleType'],
            raw: true
        });
        console.log(`[RESULT] Broadcast Bookings by Vehicle Type:`, JSON.stringify(byVehicle, null, 2));


    } catch (error) {
        console.error("Unable to connect to the database:", error);
    } finally {
        await sequelize.close();
    }
}

checkCounts();
