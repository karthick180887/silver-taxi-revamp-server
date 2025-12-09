import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Service } from "./services";
import { Vehicle } from "./vehicles";
import { Vendor } from "./vendor";


export interface TariffAttributes {
    id: number;
    adminId: string;
    vendorId?: string;
    tariffId?: string;
    serviceId: string;
    vehicleId: string;
    price: number;
    type?: "Pickup" | "Drop" | "Both";
    extraPrice?: number;
    status: boolean;
    includes?: any;
    increasedPrice?: number;
    createdBy: "Admin" | "Vendor";
    description?: string;
    driverBeta?: number;
}

interface TariffCreationAttributes extends Optional<TariffAttributes, 'id'> { }

class Tariff
    extends Model<TariffAttributes, TariffCreationAttributes>
    implements TariffAttributes {
    public id!: number;
    public adminId!: string;
    public vendorId!: string;
    public tariffId!: string;
    public serviceId!: string;
    public vehicleId!: string;
    public price!: number;
    public type!: "Pickup" | "Drop" | "Both";
    public extraPrice!: number;
    public increasedPrice!: number;
    public status!: boolean;
    public includes!: any;
    public createdBy!: "Admin" | "Vendor";
    public description!: string;
    public driverBeta!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

Tariff.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true,
        },
        adminId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            references: {
                model: Admin,
                key: "adminId",
            },
        },
        vendorId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            references: {
                model: Vendor,
                key: "vendorId",
            },
        },
        tariffId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
        },
        serviceId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            references: {
                model: Service,
                key: "serviceId",
            },
        },
        vehicleId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            references: {
                model: Vehicle,
                key: "vehicleId",
            },
        },
        type: {
            type: DataTypes.ENUM("Pickup", "Drop", "Both"),
            allowNull: true,
            defaultValue: null,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        extraPrice: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        increasedPrice: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.ENUM("Admin", "Vendor"),
            allowNull: false,
            defaultValue: "Admin",
        },
        includes: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        description:{
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        driverBeta:{
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        }
    },
    {
        sequelize,
        modelName: "Tariff",
        tableName: "tariffs",
        timestamps: true,
        paranoid: true,

        indexes: [
            // Unique constraint on tariffId only (the 7-column unique was inefficient)
            {
                unique: true,
                fields: ["tariffId"],
            },
            // Common query patterns - optimized for high concurrency
            {
                fields: ["adminId", "createdAt"], // pagination queries
            },
            {
                fields: ["adminId", "status", "createdAt"], // status filtering with pagination (most common)
            },
            {
                fields: ["adminId", "status"], // status filtering
            },
            {
                fields: ["adminId", "vendorId", "createdAt"], // vendor tariffs with pagination
            },
            {
                fields: ["adminId", "vendorId"], // vendor tariffs
            },
            {
                fields: ["adminId", "vendorId", "status"], // vendor active tariffs
            },
            {
                fields: ["serviceId", "vehicleId", "status"], // service and vehicle lookup (most common for pricing)
            },
            {
                fields: ["serviceId", "vehicleId"], // service and vehicle lookup
            },
            {
                fields: ["serviceId", "status"], // service filtering
            },
            {
                fields: ["vehicleId", "status"], // vehicle filtering
            },
        ],
    }
);


export { Tariff };
