import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../common/db/postgres';
import { Booking } from './booking';

export interface BookingActivityLogAttributes {
    id: number;
    eventId?: string;
    bookingId?: string;

    type: string;
    title: string;
    message: string;
    data?: any;

    eventDateTime: Date;
    eventBy?: string;
    level?: "info" | "warning" | "error" | "critical";

    oldValue?: any;
    newValue?: any;
}

interface BookingActivityLogCreationAttributes extends Optional<BookingActivityLogAttributes, 'id'> { }

class BookingActivityLog extends Model<BookingActivityLogAttributes, BookingActivityLogCreationAttributes> implements BookingActivityLogAttributes {
    public id!: number;
    public eventId!: string;
    public bookingId!: string;
    public type!: string;
    public title!: string;
    public message!: string;
    public data!: any;
    public eventDateTime!: Date;
    public eventBy!: string;
    public level!: "info" | "warning" | "error" | "critical";
    public oldValue!: any;
    public newValue!: any;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

BookingActivityLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        eventId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            defaultValue: DataTypes.UUIDV4,
        },
        bookingId: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
            references: {
                model: Booking,
                key: 'bookingId',
            },
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        data: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        eventDateTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        eventBy: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        level: {
            type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
            allowNull: true,
            defaultValue: 'info',
        },
        oldValue: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        newValue: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: 'BookingActivityLog',
        tableName: 'booking_activity_logs',
        timestamps: true,
        paranoid: true,
        indexes: [
            // Unique constraint
            {
                unique: true,
                fields: ['eventId'],
            },
            // Common query patterns - optimized for high concurrency
            {
                fields: ['bookingId', 'createdAt'], // booking activity logs with pagination
            },
            {
                fields: ['bookingId', 'eventDateTime'], // booking activity by date
            },
            {
                fields: ['bookingId', 'type', 'createdAt'], // filter by activity type
            },
            {
                fields: ['bookingId', 'level', 'createdAt'], // filter by log level (errors, warnings)
            },
            {
                fields: ['adminId', 'createdAt'], // admin view of all logs
            },
            {
                fields: ['eventDateTime'], // date range queries
            },
            {
                fields: ['type'], // activity type filtering
            },
            {
                fields: ['level'], // log level filtering (for error monitoring)
            },
        ],
    }
);

export { BookingActivityLog };