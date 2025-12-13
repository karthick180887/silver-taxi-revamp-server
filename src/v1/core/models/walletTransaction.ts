import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

export interface WalletTransactionAttributes {
    id: number;
    adminId: string;
    transactionId?: string;
    initiatedBy: string;
    initiatedTo: string;
    amount: number;
    type: "Credit" | "Debit";
    date: Date;
    reason?: string;
    remark?: string | null;
    description: string;
    vendorId?: string;
    driverId?: string;
    ownedBy?: "Vendor" | "Driver";

    walletId?: string;
    isShow?: boolean;

    tnxOrderId?: string;
    tnxPaymentId?: string;
    tnxPaymentStatus?: "Pending" | "Success" | "Failed";
    tnxPaymentMethod?: string;
    tnxPaymentAmount?: number;
    tnxPaymentTime?: Date;

    fareBreakdown?: any;
    status?: "Paid" | "Unpaid";

}

interface WalletTransactionCreationAttributes extends Optional<WalletTransactionAttributes, 'id'> { }

class WalletTransaction extends Model<WalletTransactionAttributes, WalletTransactionCreationAttributes> implements WalletTransactionAttributes {
    public id!: number;
    public adminId!: string;
    public transactionId!: string;
    public initiatedBy!: string;
    public initiatedTo!: string;
    public amount!: number;
    public type!: "Credit" | "Debit";
    public date!: Date;
    public reason!: string;
    public description!: string;
    public remark?: string | null;
    public vendorId?: string;
    public driverId?: string;
    public ownedBy?: "Vendor" | "Driver";

    public walletId?: string;
    public isShow?: boolean;

    public tnxOrderId?: string;
    public tnxPaymentId?: string;
    public tnxPaymentStatus?: "Pending" | "Success" | "Failed";
    public tnxPaymentMethod?: string;
    public tnxPaymentAmount?: number;
    public tnxPaymentTime?: Date;

    public fareBreakdown?: any;
    public status?: "Paid" | "Unpaid";

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

WalletTransaction.init(
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
        transactionId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        initiatedBy: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        initiatedTo: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('Credit', 'Debit'),
            allowNull: false,
        },
        date: {
            type: DataTypes.DATE,
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
        vendorId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        driverId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        ownedBy: {
            type: DataTypes.ENUM('Vendor', 'Driver'),
            allowNull: true,
            defaultValue: null,
        },
        walletId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        isShow: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        tnxOrderId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        tnxPaymentId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        tnxPaymentStatus: {
            type: DataTypes.ENUM('Pending', 'Success', 'Failed'),
            allowNull: true,
            defaultValue: "Pending",
        },
        tnxPaymentMethod: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        tnxPaymentAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        tnxPaymentTime: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        fareBreakdown: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        status: {
            type: DataTypes.ENUM('Paid', 'Unpaid'),
            allowNull: true,
            defaultValue: "Unpaid",
        },
    },
    {
        sequelize,
        modelName: "WalletTransaction",
        tableName: "wallet_transactions",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ["transactionId", "type", "date", "vendorId", "driverId", "ownedBy", "adminId"],
            },
            {
                fields: ["fareBreakdown"],
                using: 'GIN',
                name: 'fare_breakdown_gin_index'
            }
        ],
    }
);


export { WalletTransaction };
