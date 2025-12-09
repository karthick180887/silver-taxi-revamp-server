import { InvoiceAttributes } from './invoice';
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { PromoCode } from "./promoCodes";


export interface PromoCodeUsageAttributes {
    id: number;
    adminId: string;
    promoCodeUsageId: string;
    codeId?: string;
    promoCode: string;
    customerId: string;
    bookingId?: string;
    type?: "Flat" | "Percentage";
    value?: number;
    bookingAmount: number;
    discountAmount: number;
    finalAmount: number;
    
}

interface PromoCodeUsageCreationAttributes extends Optional<PromoCodeUsageAttributes, 'id'> { }

class PromoCodeUsage extends Model<PromoCodeUsageAttributes, PromoCodeUsageCreationAttributes> implements PromoCodeUsageAttributes {
    public id!: number;
    public adminId!: string;
    public promoCodeUsageId!: string;
    public codeId!: string;
    public promoCode!: string;
    public customerId!: string;
    public bookingId!: string;
    public type!: 'Flat' | 'Percentage';
    public value!: number;
    public bookingAmount!: number;
    public discountAmount!: number;
    public finalAmount!: number;


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

PromoCodeUsage.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    adminId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: Admin,
            key: "adminId",
        },
    },
    promoCodeUsageId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true   
    },
    codeId: {
        type: DataTypes.STRING,
        allowNull: false
       
    },
    promoCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    customerId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    bookingId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM("Flat", "Percentage"),
        allowNull: false,
    },
    value: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    bookingAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    discountAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    finalAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize,
    tableName: "promo_code_usage",
    timestamps: true,
    paranoid: true,
    indexes: [
        // Unique constraint
        {
            unique: true,
            fields: ["promoCodeUsageId"],
        },
        {
            unique: true,
            fields: ["promoCodeUsageId", "bookingId"],
        },
        // Common query patterns - optimized for high concurrency
        {
            fields: ['adminId', 'createdAt'], // pagination queries
        },
        {
            fields: ['adminId', 'codeId', 'createdAt'], // promo code usage with pagination
        },
        {
            fields: ['customerId', 'createdAt'], // customer promo usage
        },
        {
            fields: ['bookingId'], // booking lookup
        },
        {
            fields: ['codeId'], // promo code lookup
        },
        {
            fields: ['promoCode'], // promo code search
        },
    ],
});

export { PromoCodeUsage };