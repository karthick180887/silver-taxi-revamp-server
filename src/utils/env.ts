import { config } from "dotenv";
import z from "zod"; // , { ZodTypeAny }
config({
  path: ".env",
});

const envSchema = z.object({
  // node server
  PORT: z.string().default("3060"),
  BASE_URL: z.string(),
  FRONT_END_BASE_URL: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "prod", "dev", "test", "local"])
    .default("production"),
  // postgres - config
  // dev
  POSTGRES_USER: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  POSTGRES_PORT: z.string().optional(),

  // prod
  POSTGRES_USER_PROD: z.string().optional(),
  POSTGRES_HOST_PROD: z.string().optional(),
  POSTGRES_PASSWORD_PROD: z.string().optional(),
  POSTGRES_DB_PROD: z.string().optional(),
  POSTGRES_PORT_PROD: z.string().optional(),

  // redis -config
  // dev
  REDIS_PASSWORD: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_UI_PORT: z.string().optional(),

  // live
  REDIS_PASSWORD_PROD: z.string().optional(),
  REDIS_HOST_PROD: z.string().optional(),
  REDIS_PORT_PROD: z.string().optional(),
  REDIS_UI_PORT_PROD: z.string().optional(),
  // jwt  
  JWT_SECRET: z.string(),
  JWT_EXPIRATION_TIME: z.string(),
  // config master key 
  ADMIN_MASTER_KEY: z.string(),
  //token
  FILE_UPLOAD_SECRET_TOKEN: z.string(),
  //email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_SECURE: z.string(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  ADMIN_MAIL_ID: z.string(),
  COMPANY_NAME: z.string(),
  //sms
  SMS_API_URL: z.string(),
  OTP_SECRET: z.string(),
  SMS_API_KEY: z.string(),
  SMS_CLIENT_ID: z.string(),

  //rabbitmq
  //live
  RABBITMQ_URL: z.string().optional(),
  RABBITMQ_USER: z.string().optional(),
  RABBITMQ_PASSWORD: z.string().optional(),
  RABBITMQ_PORT: z.string().optional(),
  RABBITMQ_UI_PORT: z.string().optional(),
  //prod
  RABBITMQ_URL_PROD: z.string().optional(),
  RABBITMQ_USER_PROD: z.string().optional(),
  RABBITMQ_PASSWORD_PROD: z.string().optional(),
  RABBITMQ_PORT_PROD: z.string().optional(),
  RABBITMQ_UI_PORT_PROD: z.string().optional(),

  // image upload
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET_NAME: z.string(),
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.string(),

  //Digital Ocean
  DO_BUCKET_ENDPOINT: z.string(),
  DO_BUCKET_SSL: z.string(),
  DO_BUCKET_ACCESS_KEY: z.string(),
  DO_BUCKET_SECRET_KEY: z.string(),
  DO_BUCKET_NAME: z.string(), // corrected syntax
  DO_BUCKET_BASE_URL: z.string(),

  //Payment
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // whatsapp
  WHATSAPP_API_USERNAME: z.string(),
  WHATSAPP_API_URL: z.string(),
  WHATSAPP_API_TOKEN: z.string(),
}).superRefine((data, ctx) => {
  // If NODE_ENV is development, all dev environment variables are required
  if (data.NODE_ENV === "development" || data.NODE_ENV === "dev") {
    const devFields = [
      { key: "POSTGRES_USER", value: data.POSTGRES_USER },
      { key: "POSTGRES_HOST", value: data.POSTGRES_HOST },
      { key: "POSTGRES_PASSWORD", value: data.POSTGRES_PASSWORD },
      { key: "POSTGRES_DB", value: data.POSTGRES_DB },
      { key: "POSTGRES_PORT", value: data.POSTGRES_PORT },
      { key: "REDIS_PASSWORD", value: data.REDIS_PASSWORD },
      { key: "REDIS_HOST", value: data.REDIS_HOST },
      { key: "REDIS_PORT", value: data.REDIS_PORT },
      { key: "REDIS_UI_PORT", value: data.REDIS_UI_PORT },
      { key: "RABBITMQ_URL", value: data.RABBITMQ_URL },
      { key: "RABBITMQ_USER", value: data.RABBITMQ_USER },
      { key: "RABBITMQ_PASSWORD", value: data.RABBITMQ_PASSWORD },
      { key: "RABBITMQ_PORT", value: data.RABBITMQ_PORT },
      { key: "RABBITMQ_UI_PORT", value: data.RABBITMQ_UI_PORT },
    ];

    devFields.forEach((field) => {
      if (field.value === undefined || field.value === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field.key} is required when NODE_ENV is development`,
          path: [field.key],
        });
      }
    });
  }

  // If NODE_ENV is production, all prod environment variables are required
  if (data.NODE_ENV === "production" || data.NODE_ENV === "prod") {
    const prodFields = [
      { key: "POSTGRES_USER_PROD", value: data.POSTGRES_USER_PROD },
      { key: "POSTGRES_HOST_PROD", value: data.POSTGRES_HOST_PROD },
      { key: "POSTGRES_PASSWORD_PROD", value: data.POSTGRES_PASSWORD_PROD },
      { key: "POSTGRES_DB_PROD", value: data.POSTGRES_DB_PROD },
      { key: "POSTGRES_PORT_PROD", value: data.POSTGRES_PORT_PROD },
      { key: "REDIS_PASSWORD_PROD", value: data.REDIS_PASSWORD_PROD },
      { key: "REDIS_HOST_PROD", value: data.REDIS_HOST_PROD },
      { key: "REDIS_PORT_PROD", value: data.REDIS_PORT_PROD },
      { key: "REDIS_UI_PORT_PROD", value: data.REDIS_UI_PORT_PROD },
      { key: "RABBITMQ_URL_PROD", value: data.RABBITMQ_URL_PROD },
      { key: "RABBITMQ_USER_PROD", value: data.RABBITMQ_USER_PROD },
      { key: "RABBITMQ_PASSWORD_PROD", value: data.RABBITMQ_PASSWORD_PROD },
      { key: "RABBITMQ_PORT_PROD", value: data.RABBITMQ_PORT_PROD },
      { key: "RABBITMQ_UI_PORT_PROD", value: data.RABBITMQ_UI_PORT_PROD },
    ];

    prodFields.forEach((field) => {
      if (field.value === undefined || field.value === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field.key} is required when NODE_ENV is production`,
          path: [field.key],
        });
      }
    });
  }
});

// validate the environment variables
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    `Missing or invalid environment variable${parsed.error.errors.length > 1 ? "s" : ""
    }:
  ${parsed.error.errors
      .map((error) => `${error.path}: ${error.message}`)
      .join("\n")}
  `
  );
  console.log(parsed.error.errors);
  process.exit(1);
}
export const env = Object.freeze(parsed.data);
export default env;
