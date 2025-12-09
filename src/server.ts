import { createServer } from 'http';
import { Server as HTTPServer } from 'http';
import { connect as connectDB } from './common/db/postgres';
import { initRedis } from './common/db/redis';
import env from './utils/env';
import { initializeWebSocket } from './common/services/socket/websocket';
import app from './app';
import { logger } from './utils/logger';
import { preloadAllKeys } from './common/services/node-cache';
import { connectRabbitMQ } from './common/services/rabbitmq';
import http from 'http';

// Node agent tuning
http.globalAgent.maxSockets = Infinity;
http.globalAgent.maxFreeSockets = 20000;

const initializeServer = async () => {
    try {
        // Connect to database
        await connectDB();
        await initRedis();
        logger.info('Database connected successfully');


        // Create HTTP server
        const server = createServer(app);

        // Set server options
        server.maxConnections = 60000;      // allow 60k sockets
        server.keepAliveTimeout = 60000;    // keep connections alive for 60s
        server.headersTimeout = 65000;      // must be > keepAliveTimeout
        server.requestTimeout = 60000;

        // Initialize WebSocket
        initializeWebSocket(server);
        await preloadAllKeys();

        // Connect to RabbitMQ (for publishing only, no workers)
        await connectRabbitMQ();
        logger.info("RabbitMQ connected successfully (for publishing)");

        // Define port and base URL
        const PORT = Number(env.PORT) || 3060;
        const BASE_URL = env.BASE_URL || `http://localhost:${PORT}`;

        // Start server
        server.listen(PORT, () => {
            logger.info(`Server running on ${BASE_URL}`);
            logger.info(`WebSocket server running on ${BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://')}`);
        });

        // Handle server errors
        server.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use`);
                process.exit(1);
            }
            logger.error(`Server error: ${error.message}`);
        });

        // Global error handlers
        process.on('uncaughtException', (error: Error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
            logger.error('Unhandled Rejection:', { reason, promise });
            process.exit(1);
        });

        // Graceful shutdown
        const gracefulShutdown = () => {
            logger.info('Received shutdown signal. Closing server...');
            server.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        return server;

    } catch (error) {
        logger.error('Server startup failed:', error);
        process.exit(1);
    }
};

// Start the server
initializeServer().catch((error) => {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
});