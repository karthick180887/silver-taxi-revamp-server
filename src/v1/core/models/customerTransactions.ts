import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Customer } from "./customer";

export interface CustomerTransactionAtttributes {
    id: number;
    adminId: string;
    transactionId?: string;
    customerId: string;
    initiatedBy?: string;
    initiatedTo?: string;
    amount: number;
    transactionType?: "Credit" | "Debit";
    type?: "Booking" | "Referral" | "Wallet";
    source?: "Website" | "App";
    date: Date;
    reason?: string;
    remark?: string | null;
    description?: string;

    walletId?: string;
    isShow?: boolean;

    tnxOrderId?: string;
    tnxPaymentId?: string;
    tnxPaymentStatus?: "Pending" | "Success" | "Failed";
    tnxPaymentMethod?: string;
    tnxPaymentAmount?: number;
    tnxPaymentTime?: Date;

    fareBreakdown?: any;
}

interface CustomerTransactionCreationAttributes extends Optional<CustomerTransactionAtttributes, 'id'> { }

class CustomerTransaction extends Model<CustomerTransactionAtttributes, CustomerTransactionCreationAttributes> implements CustomerTransactionAtttributes {
    public id!: number;
    public adminId!: string;
    public transactionId!: string;
    public customerId!: string;
    public initiatedBy!: string;
    public initiatedTo!: string;
    public amount!: number;
    public transactionType!: "Credit" | "Debit";
    public type!: "Booking" | "Referral" | "Wallet";
    public source!: "Website" | "App";
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

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

CustomerTransaction.init(
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
        customerId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: Customer,
                key: "customerId",
            },
        },
        initiatedBy: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        initiatedTo: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        transactionType: {
            type: DataTypes.ENUM('Credit', 'Debit'),
            allowNull: true,
            defaultValue: null
        },
        type: {
            type: DataTypes.ENUM('Booking', 'Referral', 'Wallet'),
            allowNull: true,
            defaultValue: null
        },
        source: {
            type: DataTypes.ENUM('Website', 'App'),
            allowNull: true,
            defaultValue: null
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
    },
    {
        sequelize,
        modelName: "CustomerTransactions",
        tableName: "customer_transactions",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ["transactionId", "type", "date", "customerId", "adminId"],
            },
            {
                fields: ["fareBreakdown"],
                using: 'GIN',
                name: 'fare_breakdown_gin_index'
            }
        ],
    }
);


export { CustomerTransaction };
