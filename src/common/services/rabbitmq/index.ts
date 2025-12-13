import * as amqplib from "amqplib";
import { logger } from "../../../utils/logger";
import { env } from "../../../utils/env";
// Use any types to avoid amqplib type conflicts
let connection: any = null;
let channel: any = null;
let shutdownHandlersRegistered = false;

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const registerShutdownHandlers = (): void => {
  if (shutdownHandlersRegistered) {
    return;
  }
  
  // Graceful shutdown
  process.on("SIGINT", async () => {
    await closeConnection();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closeConnection();
    process.exit(0);
  });
  
  shutdownHandlersRegistered = true;
};

const connectWithRetry = async (rabbitmqUrl: string, maxRetries: number = 10, initialDelay: number = 2000): Promise<void> => {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      connection = await amqplib.connect(rabbitmqUrl);
      
      if (!connection) {
        throw new Error("Failed to establish RabbitMQ connection");
      }

      channel = await connection.createChannel();

      if (!channel) {
        throw new Error("Failed to create RabbitMQ channel");
      }

      // Declare topic exchange for notifications
      await channel.assertExchange("notification", "topic", { durable: true });
      await channel.assertExchange("driver", "topic", { durable: true });

      logger.info(`✅ RabbitMQ connected successfully " ${env.NODE_ENV} " (attempt ${attempt})`);

      // Handle connection close events
      connection.on("error", (err: Error) => {
        logger.error("❌ RabbitMQ connection error:", err);
      });

      connection.on("close", () => {
        logger.info(`🔒 RabbitMQ connection closed " ${env.NODE_ENV} "`);
        connection = null;
        channel = null;
      });

      // Register shutdown handlers only once
      registerShutdownHandlers();

      return; // Success, exit retry loop
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.info(`❌ Failed to connect RabbitMQ (attempt ${attempt}/${maxRetries}): " ${env.NODE_ENV} ". Retrying in ${delay}ms...`, error);
        await sleep(delay);
      } else {
        logger.error(`❌ Failed to connect RabbitMQ after ${maxRetries} attempts: " ${env.NODE_ENV} "`, lastError);
        throw lastError;
      }
    }
  }
};

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    const rabbitmqUrl = env.NODE_ENV === 'production' ? env.RABBITMQ_URL_PROD : env.RABBITMQ_URL;
    if (!rabbitmqUrl) {
      logger.error(`RabbitMQ URL is not defined " ${env.NODE_ENV} "`);
      process.exit(1);
    }
    
    await connectWithRetry(rabbitmqUrl);
  } catch (error) {
    logger.error(`❌ Failed to connect RabbitMQ after all retries: " ${env.NODE_ENV} "`, error);
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