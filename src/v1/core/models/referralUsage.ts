import { sequelize } from "../../../common/db/postgres";
import { DataTypes, Model, Optional } from "sequelize";
import { Admin } from "./admin";

export interface ReferralUsageAttributes {
    id: number;
    companyId: string;
    adminId: string;
    referralUsageId: string;
    referrerType: 'customer' | 'driver' | 'vendor';
    referralCode: string;
    senderId: string;
    receiverId: string;
    senderAmount: number;
    receiverAmount: number;
    status?: 'failed' | 'success' | 'pending';
    remark?: string;
    senderTransactionId?: string;
    receiverTransactionId?: string;
}

interface ReferralUsageCreationAttributes extends Optional<ReferralUsageAttributes, 'id'> { }

class ReferralUsage
    extends Model<ReferralUsageAttributes, ReferralUsageCreationAttributes>
    implements ReferralUsageAttributes {
    public id!: number;
    public companyId!: string;
    public adminId!: string;
    public referralUsageId!: string;
    public referrerType!: 'customer' | 'driver' | 'vendor';
    public referralCode!: string;
    public senderId!: string;
    public receiverId!: string;
    public senderAmount!: number;
    public receiverAmount!: number;
    public status!: 'failed' | 'success' | 'pending';
    public remark!: string;
    public senderTransactionId!: string;
    public receiverTransactionId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

ReferralUsage.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
    companyId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    adminId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: Admin,
            key: 'adminId',
        },
    },
    referralUsageId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    referrerType: {
        type: DataTypes.ENUM('customer', 'driver', 'vendor'),
        allowNull: false,
    },
    referralCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    senderId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    receiverId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    senderAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    receiverAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('failed', 'success', 'pending'),
        allowNull: false,
    },
    remark: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    senderTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    receiverTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'ReferralUsage',
    tableName: 'referral_usages',
    timestamps: true,
    paranoid: true,
    indexes: [
        // Unique constraint
        {
            unique: true,
            fields: ['referralUsageId'],
        },
        {
            unique: true,
            fields: ['adminId', 'referralUsageId'],
        },
        // Common query patterns - optimized for high concurrency
        {
            fields: ['adminId', 'createdAt'], // pagination queries
        },
        {
            fields: ['adminId', 'status', 'createdAt'], // filter by status with pagination
        },
        {
            fields: ['adminId', 'status'], // filter by status
        },
        {
            fields: ['referralCode', 'createdAt'], // referral code usage
        },
        {
            fields: ['senderId', 'createdAt'], // sender referral history
        },
        {
            fields: ['receiverId', 'createdAt'], // receiver referral history
        },
        {
            fields: ['referrerType', 'createdAt'], // filter by referrer type
        },
        {
            fields: ['status'], // status filtering
        },
    ],
});

export { ReferralUsage };       