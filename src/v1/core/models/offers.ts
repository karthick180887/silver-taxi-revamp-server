import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

export interface OfferAttributes {
    id: number;
    offerId?: string;
    adminId: string;
    offerName: string;
    title?: string;
    bannerImage?: string;
    description?: string;
    keywords?: string;
    category: "All" | "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages";
    type: "Flat" | "Percentage";
    value: number;
    usageLimit?: number;
    usedCount: number;
    status: boolean;
    startDate: Date;
    endDate: Date;
    limit?: number;    
}

interface OfferCreationAttributes extends Optional<OfferAttributes, 'id'> { }

class Offers extends Model<OfferAttributes, OfferCreationAttributes> implements OfferAttributes {
    public id!: number;
    public offerId!: string;
    public adminId!: string;
    public offerName!: string;
    public title!: string;
    public category!: "All" | "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages" ;
    public bannerImage!: string;
    public description!: string;
    public keywords!: string;
    public type!: "Flat" | "Percentage";
    public value!: number;
    public usedCount!: number;
    public status!: boolean;
    public startDate!: Date;
    public offerUsage!: string;
    public limit!: number;
    public usageLimit!: number;



    public endDate!: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

Offers.init(        
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true,
        },
        offerId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
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
        offerName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        title:{
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        bannerImage: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        category: {
            type: DataTypes.ENUM("All", "One way", "Round trip", "Airport Pickup", "Airport Drop", "Day Packages", "Hourly Packages"),
            allowNull: false,
        },
        keywords: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        }, 
        type: {
            type: DataTypes.ENUM("Flat", "Percentage"),
            allowNull: false,
        },
        value: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        usedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
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
        usageLimit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: "Offer",
        tableName: "offers",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["offerId", "adminId","category","type","status"],
            },
        ],
    }
);

export { Offers };
