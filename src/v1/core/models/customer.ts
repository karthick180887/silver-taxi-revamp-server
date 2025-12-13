import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Vendor } from "./vendor";

export interface CustomerAttributes {
    id: number;
    customerId?: string;
    vendorId?: string;
    name: string;
    walletId?: string;
    adminId: string;
    email?: string;
    phone: string;
    createdBy: "Admin" | "Vendor";
    bookingCount?: number;
    totalAmount?: number;
    accessToken?: string;
    fcmToken?: string;
    referralCode?: string;
    referredBy?: string;
    dob?: Date;
    gender?: string;
    isApp?: boolean;
    isWebsite?: boolean;
    rateNow?: boolean;
}


export interface CustomerCreationAttributes extends Optional<CustomerAttributes, "id"> { }

class Customer
    extends Model<CustomerAttributes, CustomerCreationAttributes>
    implements CustomerAttributes {
    public id!: number;
    public customerId!: string;
    public vendorId!: string;
    public adminId!: string;
    public name!: string;
    public walletId!: string;
    public email!: string;
    public phone!: string;
    public createdBy!: "Admin" | "Vendor";
    public bookingCount!: number;
    public totalAmount!: number;
    public accessToken!: string;
    public fcmToken!: string;
    public referralCode!: string;
    public referredBy!: string;
    public dob!: Date;
    public gender!: string;
    public isApp!: boolean;
    public isWebsite!: boolean;
    public rateNow!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}


Customer.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        customerId: {
            type: DataTypes.STRING(225),
            unique: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
        },
        adminId: {
            type: DataTypes.STRING(225),
            allowNull: false,
            references: {
                model: Admin,
                key: "adminId",
            },
        },
        vendorId: {
            type: DataTypes.STRING(225),
            allowNull: true,
            references: {
                model: Vendor,
                key: "vendorId",
            },
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        walletId: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,

        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        bookingCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
                isInt: true,
            }
        },
        totalAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        accessToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        fcmToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        referralCode: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null
        },
        referredBy: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null
        },
        dob: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            defaultValue: null
        },
        gender: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: null
        },
        isApp: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        isWebsite: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        rateNow: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        createdBy: {
            type: DataTypes.ENUM("Admin", "Vendor"),
            allowNull: false,
        }
    },
    {
        sequelize,
        tableName: 'customers',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["adminId", "customerId", "phone", "vendorId"],
            },
        ],
    }
)

export { Customer };
