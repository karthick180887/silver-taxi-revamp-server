import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Offers } from "./offers";
export interface OfferUsageAttributes {
    id: number;
    adminId: string;
    offerId?: string;
    offerName?: string;
    customerId?: string;
    bookingId?: string;
    bookingAmount?: number;
    type?: "Flat" | "Percentage";
    value?: Number;
    discountAmount?: number;
    finalAmount?: number;

}

interface OfferUsageCreationAttributes extends Optional<OfferUsageAttributes, 'id'> { }

class OfferUsage extends Model<OfferUsageAttributes, OfferUsageCreationAttributes> implements OfferUsageAttributes {
    public id!: number;
    public adminId!: string;
    public offerId!: string;
    public offerName!: string;
    public customerId!: string;
    public bookingId!: string;
    public bookingAmount!: number;
    public type!: "Flat" | "Percentage";
    public value!: Number;
    public discountAmount!: number;
    public finalAmount!: number;


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

OfferUsage.init({
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
    offerId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    offerName: {
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
    bookingAmount: {
        type: DataTypes.INTEGER,
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
    tableName: "offer_usage",
    timestamps: true,
    paranoid: true,
    indexes: [
        // Unique constraint
        {
            unique: true,
            fields: ["offerId", "customerId", "bookingId"],
        },
        // Common query patterns - optimized for high concurrency
        {
            fields: ['adminId', 'createdAt'], // pagination queries
        },
        {
            fields: ['adminId', 'offerId', 'createdAt'], // offer usage with pagination
        },
        {
            fields: ['customerId', 'createdAt'], // customer offer usage
        },
        {
            fields: ['bookingId'], // booking lookup
        },
        {
            fields: ['offerId'], // offer lookup
        },
    ],
});

export { OfferUsage };