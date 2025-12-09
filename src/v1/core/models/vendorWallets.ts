import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Vendor } from "./vendor";

export interface VendorWalletAttributes {
    id: number;
    adminId: string;
    walletId?: string;
    balance: number;
    startAmount?: number;
    minusAmount?: number;
    plusAmount?: number;
    totalAmount?: string;
    currency?: string;
    vendorId?: string;
}

interface VendorWalletCreationAttributes extends Optional<VendorWalletAttributes, 'id'> { }

class VendorWallet extends Model<VendorWalletAttributes, VendorWalletCreationAttributes> implements VendorWalletAttributes {
    public id!: number;
    public adminId!: string;
    public walletId!: string;
    public balance!: number;
    public startAmount!: number;
    public minusAmount!: number;
    public plusAmount!: number;
    public totalAmount!: string;
    public currency!: string;

    public vendorId?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

VendorWallet.init(
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
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 0,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'INR',
        },
        vendorId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Vendor,
                key: "vendorId",
            },
        },
    },
    {
        sequelize,
        modelName: "VendorWallet",
        tableName: "vendor_wallets",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["walletId", "vendorId"],
            },
            // Common query patterns
            {
                fields: ["adminId", "createdAt"], // pagination queries
            },
            {
                fields: ["vendorId"], // vendor wallet lookup
            },
            {
                fields: ["walletId"], // walletId lookup (already unique but separate for faster lookups)
            },
        ],
    }
);


export { VendorWallet };
