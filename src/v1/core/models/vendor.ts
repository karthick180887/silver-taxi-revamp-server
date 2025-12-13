import { DataTypes, Model, Optional, } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { VendorWallet } from "./vendorWallets";
import { Admin } from "./admin";



export interface VendorAttributes {
    id: number;
    adminId: string;
    vendorId?: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    fcmToken?: string;
    remark?: string;
    walletId?: string;
    isLogin: boolean;
    totalEarnings?: string;

    reason?: string;
    website?: string; 
}


interface VendorCreationAttributes extends Optional<VendorAttributes, 'id'> { }

class Vendor
    extends Model<VendorAttributes, VendorCreationAttributes>
    implements VendorAttributes {
    public id!: number;
    public adminId!: string;
    public vendorId!: string;
    public name!: string;
    public email!: string;
    public phone!: string;
    public password!: string;
    public remark!: string;
    public walletId!: string;
    public fcmToken!: string;
    public isLogin!: boolean;
    public totalEarnings!: string;

    public reason!: string;
    public website!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

Vendor.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true,
        },
        adminId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: Admin,
                key: "adminId",
            },
        },
        vendorId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        remark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        fcmToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        walletId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: VendorWallet,
                key: "walletId",
            },
        },
        isLogin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        totalEarnings: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '0',
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        website: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: "Vendor",
        tableName: "vendor",
        timestamps: true,
        // paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["adminId", "vendorId", "email", "phone", "walletId"],
            }
        ],
        comment: "Table for vendors",
    }
)


export { Vendor }