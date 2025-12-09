import * as amqplib from "amqplib";
import { logger } from "../../../utils/logger";
import { env } from "../../../utils/env";
// Use any types to avoid amqplib type conflicts
let connection: any = null;
let channel: any = null;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    const rabbitmqUrl = env.NODE_ENV === 'production' ? env.RABBITMQ_URL_PROD : env.RABBITMQ_URL;
    if (!rabbitmqUrl) {
      logger.error(`RabbitMQ URL is not defined " ${env.NODE_ENV} "`);
      process.exit(1);
    }
    connection = await amqplib.connect(rabbitmqUrl as string);

    if (!connection) {
      logger.error(`Failed to establish RabbitMQ connection " ${env.NODE_ENV} "`);
    }

    channel = await connection.createChannel();

    if (!channel) {
      logger.error("Failed to create RabbitMQ channel");
    }

    logger.info(`✅ RabbitMQ connected successfully " ${env.NODE_ENV} "`);

    // Declare topic exchange for notifications
    await channel.assertExchange("notification", "topic", { durable: true });
    await channel.assertExchange("driver", "topic", { durable: true });

    // Handle connection close events
    connection.on("error", (err: Error) => {
      logger.error("❌ RabbitMQ connection error:", err);
    });

    connection.on("close", () => {
      logger.info(`🔒 RabbitMQ connection closed " ${env.NODE_ENV} "`);
      connection = null;
      channel = null;
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await closeConnection();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await closeConnection();
      process.exit(0);
    });

  } catch (error) {
    logger.info(`❌ Failed to connect RabbitMQ: " ${env.NODE_ENV} "`, error);
    process.exit(1);
  }
};

export const closeConnection = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info(`🔒 RabbitMQ connection closed gracefully " ${env.NODE_ENV} "`);
  } catch (error) {
    logger.info(`❌ Error closing RabbitMQ connection: " ${env.NODE_ENV} "`, error);
  }
};

export const isConnected = (): boolean => {
  return connection !== null && channel !== null;
};

export const getChannel = (): amqplib.Channel => {
  if (!channel) {
    console.error(`❌ RabbitMQ channel is not connected " ${env.NODE_ENV} "`);
    process.exit(1);
  }
  return channel;
};