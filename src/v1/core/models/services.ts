import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";


type taxAttributes = {
  GST?: number;
  vendorGST?: number;
}

export interface ServiceAttributes {
  id: number;
  adminId: string
  serviceId?: string;
  name: "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages";
  tax?: taxAttributes;
  minKm?: number;
  vendorCommission?: number;
  driverCommission?: number;
  include?:string;
  exclude?:string;
  city?: string[];
  isActive: boolean;
}

interface ServiceCreationAttributes extends Optional<ServiceAttributes, "id"> { }

class Service
  extends Model<ServiceAttributes, ServiceCreationAttributes>
  implements ServiceAttributes {
  public id!: number;
  public isActive!: boolean;
  public serviceId!: string;
  public adminId!: string;
  public name!: "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages";
  public tax!: taxAttributes;
  public minKm!: number;
  public include?:string;
  public exclude?:string;
  public vendorCommission!: number;
  public driverCommission!: number;
  public city!: string[];

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

Service.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.STRING(225),
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4(),
    },
    adminId: {
      type: DataTypes.STRING(225),
      allowNull: false,
      references: {
        model: Admin,
        key: "adminId",
      }
    },
    name: {
      type: DataTypes.ENUM("One way", "Round trip", "Airport Pickup", "Airport Drop", "Day Packages", "Hourly Packages"),
      allowNull: false,
    },

    tax: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    minKm: {
      type: DataTypes.BIGINT,
      allowNull: true,
      validate: {
        min: 0,
        isInt: true,
      }
    },
    include: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    exclude: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    vendorCommission: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 99,
        isInt: true,
      }
    },
    driverCommission: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 99,
        isInt: true,
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    city: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    }
  },
  {
    sequelize,
    modelName: "Service",
    tableName: "services",
    timestamps: true,
    paranoid: true, 
    indexes: [
      {
        unique: true,
        fields: ["adminId", "serviceId", "name"], 
      },
      {
        fields:["tax"],
        using: "GIN",
        name: "idx_service_tax",
      }
    ],
    comment: "Table for storing service details",
  }
);


export { Service };
