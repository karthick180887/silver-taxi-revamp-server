import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

// Define the attributes for the Enquiry model
export interface VendorNotificationAttributes {
    id: number;
    adminId: string;
    vendorId: string;
    notifyId?: string;
    title: string;
    message: string;
    route?: string;
    type?: string;
    read: boolean;
    date: Date;
    time?: string;
    templateId?: string;
    imageUrl?: string;
}

// Define the creation attributes for the Enquiry model
interface VendorNotificationCreationAttributes extends Optional<VendorNotificationAttributes, 'id'> { }

// Create the Enquiry model class
class VendorNotification
    extends Model<VendorNotificationAttributes, VendorNotificationCreationAttributes>
    implements VendorNotificationAttributes {
    public id!: number;
    public adminId!: string;
    public vendorId!: string;
    public notifyId!: string;
    public title!: string;
    public message!: string;
    public route!: string;
    public type!: string;
    public read!: boolean;
    public date!: Date;
    public time!: string;
    public templateId!: string;
    public imageUrl!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

// Initialize the Enquiry model
VendorNotification.init(
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
            defaultValue: null,
        },
        notifyId: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
            unique: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        route: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: null,
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: "general",
        },
        read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        time: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        templateId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        imageUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: "VendorNotification",
        tableName: "vendor_notifications",
        timestamps: true,
        paranoid: true,

        indexes: [
            {
                unique: true,
                fields: ["notifyId", "date", "vendorId", "adminId"],
            },
            // Common query patterns
            {
                fields: ["adminId", "vendorId", "createdAt"], // vendor notifications with pagination
            },
            {
                fields: ["adminId", "vendorId"], // vendor notifications
            },
            {
                fields: ["adminId", "vendorId", "read", "createdAt"], // unread notifications with pagination
            },
            {
                fields: ["adminId", "vendorId", "read"], // unread notifications
            },
            {
                fields: ["notifyId"], // notifyId lookup (already in unique but separate for faster lookups)
            },
            {
                fields: ["date"], // date-based queries
            },
            {
                fields: ["type"], // type filtering
            },
        ],
    }
);



export { VendorNotification };