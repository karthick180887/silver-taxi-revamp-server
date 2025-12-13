import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Service } from "./services";
import { Vehicle } from "./vehicles";
import { Vendor } from "./vendor";
export interface HourlyPackageAttributes {
  id: number;
  adminId: string;
  vendorId?: string;
  packageId?: string;
  serviceId: string;
  vehicleId: string;
  noOfHours: string;
  distanceLimit?: number;
  price: number;
  extraPrice: number;
  status: boolean;
  createdBy: "Admin" | "Vendor";

  driverBeta?: number;
}

interface HourlyPackageCreationAttributes extends Optional<HourlyPackageAttributes, "id"> { }

class HourlyPackage
  extends Model<HourlyPackageAttributes, HourlyPackageCreationAttributes>
  implements HourlyPackageAttributes {
  public id!: number;
  public adminId!: string;
  public vendorId!: string;
  public packageId!: string;
  public serviceId!: string;
  public vehicleId!: string;
  public noOfHours!: string;
  public distanceLimit!: number;
  public price!: number;
  public extraPrice!: number;
  public status!: boolean;
  public createdBy!: "Admin" | "Vendor";
  
  public driverBeta!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

HourlyPackage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    adminId: {
      type: DataTypes.STRING(225),
      allowNull: false,
    },
    vendorId: {
      type: DataTypes.STRING(225),
      allowNull: true,
      defaultValue: null,
      references: {
        model: Vendor,
        key: "vendorId",
      }
    },
    packageId: {
      type: DataTypes.STRING(225),
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4(),
    },
    serviceId: {
      type: DataTypes.STRING(225),
      allowNull: false,
      references: {
        model: Service,
        key: "serviceId",
      }
    },
    vehicleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: Vehicle,
        key: "vehicleId",
      }
    },
    noOfHours: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    distanceLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    extraPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.ENUM("Admin", "Vendor"),
      allowNull: false,
    },
    driverBeta: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "HourlyPackage",
    tableName: "hourly_packages",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: [
          "serviceId",
          "packageId",
          "adminId",
          "vehicleId",
          "createdBy",
          "vendorId",
          "status"
        ],
      },
    ],
    comment: "Table for storing hourly packages",
  }
);


export { HourlyPackage };
