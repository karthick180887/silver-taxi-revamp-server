import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Driver } from "./driver";

export interface VehicleAttributes {
  id: number;
  adminId: string;
  vehicleId?: string;
  driverId?: string;
  name?: string;
  type: string;
  fuelType?: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  isActive: boolean;
  imageUrl?: string | null;
  seats?: number;
  bags?: number;
  order?: number;
  permitCharge?: number;
  vehicleYear?: number;
  vehicleNumber?: string;
  // driverBeta?: number;
  isAdminVehicle?: boolean;
  adminVerified?: "Pending" | "Approved" | "Rejected";
  documentUploaded?: boolean;
  profileVerified?: "pending" | "accepted" | "rejected";
  documentVerified?: "pending" | "accepted" | "rejected";
  remark?: string;
  documentRemark?: string;
  rcBookImageFront?: string;
  //New Changes from here 
  rcFrontVerified?: "pending" | "accepted" | "rejected";
  rcFrontRemark?: string;
  rcBookImageBack?: string;
  rcBackVerified?: "pending" | "accepted" | "rejected";
  rcBackRemark?: string;
  rcExpiryDate?: Date;
  insuranceImage?: string;
  insuranceVerified?: "pending" | "accepted" | "rejected";
  insuranceRemark?: string;
  insuranceExpiryDate?: string;
  pollutionImage?: string;
  pollutionImageVerified?: "pending" | "accepted" | "rejected";
  pollutionImageRemark?: string;
  isUpdated?: boolean;
  //  to here.
  pollutionExpiryDate?: Date;


}

interface VehicleCreationAttributes extends Optional<VehicleAttributes, "id"> { }

class Vehicle
  extends Model<VehicleAttributes, VehicleCreationAttributes>
  implements VehicleAttributes {
  public id!: number;
  public adminId!: string;
  public vehicleId!: string;
  public driverId!: string;
  public name!: string;
  public type!: string;
  public fuelType!: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  public isActive!: boolean;
  public imageUrl!: string | null;
  public seats!: number;
  public bags!: number;
  public permitCharge!: number;
  public order!: number;
  public vehicleYear!: number;
  public vehicleNumber!: string;
  // public driverBeta!: number;
  public isAdminVehicle!: boolean;
  public adminVerified!: "Pending" | "Approved" | "Rejected";
  public documentUploaded!: boolean;
  public profileVerified!: "pending" | "accepted" | "rejected";
  public documentVerified!: "pending" | "accepted" | "rejected";
  public remark!: string;
  public documentRemark!: string;
  public rcFrontVerified!: "pending" | "accepted" | "rejected";
  public rcFrontRemark!: string;
  public rcBackVerified!: "pending" | "accepted" | "rejected";
  public rcBackRemark!: string;
  public insuranceVerified?: "pending" | "accepted" | "rejected";
  public insuranceRemark?: string;
  public pollutionImageVerified?: "pending" | "accepted" | "rejected";
  public pollutionImageRemark?: string;
  public isUpdated?: boolean;

  public rcBookImageFront!: string;
  public rcBookImageBack!: string;
  public rcExpiryDate!: Date;
  public insuranceImage!: string;
  public insuranceExpiryDate!: string;
  public pollutionImage!: string;
  public pollutionExpiryDate!: Date;


  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

Vehicle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      allowNull: false,
    },
    vehicleId: {
      type: DataTypes.TEXT,
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
    driverId: {
      type: DataTypes.STRING(225),
      allowNull: true,
      references: {
        model: Driver,
        key: "driverId",
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fuelType: {
      type: DataTypes.ENUM('Petrol', 'Diesel', 'Electric', 'Hybrid'),
      defaultValue: 'Petrol',
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    imageUrl: {
      type: DataTypes.STRING(500), // URL or file path for the image
      defaultValue: null,
      allowNull: true,
    },
    seats: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: 1,
        isInt: true, // Ensures the value is an integer
      },
    },
    bags: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: 0,
        isInt: true, // Ensures the value is an integer
      },
    },
    permitCharge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: 0,
        isInt: true,
      }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      allowNull: true,
      validate: {
        min: 0,
        isInt: true,
      }
    },
    vehicleYear: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      allowNull: true,
      validate: {
        min: 1900,
        max: 2100,
        isInt: true,
      }
    },
    vehicleNumber: {
      type: DataTypes.STRING(255),
      defaultValue: null,
      allowNull: true,
    },
    // driverBeta: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   defaultValue: 0,
    //   validate: {
    //     min: 0,
    //     isInt: true,
    //   }
    // },
    isAdminVehicle: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    adminVerified: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      allowNull: false,
      defaultValue: "Pending",
    },
    documentUploaded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    profileVerified: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    documentVerified: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    documentRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rcBookImageFront: {
      type: DataTypes.TEXT,
      defaultValue: null,
      allowNull: true,
    },
    rcBookImageBack: {
      type: DataTypes.TEXT,
      defaultValue: null,
      allowNull: true,
    },
    rcExpiryDate: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    },
    insuranceImage: {
      type: DataTypes.TEXT,
      defaultValue: null,
      allowNull: true,
    },
    insuranceExpiryDate: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    },
    pollutionImage: {
      type: DataTypes.TEXT,
      defaultValue: null,
      allowNull: true,
    },
    pollutionExpiryDate: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    },

    // New Changes from here
    rcFrontVerified: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    rcFrontRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rcBackVerified: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    rcBackRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    insuranceVerified: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    insuranceRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pollutionImageVerified: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    pollutionImageRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isUpdated: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false, // Indicates if the vehicle has updated its documents
    },
    // to here.

  },
  {
    sequelize,
    modelName: "Vehicle",
    tableName: "vehicles",
    timestamps: true,
    paranoid: true, // Enables soft deletes
    indexes: [
      {
        unique: true,
        fields: ["adminId", "vehicleId", "type"],
      },
      // Common query patterns
      {
        fields: ["adminId", "createdAt"], // pagination queries
      },
      {
        fields: ["adminId", "isActive", "createdAt"], // active vehicles with pagination
      },
      {
        fields: ["adminId", "isActive"], // active vehicles
      },
      {
        fields: ["adminId", "adminVerified", "createdAt"], // verification status with pagination
      },
      {
        fields: ["adminId", "adminVerified"], // verification status
      },
      {
        fields: ["driverId", "adminId"], // driver vehicles lookup
      },
      {
        fields: ["driverId"], // driver vehicles
      },
      {
        fields: ["vehicleId"], // vehicleId lookup (already in unique but separate for faster lookups)
      },
      {
        fields: ["type"], // vehicle type filtering
      },
      {
        fields: ["vehicleNumber"], // vehicle number search
      },
    ],
    comment: "Table for storing vehicle details",
  }
);

// Vehicle.sync({ alter: true });
export { Vehicle };
