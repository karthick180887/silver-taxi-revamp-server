import { DataTypes, Model, Optional } from "sequelize";
import { Admin } from "./admin";
import { sequelize } from "../../../common/db/postgres";


export interface PromoCodeAttributes {
    id: number;
    adminId: string;
    codeId?: string;
    code: string;
    promoName?: string;
    bannerImage?: string;
    title?: string;
    description?: string;
    keywords?: string;
    type: "Flat" | "Percentage";
    category?: "All" | "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages";
    value: number;
    minAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    usedCount?: number;
    status: boolean;
    startDate: Date;
    endDate: Date;
    limit?: number;
}

export interface PromoCodeCreationAttributes extends Optional<PromoCodeAttributes, "id"> { }

class PromoCode extends Model<PromoCodeAttributes, PromoCodeCreationAttributes> implements PromoCodeAttributes {
    public id!: number;
    public adminId!: string;
    public codeId!: string;
    public code!: string;
    public promoName!: string;
    public title!: string ;
    public bannerImage!: string;
    public description!: string;
    public type!: "Flat" | "Percentage";
    public category!: "All" | "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages";
    public value!: number;
    public minAmount!: number;
    public maxDiscount!: number;
    public usageLimit!: number;
    public usedCount!: number;
    public status!: boolean;
    public startDate!: Date;
    public endDate!: Date;
    public limit!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

PromoCode.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
    },
    adminId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: Admin,
            key: "adminId"
        },
    },
    codeId: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    promoName: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    title:{
        type:DataTypes.STRING(255),
        allowNull: true,
    },

    bannerImage: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM("Flat", "Percentage"),
        allowNull: false,
    },
    category: {
        type: DataTypes.ENUM("All", "One way", "Round trip", "Airport Pickup", "Airport Drop", "Day Packages", "Hourly Packages"),
        allowNull: false,
    },
    value: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    minAmount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    maxDiscount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    usedCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    sequelize,
    tableName: "promo_codes",
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            unique: true,
            fields: ["adminId", "codeId", "code", "status"],
        },
        // Common query patterns
        {
            fields: ["adminId", "createdAt"], // pagination queries
        },
        {
            fields: ["adminId", "status", "createdAt"], // status filtering with pagination
        },
        {
            fields: ["adminId", "status"], // status filtering
        },
        {
            fields: ["code"], // code lookup (already in unique but separate for faster lookups)
        },
        {
            fields: ["codeId"], // codeId lookup
        },
        {
            fields: ["startDate", "endDate"], // date range queries for active promos
        },
        {
            fields: ["category"], // category filtering
        },
    ],
});

export { PromoCode };