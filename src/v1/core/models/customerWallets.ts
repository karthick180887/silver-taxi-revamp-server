import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Customer } from "./customer";

export interface CustomerWalletAttributes {
    id: number;
    adminId: string;
    walletId?: string;
    balance: number;
    startAmount?: number;
    minusAmount?: number;
    plusAmount?: number;
    totalAmount?: number;
    currency?: string;
    customerId?: string;
}

interface CustomerWalletCreationAttributes extends Optional<CustomerWalletAttributes, 'id'> { }

class CustomerWallet extends Model<CustomerWalletAttributes, CustomerWalletCreationAttributes> implements CustomerWalletAttributes {
    public id!: number;
    public adminId!: string;
    public walletId!: string;
    public balance!: number;
    public startAmount!: number;
    public minusAmount!: number;
    public plusAmount!: number;
    public totalAmount!: number;
    public currency!: string;

    public customerId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

CustomerWallet.init(
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
        walletId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        balance: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        startAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        minusAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        plusAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        totalAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'INR',
        },
        customerId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Customer,
                key: "customerId",
            },
        },
    },
    {
        sequelize,
        modelName: "CustomerWallet",
        tableName: "customer_wallets",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["walletId", "customerId"],
            },
            // Common query patterns
            {
                fields: ["adminId", "createdAt"], // pagination queries
            },
            {
                fields: ["customerId"], // customer wallet lookup
            },
            {
                fields: ["walletId"], // walletId lookup (already unique but separate for faster lookups)
            },
        ],
    }
);


export { CustomerWallet };
