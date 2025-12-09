
import { connect as connectDB } from './common/db/postgres';
import { logger } from './utils/logger';
import { startCronJobs } from './utils/cron/schedular';
import { startWorker } from './common/services/rabbitmq/worker';
import { initRedis } from './common/db/redis';

const initializeServer = async () => {
    try {
        // Connect to database
        await connectDB();
        await initRedis();
        logger.info('Queue Server Database and Redis connected successfully');

        // Start RabbitMQ worker
        await startWorker();
        logger.info('RabbitMQ worker started successfully');
        // Global error handlers
        process.on('uncaughtException', (error: Error) => {
            logger.error('Queue Server Uncaught Exception:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
            logger.error('Queue Server Unhandled Rejection:', { reason, promise });
            process.exit(1);
        });

        // Graceful shutdown
        const gracefulShutdown = () => {
            logger.info('Received shutdown signal. Closing server...')
            process.exit(0);
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        return;
    } catch (error) {
        logger.error('Queue Server startup failed:', error);
        process.exit(1);
    }
};

// Start the server
initializeServer().catch((error) => {
    logger.error('Queue Server Failed to initialize server:', error);
    process.exit(1);
});