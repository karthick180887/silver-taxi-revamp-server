import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Vendor } from "./vendor";
import { Admin } from "./admin";

export interface VendorBankDetailsAttributes {
    id: number;
    adminId: string;
    vendorId: string;
    paymentDetailsId?: string;
    accountName: string;
    bankBookImage?: string;
    bankAccountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankDetailsVerified?: "pending" | "accepted" | "rejected";
    bankDetailsRemark?: string;
    upiId?: string;
    upiNumber?: string;
    upiVerified?: "pending" | "accepted" | "rejected";
    upiRemark?: string;
    accountDescription?: string;

    isActive?: boolean;
    isPrimary?: boolean;
}

interface VendorBankDetailsCreationAttributes extends Optional<VendorBankDetailsAttributes, "id"> { }

class VendorBankDetails
    extends Model<VendorBankDetailsAttributes, VendorBankDetailsCreationAttributes>
    implements VendorBankDetailsAttributes {
    public id!: number;
    public adminId!: string;
    public vendorId!: string;
    public paymentDetailsId!: string;
    public accountName!: string;
    public bankBookImage!: string;
    public bankAccountNumber!: string;
    public bankName!: string;
    public ifscCode!: string;
    public accountHolderName!: string;
    public bankDetailsVerified!: "pending" | "accepted" | "rejected";
    public bankDetailsRemark!: string;
    public upiId!: string;
    public upiNumber!: string;
    public upiVerified!: "pending" | "accepted" | "rejected";
    public upiRemark!: string;
    public accountDescription!: string;

    public isActive!: boolean;
    public isPrimary!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

VendorBankDetails.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        adminId: {
            type: DataTypes.STRING(300),
            allowNull: false,
            references: {
                model: Admin,
                key: "adminId",
            },
        },
        vendorId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: Vendor,
                key: "vendorId",
            },
        },
        paymentDetailsId: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
        },
        accountName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "Name/label for this payment account",
        },
        bankBookImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        bankAccountNumber: {
            unique: true,
            type: DataTypes.STRING,
            allowNull: true,
        },
        bankName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ifscCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        accountHolderName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        bankDetailsVerified: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            allowNull: true,
            defaultValue: "pending",
        },
        bankDetailsRemark: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        upiId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        upiNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        upiVerified: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            allowNull: true,
            defaultValue: "pending",
        },
        upiRemark: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        accountDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        },
        isPrimary: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: "VendorBankDetails",
        tableName: "vendor_bank_details",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                name: "vendor_bank_composite_unique",
                fields: ['vendorId', 'upiId', 'upiNumber', 'bankAccountNumber', 'bankName', 'ifscCode'],
            },
        ]
    });

export { VendorBankDetails };