import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Driver } from "./driver";

export interface DriverWalletAttributes {
    id: number;
    adminId: string;
    walletId?: string;
    balance: number;
    startAmount?: number;
    minusAmount?: number;
    plusAmount?: number;
    totalAmount?: string;
    currency?: string;
    driverId?: string;
}

interface DriverWalletCreationAttributes extends Optional<DriverWalletAttributes, 'id'> { }

class DriverWallet extends Model<DriverWalletAttributes, DriverWalletCreationAttributes> implements DriverWalletAttributes {
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
    public driverId?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

DriverWallet.init(
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
        driverId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Driver,
                key: "driverId",
            },
        },
    },
    {
        sequelize,
        modelName: "DriverWallet",
        tableName: "driver_wallets",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["walletId", "driverId"],
            },
        ],
    }
);


export { DriverWallet };
