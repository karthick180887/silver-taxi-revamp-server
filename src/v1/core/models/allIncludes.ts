import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";


export interface VehicleAttributes {
    vehicleId: string;
    name: string;
    type: string;
    number?: string;
}


export interface AllIncludesAttributes {
    id: number;
    adminId: string;
    includeId?: string;
    origin: string;
    destination: string;
    tollPrice?: number;
    hillPrice?: number;
    Km: number;
    vehicles?: VehicleAttributes[] | null;
}


export interface AllIncludesCreationAttributes extends Optional<AllIncludesAttributes, "id"> { }

class AllIncludes
    extends Model<AllIncludesAttributes, AllIncludesCreationAttributes>
    implements AllIncludesAttributes {

    public id!: number;
    public adminId!: string;
    public includeId!: string;
    public origin!: string;
    public destination!: string;
    public tollPrice!: number;
    public hillPrice!: number;
    public Km!: number;
    public vehicles!: VehicleAttributes[];

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

AllIncludes.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    adminId: {
        type: DataTypes.STRING(225),
        allowNull: false,
        references: {
            model: Admin,
            key: "adminId",
        },
    },
    includeId: {
        type: DataTypes.STRING(225),
        allowNull: false,
        defaultValue: DataTypes.UUIDV4(),
    },
    origin: {
        type: DataTypes.STRING(225),
        allowNull: false,
    },
    destination: {
        type: DataTypes.STRING(225),
        allowNull: false,
    },
    tollPrice: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    hillPrice: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    Km: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    vehicles: {
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull: true,
        defaultValue: null,
    },
}, {
    sequelize,
    modelName: 'AllIncludes',
    tableName: 'all_includes',
    timestamps: true,
    paranoid: true,
    indexes: [
        // Unique constraint
        {
            unique: true,
            fields: ['includeId'],
        },
        // Common query patterns - optimized for high concurrency
        {
            fields: ['adminId', 'createdAt'], // pagination queries
        },
        {
            fields: ['adminId'], // admin filtering
        },
        {
            fields: ["adminId", "includeId"], // admin + includeId lookup
        },
        {
            fields: ['origin', 'destination'], // route lookup (most common)
        },
        {
            fields: ['adminId', 'origin', 'destination'], // admin + route lookup
        },
    ],
});



export { AllIncludes };

