
import { connect as connectDB } from './common/db/postgres';
import { logger } from './utils/logger';
import { startCronJobs } from './utils/cron/schedular';

const initializeServer = async () => {
    try {
        // Connect to database
        await connectDB();
        logger.info('Cron Server Database connected successfully');

        await startCronJobs();
        // Global error handlers
        process.on('uncaughtException', (error: Error) => {
            logger.error('Cron Server Uncaught Exception:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
            logger.error('Cron Server Unhandled Rejection:', { reason, promise });
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
        logger.error('Cron Server startup failed:', error);
        process.exit(1);
    }
};

// Start the server
initializeServer().catch((error) => {
    logger.error('Cron Server Failed to initialize server:', error);
    process.exit(1);
});