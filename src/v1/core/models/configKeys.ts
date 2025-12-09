import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

export interface configKeysAttributes {
    id: number;
    adminId: string;
    keyName: string;
    keyValue: string; // encrypted value
    description?: string;
    isPublic: boolean; // whether safe to send to client
    status: boolean;
}

interface configKeysCreationAttributes extends Optional<configKeysAttributes, "id"> { }

class ConfigKeys extends Model<configKeysAttributes, configKeysCreationAttributes> implements configKeysAttributes {
    public id!: number;
    public adminId!: string;
    public keyName!: string;
    public keyValue!: string;
    public description?: string;
    public isPublic!: boolean;
    public status!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

ConfigKeys.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        adminId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: Admin,
                key: "adminId",
            },
        },
        keyName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        keyValue: {
            type: DataTypes.TEXT, // encrypted string
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false, // secrets default to private
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: "ConfigKeys",
        tableName: "config_keys",
        timestamps: true,
        paranoid: true,
        indexes: [
            { unique: true, fields: ["keyName"] },
            { fields: ["status"] },
        ],
    }
);

export { ConfigKeys };
