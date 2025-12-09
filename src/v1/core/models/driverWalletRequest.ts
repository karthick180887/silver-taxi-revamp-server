import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

export interface DriverWalletRequestAttributes {
    id: number;
    adminId: string;
    requestId?: string;
    driverId: string;
    name?: string;
    phone?: string;
    walletId: string;
    type: "add" | "withdraw";
    amount: number;
    reason?: string;
    remark?: string | null;
    description?: string;
    transId?: string;
    paymentMethod?: string;
    tnxPaymentId?: string | null;
    transactionDate?: Date;
    status: "pending" | "approved" | "rejected";
}

interface DriverWalletRequestCreationAttributes extends Optional<DriverWalletRequestAttributes, 'id'> { }

class DriverWalletRequest extends Model<DriverWalletRequestAttributes, DriverWalletRequestCreationAttributes> implements DriverWalletRequestAttributes {
    public id!: number;
    public adminId!: string;
    public requestId!: string;
    public driverId!: string;
    public name?: string;
    public phone?: string;
    public walletId!: string;
    public amount!: number;
    public type!: "add" | "withdraw";
    public reason!: string;
    public description!: string;
    public remark?: string | null;
    public transId?: string;
    public paymentMethod?: string;
    public tnxPaymentId?: string | null;
    public transactionDate?: Date;
    public status!: "pending" | "approved" | "rejected";


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

DriverWalletRequest.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        adminId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: Admin,
                key: "adminId",
            },
        },
        requestId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: null,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                isInt: true,
            },
        },
        type: {
            type: DataTypes.ENUM('add', 'withdraw'),
            allowNull: false,
        },
        reason: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        remark: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        driverId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        walletId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        transId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        paymentMethod: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        tnxPaymentId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        transactionDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: "pending",
        },
    },
    {
        sequelize,
        modelName: "DriverWalletRequest",
        tableName: "driver_wallet_requests",
        timestamps: true,
        paranoid: true,
        indexes: [
            // Unique constraint
            {
                unique: true,
                fields: ['requestId'],
            },
            // Common query patterns - optimized for high concurrency
            {
                fields: ['adminId', 'createdAt'], // admin view with pagination
            },
            {
                fields: ['adminId', 'status', 'createdAt'], // filter by status with pagination (most common)
            },
            {
                fields: ['adminId', 'status'], // filter by status
            },
            {
                fields: ['driverId', 'createdAt'], // driver requests with pagination
            },
            {
                fields: ['driverId', 'status', 'createdAt'], // driver requests by status
            },
            {
                fields: ['driverId', 'status'], // driver requests by status
            },
            {
                fields: ['adminId', 'driverId', 'createdAt'], // admin filtering by driver
            },
            {
                fields: ['adminId', 'type', 'createdAt'], // filter by type (add/withdraw)
            },
            {
                fields: ['adminId', 'type'], // filter by type
            },
            {
                fields: ['status'], // status filtering
            },
            {
                fields: ['type'], // type filtering
            },
            {
                fields: ['walletId'], // wallet lookup
            },
        ],
    }
);


export { DriverWalletRequest };
