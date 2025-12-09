import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

// Define the attributes for the Enquiry model
export interface DynamicRouteAttributes {
    id: number;
    routeId?: string;
    image?: string;
    adminId: string;
    title: string;
    link: string;
    status: boolean;
}

// Define the creation attributes for the Enquiry model
interface DynamicRouteCreationAttributes extends Optional<DynamicRouteAttributes, 'id'> { }

// Create the Enquiry model class
class DynamicRoute
    extends Model<DynamicRouteAttributes, DynamicRouteCreationAttributes>
    implements DynamicRouteAttributes {
    public id!: number;
    public routeId!: string;
    public image?: string;
    public adminId!: string;
    public title!: string;
    public link!: string;
    public status!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

// Initialize the Enquiry model
DynamicRoute.init(
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
                key: 'adminId',
            },
        },
        routeId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
            unique: true,
        },
        image: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        link: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: "DynamicRoute",
        tableName: "dynamic_routes",
        timestamps: true,
        paranoid: true,

        indexes: [
            {
                unique: true,
                fields: ["routeId", "title", "status", "image"],
            },

        ],
    }
);



export { DynamicRoute };