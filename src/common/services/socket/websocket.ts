// websocket-server.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../../../utils/logger';
import { decodeToken } from '../jwt/jwt';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from '../../db/redis';

// Types
interface AuthData {
    token: string;
}

type NotificationData = {
    notificationId?: string;
    title: string;
    description: string;
    type?: string;
    read: boolean;
    date: Date;
    time?: string;
};

let io: SocketIOServer;

export function initializeWebSocket(server: HTTPServer): SocketIOServer {
    io = new SocketIOServer(server, {
        connectionStateRecovery: {},
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
        adapter: createAdapter(pubClient, subClient)
    });

    io.on('connection', handleConnection);
    logger.info('Socket.IO server initialized');

    return io;
}

function handleConnection(socket: Socket): void {
    logger.info(`New client connected: ${socket.id}`);

    const token = socket.handshake.auth.token;
    if (token) {
        handleAuthentication(socket, { token });
    }


    socket.on('driver_location_update', (data) => {
        logger.info(`Received notification from client ${socket.id}`);
        console.log("Payload:", data);

    });

    socket.on('disconnect', () => handleDisconnect(socket));
    socket.on('error', (error: Error) => handleError(socket, error));
}

function handleAuthentication(socket: Socket, data: AuthData): void {
    try {
        const decoded = decodeToken(data.token) as any;

        if (!decoded || !decoded.userData?.id) {
            console.log("decoded", decoded)
            return;
        }

        logger.info(`Client ${socket.id} authenticated with userId: ${decoded.userData.id}`);

        // Store user data in socket
        socket.data.id = decoded.userData.id;

        // Join user's room for private notifications
        socket.join(decoded.userData.id);

        socket.emit('auth_success', {
            message: 'Authentication successful',
        });
    } catch (error) {
        logger.error(`Authentication failed for client ${socket.id}:`, error);
        socket.emit('auth_error', { message: 'Authentication failed' });
    }
}

function handleDisconnect(socket: Socket): void {
    logger.info(`Client disconnected: ${socket.id}`);
}

function handleError(socket: Socket, error: Error): void {
    logger.error(`Socket error from ${socket.id}:`, error);
}

export function sendNotification(target: string, data: NotificationData): void {
    if (!io) {
        logger.error('Socket.IO server not initialized');
        return;
    }

    const socket = io.sockets.sockets.get(target);

    if (socket) {
        socket.emit('notification', data);
        logger.info(`Notification sent to client: ${target}`);
    } else {
        io.to(target).emit('notification', data);
        console.log("notification broadcasted to room", `target :${target}`, `\n data :${data}`)
        logger.info(`Notification broadcasted to room: ${target}`);
    }
}

/**
 * Emit NEW_TRIP_OFFER event to a specific driver via Socket.IO
 * This is used by the Flutter app's overlay notification service
 */
export function emitNewTripOfferToDriver(driverId: string, bookingData: any): void {
    if (!io) {
        logger.error('Socket.IO server not initialized');
        return;
    }

    try {
        // Emit to the driver's room (they join with their driverId)
        // Flutter app expects: { type: 'NEW_TRIP_OFFER', data: { ...bookingData } }
        const eventData = {
            type: 'NEW_TRIP_OFFER',
            data: bookingData,
        };

        // Check if any sockets are in the driver's room
        const room = io.sockets.adapter.rooms.get(driverId);
        const socketCount = room ? room.size : 0;

        logger.info(`Emitting NEW_TRIP_OFFER to driver room "${driverId}": ${socketCount} socket(s) connected`);

        if (socketCount === 0) {
            logger.warn(`⚠️ No sockets found in room "${driverId}" - driver may not be connected`);
        }

        io.to(driverId).emit('notification', eventData);
        logger.info(`✅ NEW_TRIP_OFFER event sent to driver: ${driverId}, bookingId: ${bookingData.bookingId || 'unknown'}`);
    } catch (error) {
        logger.error(`Error emitting NEW_TRIP_OFFER to driver ${driverId}:`, error);
    }
}

/**
 * Emit NEW_TRIP_OFFER event to multiple drivers via Socket.IO
 * Used for broadcast bookings (assignAllDriver = true)
 */
export function emitNewTripOfferToDrivers(driverIds: string[], bookingData: any): void {
    if (!io) {
        logger.error('Socket.IO server not initialized');
        return;
    }

    if (!driverIds || driverIds.length === 0) {
        return;
    }

    try {
        // Flutter app expects: { type: 'NEW_TRIP_OFFER', data: { ...bookingData } }
        const eventData = {
            type: 'NEW_TRIP_OFFER',
            data: bookingData,
        };

        let connectedCount = 0;
        let disconnectedCount = 0;

        // Emit to each driver's room
        driverIds.forEach(driverId => {
            const room = io.sockets.adapter.rooms.get(driverId);
            const socketCount = room ? room.size : 0;

            if (socketCount > 0) {
                connectedCount++;
                io.to(driverId).emit('notification', eventData);
                logger.info(`✅ Emitted to driver ${driverId} (${socketCount} socket(s) connected)`);
            } else {
                disconnectedCount++;
                logger.warn(`⚠️ Driver ${driverId} not connected (room empty)`);
            }
        });

        logger.info(`NEW_TRIP_OFFER event sent: ${connectedCount} connected, ${disconnectedCount} disconnected, bookingId: ${bookingData.bookingId || 'unknown'}`);
    } catch (error) {
        logger.error(`Error emitting NEW_TRIP_OFFER to multiple drivers:`, error);
    }
}


