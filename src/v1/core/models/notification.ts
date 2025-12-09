import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

// Define the attributes for the Enquiry model
export interface NotificationAttributes {
    id: number;
    adminId: string;
    vendorId?: string;
    notificationId?: string;
    title: string;
    description: string;
    route?: string;
    type?: string;
    read: boolean;
    date: Date;
    time?: string;
}

// Define the creation attributes for the Enquiry model
interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id'> { }

// Create the Enquiry model class
class Notification
    extends Model<NotificationAttributes, NotificationCreationAttributes>
    implements NotificationAttributes {
    public id!: number;
    public adminId!: string;
    public vendorId!: string;
    public notificationId!: string;
    public title!: string;
    public description!: string;
    public route?: string;
    public type!: string;
    public read!: boolean;
    public date!: Date;
    public time!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

// Initialize the Enquiry model
Notification.init(
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
        },
        vendorId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        notificationId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
            unique: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        route: {
            type: DataTypes.STRING(120),
            allowNull: true,
            defaultValue: null,
        },
        type: {
            type: DataTypes.STRING(255),
            allowNull: true,
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
    },
    {
        sequelize,
        modelName: "Notification",
        tableName: "notifications",
        timestamps: true,
        paranoid: true,

        indexes: [
            {
                unique: true,
                fields: ["notificationId", "date", "vendorId", "adminId"],
            },
            // Common query patterns
            {
                fields: ["adminId", "createdAt"], // pagination queries
            },
            {
                fields: ["adminId", "read", "createdAt"], // unread notifications with pagination
            },
            {
                fields: ["adminId", "read"], // unread notifications
            },
            {
                fields: ["adminId", "vendorId", "createdAt"], // vendor notifications with pagination
            },
            {
                fields: ["adminId", "vendorId"], // vendor notifications
            },
            {
                fields: ["notificationId"], // notificationId lookup (already in unique but separate for faster lookups)
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



export { Notification };