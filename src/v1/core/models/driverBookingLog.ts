import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Driver } from "./driver";
import { Admin } from "./admin";


export interface DriverBookingLogAttributes {
    id: number;
    minuteId?: string | null;
    adminId: string;
    driverId?: string;
    bookingId?: string;
    emptyTrips?: number;
    onlineTimes?: Date[];
    offlineTimes?: Date[];
    onlineMinutes?: number;
    offlineMinutes?: number;
    tripStartedTime?: Date;
    tripCompletedTime?: Date;
    activeDrivingMinutes?: number;
    traveledDistance?: number;
    tripStatus?: "Started" | "Completed" | "Cancelled" | "Not-Started" | "Driver Accepted";
    netEarnings?: number;
    deductionAmount?: number;
    additionalCharges?: any;
    estimatedDistance?: number;
    estimatedValue?: number;
    endTripValue?: number;
    avgAcceptTime?: number;
    requestSendTime?: Date;
    driverBetta?: number;
    acceptTime?: Date;

    reason?: string;

}

interface DriverBookingLogCreationAttributes extends Optional<DriverBookingLogAttributes, 'id'> { }

class DriverBookingLog
    extends Model<DriverBookingLogAttributes, DriverBookingLogCreationAttributes>
    implements DriverBookingLogAttributes {
    public id!: number;
    public minuteId!: string;
    public adminId!: string;
    public driverId!: string;
    public bookingId!: string;
    public emptyTrips!: number;
    public onlineTimes!: Date[];
    public offlineTimes!: Date[];
    public onlineMinutes!: number;
    public offlineMinutes!: number;
    public tripStartedTime!: Date;
    public tripCompletedTime!: Date;
    public activeDrivingMinutes!: number;
    public traveledDistance!: number;
    public tripStatus!: "Started" | "Completed" | "Cancelled" | "Not-Started" | "Driver Accepted";
    public netEarnings!: number;
    public deductionAmount!: number;
    public additionalCharges!: any;
    public estimatedDistance!: number;
    public estimatedValue!: number;
    public endTripValue!: number;
    public avgAcceptTime!: number;
    public requestSendTime!: Date;
    public driverBetta!: number;
    public acceptTime!: Date;
    public reason!: string;

    public readonly updatedAt!: Date;
    public readonly createdAt!: Date;
}

DriverBookingLog.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
    minuteId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    adminId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: Admin,
            key: 'adminId',
        },
    },
    driverId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: Driver,
            key: 'driverId',
        },
    },
    bookingId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },


    emptyTrips: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    onlineTimes: {
        type: DataTypes.ARRAY(DataTypes.DATE),
        allowNull: true,
        defaultValue: null,
    },
    offlineTimes: {
        type: DataTypes.ARRAY(DataTypes.DATE),
        allowNull: true,
        defaultValue: null,
    },
    onlineMinutes: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
    },
    offlineMinutes: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
    },
    tripStartedTime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    tripCompletedTime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },

    activeDrivingMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    traveledDistance: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    tripStatus: {
        type: DataTypes.ENUM("Started", "Completed", "Cancelled", "Not-Started", "Driver Accepted"),
        allowNull: true,
        defaultValue: null,
    },
    netEarnings: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    deductionAmount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    additionalCharges: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
    },
    estimatedDistance: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    estimatedValue: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    endTripValue: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    avgAcceptTime: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
    },
    requestSendTime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    driverBetta: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    acceptTime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    }

}, {
    sequelize,
    tableName: 'driver_booking_log',
    timestamps: true,
    modelName: 'DriverBookingLog',
    paranoid: true,
    indexes: [
        // Unique constraint
        {
            unique: true,
            fields: ['adminId', 'driverId', 'minuteId', 'bookingId'],
        },
        // Common query patterns - optimized for high concurrency
        {
            fields: ['adminId', 'driverId', 'createdAt'], // driver booking logs with pagination
        },
        {
            fields: ['adminId', 'driverId'], // driver booking logs
        },
        {
            fields: ['driverId', 'tripStatus', 'createdAt'], // filter by trip status with pagination
        },
        {
            fields: ['driverId', 'tripStatus'], // filter by trip status
        },
        {
            fields: ['driverId', 'createdAt'], // driver logs by date
        },
        {
            fields: ['bookingId'], // booking lookup
        },
        {
            fields: ['adminId', 'createdAt'], // admin view with pagination
        },
        {
            fields: ['tripStatus'], // status filtering
        },
        {
            fields: ['tripStartedTime'], // trip start time queries
        },
        {
            fields: ['tripCompletedTime'], // trip completion time queries
        },
    ],
});

export { DriverBookingLog };