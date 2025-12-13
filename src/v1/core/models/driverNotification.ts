import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

// Define the attributes for the Enquiry model
export interface DriverNotificationAttributes {
    id: number;
    adminId: string;
    driverId: string;
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
interface DriverNotificationCreationAttributes extends Optional<DriverNotificationAttributes, 'id'> { }

// Create the Enquiry model class
class DriverNotification
    extends Model<DriverNotificationAttributes, DriverNotificationCreationAttributes>
    implements DriverNotificationAttributes {
    public id!: number;
    public adminId!: string;
    public driverId!: string;
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
DriverNotification.init(
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
        driverId: {
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
        modelName: "DriverNotification",
        tableName: "driver_notifications",
        timestamps: true,
        paranoid: true,

        indexes: [
            {
                unique: true,
                fields: ["notifyId", "date", "driverId", "adminId"],
            },

        ],
    }
);



export { DriverNotification };