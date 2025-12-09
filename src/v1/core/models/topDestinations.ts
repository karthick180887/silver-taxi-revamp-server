import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

export interface TopDestinationsAttributes {
    id: number;
    adminId?: string;
    destinationsId?: string;
    fromCity?: string;
    destinations?: any;
}

interface TopDestinationsCreationAttributes extends Optional<TopDestinationsAttributes, "id"> { }

class TopDestinations
    extends Model<TopDestinationsAttributes, TopDestinationsCreationAttributes>
    implements TopDestinationsAttributes {
    public id!: number;
    public adminId!: string;
    public destinationsId!: string;
    public fromCity!: string;
    public destinations!: any;


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

TopDestinations.init(
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
            }
        },
        destinationsId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            defaultValue: DataTypes.UUIDV4(),
        },
        fromCity: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        destinations: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: null

        }
    },
    {
        sequelize,
        modelName: "TopDestinations",
        tableName: "top_destinations",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["destinationsId"],

            },
            {
                fields: ["destinations"],
                using: 'GIN',
                name: 'idx_destinations'
            }
        ],
        comment: "Table for storing top destinations details",
    }
);


export { TopDestinations };


