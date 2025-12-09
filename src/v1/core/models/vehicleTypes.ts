import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";

export interface VehicleTypeAttributes {
    id: number;
    adminId: string;
    vTypeId?: string;
    name: string;
    isActive?: boolean;
    order?: number;
    acceptedVehicleTypes?: string[];
}


interface VehicleTypesCreationAttributes extends Optional<VehicleTypeAttributes, 'id'> { }

class VehicleTypes
    extends Model<VehicleTypeAttributes, VehicleTypesCreationAttributes>
    implements VehicleTypeAttributes {
    public id!: number;
    public adminId!: string;
    public vTypeId!: string;
    public name!: string;
    public isActive!: boolean;
    public order!: number;
    public acceptedVehicleTypes!: string[];
}


VehicleTypes.init(
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
        vTypeId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        acceptedVehicleTypes: {
            type: DataTypes.ARRAY(DataTypes.STRING(50)),
            allowNull: false,
            defaultValue: [],
        },
    },
    {
        sequelize,
        modelName: 'VehicleTypes',
        tableName: 'vehicle_types',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['vTypeId', 'adminId'],
            },
        ],
    }
);

export { VehicleTypes };
