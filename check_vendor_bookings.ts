// Set NODE_ENV to development to use local .env values
process.env.NODE_ENV = "development";
require("dotenv").config();

process.env.FILE_UPLOAD_SECRET_TOKEN = "dummy";

// Mock minimal vars to pass Zod schema if .env is missing some
process.env.JWT_SECRET = process.env.JWT_SECRET || "dummy";
process.env.JWT_EXPIRATION_TIME = "1d";
process.env.ADMIN_MASTER_KEY = "dummy";
process.env.SMTP_HOST = "dummy";
process.env.SMTP_PORT = "587";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "dummy";
process.env.SMTP_PASS = "dummy";
process.env.ADMIN_MAIL_ID = "dummy";
process.env.COMPANY_NAME = "dummy";
process.env.SMS_API_URL = "dummy";
process.env.OTP_SECRET = "dummy";
process.env.SMS_API_KEY = "dummy";
process.env.SMS_CLIENT_ID = "dummy";
process.env.MINIO_ACCESS_KEY = "dummy";
process.env.MINIO_SECRET_KEY = "dummy";
process.env.MINIO_BUCKET_NAME = "dummy";
process.env.MINIO_ENDPOINT = "dummy";
process.env.MINIO_PORT = "9000";
process.env.DO_BUCKET_ENDPOINT = "dummy";
process.env.DO_BUCKET_SSL = "dummy";
process.env.DO_BUCKET_ACCESS_KEY = "dummy";
process.env.DO_BUCKET_SECRET_KEY = "dummy";
process.env.DO_BUCKET_NAME = "dummy";
process.env.DO_BUCKET_BASE_URL = "dummy";
process.env.WHATSAPP_API_USERNAME = "dummy";
process.env.WHATSAPP_API_URL = "dummy";
process.env.WHATSAPP_API_TOKEN = "dummy";
// Mock strict env vars for DEV too just in case
process.env.POSTGRES_USER = process.env.POSTGRES_USER || "postgres";
process.env.POSTGRES_HOST = process.env.POSTGRES_HOST || "localhost";
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || "password";
process.env.POSTGRES_DB = process.env.POSTGRES_DB || "silver_taxi";
process.env.POSTGRES_PORT = process.env.POSTGRES_PORT || "5432";
process.env.POSTGRES_SSL = "false";
process.env.REDIS_PASSWORD = "dummy";
process.env.REDIS_HOST = "dummy";
process.env.REDIS_PORT = "6379";
process.env.REDIS_UI_PORT = "8001";
process.env.RABBITMQ_URL = "dummy";
process.env.RABBITMQ_USER = "dummy";
process.env.RABBITMQ_PASSWORD = "dummy";
process.env.RABBITMQ_PORT = "5672";
process.env.RABBITMQ_UI_PORT = "15672";

import { Vendor } from "./src/v1/core/models/vendor";
import { Booking } from "./src/v1/core/models/booking";
import { sequelize } from "./src/common/db/postgres";

const checkData = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        // 1. Find the vendor
        const vendor = await Vendor.findOne({ where: { phone: "9944226010" } });
        if (!vendor) {
            console.log("Vendor with phone 9944226010 NOT FOUND.");
            return;
        }

        console.log("--------------------------------------------------");
        console.log(`Vendor Found: ID=${vendor.id}, vendorId=${vendor.vendorId} (type: ${typeof vendor.vendorId}), adminId=${vendor.adminId}`);
        console.log("--------------------------------------------------");

        // 2. Count bookings
        const count = await Booking.count({
            where: {
                vendorId: vendor.vendorId
            }
        });

        console.log(`Total Bookings for vendorId '${vendor.vendorId}': ${count}`);

        // 3. Show a sample booking if any
        if (count > 0) {
            const sample = await Booking.findOne({ where: { vendorId: vendor.vendorId } });
            console.log("Sample Booking:", JSON.stringify(sample?.toJSON(), null, 2));
        } else {
            // Check if there are ANY bookings for this adminId just in case
            const adminCount = await Booking.count({ where: { adminId: vendor.adminId } });
            console.log(`Total Bookings for adminId '${vendor.adminId}' (ignoring vendorId): ${adminCount}`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
};

checkData();
