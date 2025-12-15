import { SocialLinksAttributes, UPIAttributes } from "v1/types";
import { sequelize } from "../../../common/db/postgres";
import { DataTypes, Model, Optional } from "sequelize";
import { Admin } from "./admin";
import { Vendor } from "./vendor";


export interface ReferralAttributes {
    senderAmount: number;
    receiverAmount: number;
}


export interface CompanyProfileAttributes {
    id: number;
    adminId: string;
    vendorId?: string;
    companyId?: string;
    logo?: string;
    name: string;
    email: string;
    phone: string;
    whatsappNumber?: string;
    address?: string;
    GSTNumber?: string;
    UPI?: UPIAttributes;
    website?: string;
    description?: string;
    driverWalletAmount?: number;
    vendorWalletAmount?: number;
    createdBy: "Admin" | "Vendor";

    socialLinks?: SocialLinksAttributes;

    taxCommissionPercentage?: number;
    customerReferral?: ReferralAttributes;
    driverReferral?: ReferralAttributes;
    vendorReferral?: ReferralAttributes;
    companyCommission?: number;
    companyCommissionPercentage?: number;

    convenienceFee?: number;
}

interface CompanyProfileCreationAttributes extends Optional<CompanyProfileAttributes, "id"> { }

class CompanyProfile
    extends Model<CompanyProfileAttributes, CompanyProfileCreationAttributes>
    implements CompanyProfileAttributes {
    public id!: number;
    public adminId!: string;
    public vendorId?: string;
    public createdId!: string;
    public companyId!: string;
    public logo?: string;
    public name!: string;
    public email!: string;
    public phone!: string;
    public whatsappNumber?: string;
    public address?: string;
    public GSTNumber!: string;
    public UPI!: UPIAttributes;
    public website!: string;
    public description!: string;
    public driverWalletAmount?: number;
    public vendorWalletAmount?: number;
    public socialLinks!: SocialLinksAttributes;
    public createdBy!: "Admin" | "Vendor";

    public taxCommissionPercentage?: number;
    public customerReferral?: ReferralAttributes;
    public driverReferral?: ReferralAttributes;
    public vendorReferral?: ReferralAttributes;
    public companyCommission?: number;
    public companyCommissionPercentage?: number;

    public convenienceFee?: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

CompanyProfile.init(
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
            }
        },
        vendorId: {
            type: DataTypes.STRING(225),
            allowNull: true,
            defaultValue: null,
            // references: {
            //     model: Vendor,
            //     key: "vendorId",
            // }
        },
        companyId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
            unique: true,
        },
        logo: {
            type: DataTypes.STRING(512),
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            // unique: true,
        },
        phone: {
            type: DataTypes.ARRAY(DataTypes.STRING(20)),
            allowNull: false,
        },
        whatsappNumber: {
            type: DataTypes.ARRAY(DataTypes.STRING(20)),
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        GSTNumber: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        UPI: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        website: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        driverWalletAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        vendorWalletAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        socialLinks: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.ENUM("Admin", "Vendor"),
            allowNull: false,
        },
        taxCommissionPercentage: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        customerReferral: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        driverReferral: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        vendorReferral: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        companyCommission: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        companyCommissionPercentage: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        convenienceFee: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: "CompanyProfile",
        tableName: "company_profile",
        timestamps: true,
        // paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["adminId", "companyId", "createdBy", "email", "vendorId"],
            },
            {
                fields: ["UPI"],
                using: "GIN",
                name: "idx_profile_UPI",
            },

            {
                fields: ["socialLinks"],
                using: "GIN",
                name: "idx_profile_socialLinks",
            },

        ],
    }



);

export { CompanyProfile };