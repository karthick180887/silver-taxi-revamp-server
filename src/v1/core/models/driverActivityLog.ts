import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../common/db/postgres';
import { Driver } from './driver';

export interface DriverActivityLogAttributes {
    id: number;
    eventId?: string;
    driverId?: string;

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

interface DriverActivityLogCreationAttributes extends Optional<DriverActivityLogAttributes, 'id'> { }

class DriverActivityLog extends Model<DriverActivityLogAttributes, DriverActivityLogCreationAttributes> implements DriverActivityLogAttributes {
    public id!: number;
    public eventId!: string;
    public driverId!: string;
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

DriverActivityLog.init(
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
        driverId: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
            references: {
                model: Driver,
                key: 'driverId',
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
        modelName: 'DriverActivityLog',
        tableName: 'driver_activity_logs',
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
                fields: ['driverId', 'createdAt'], // driver activity logs with pagination
            },
            {
                fields: ['driverId', 'eventDateTime'], // driver activity by date
            },
            {
                fields: ['driverId', 'type', 'createdAt'], // filter by activity type
            },
            {
                fields: ['driverId', 'level', 'createdAt'], // filter by log level (errors, warnings)
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

export { DriverActivityLog };