import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";

// Define the attributes for the Enquiry model
export interface NotificationAttributes {
    id: number;
    adminId: string;
    templateId?: string;
    title: string;
    message: string;
    target?: 'vendor' | 'driver' | 'customer' | 'all' |'none';
    type?: string;
    image?: string;
    status: boolean;
    route?: string;
    data?: any;
    time?: string;
    particularIds?: string[];
    deletedAt?: Date;
}

// Define the creation attributes for the Enquiry model
interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id'> { }

// Create the Enquiry model class
class NotificationTemplates
    extends Model<NotificationAttributes, NotificationCreationAttributes>
    implements NotificationAttributes {
    public id!: number;
    public adminId!: string;
    public templateId!: string;
    public title!: string;
    public message!: string;
    public target!: 'vendor' | 'driver' | 'customer' | 'all' |'none';
    public type!: string;
    public image?: string;
    public status!: boolean;
    public route?: string;
    public data?: any;
    public time?: string;
    public particularIds?: string[];


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

// Initialize the Enquiry model
NotificationTemplates.init(
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
        templateId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            // defaultValue: null,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        target: {
            type: DataTypes.ENUM('vendor', 'driver', 'customer', 'all', 'none'),
            allowNull: true,
            defaultValue: 'none',
        },
        type: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        image: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        route: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        data: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
        },
        time: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: null,
        },
        particularIds: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
    },
    {
        sequelize,
        modelName: "NotificationTemplates",
        tableName: "notification_templates",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["templateId", "adminId", "target"],
            },

        ],
    }
);



export { NotificationTemplates };