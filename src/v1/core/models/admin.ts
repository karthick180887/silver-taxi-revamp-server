import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";

interface AppObject {
  link: string;
  version: string;
  buildNo: string;
}

interface VersionsAttributes {
  customerAppVersion: AppObject;
  driverAppVersion: AppObject;
  vendorAppVersion: AppObject;
  adminPanelVersion: string;
}

export interface AdminAttributes {
  id: number;
  adminId?: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  domain?: string;
  versions?: VersionsAttributes;
}

interface AdminCreationAttributes extends Optional<AdminAttributes, "id"> { }

class Admin
  extends Model<AdminAttributes, AdminCreationAttributes>
  implements AdminAttributes {
  public id!: number;
  public name!: string;
  public adminId!: string;
  public email!: string;
  public password!: string;
  public phone!: string;
  public role!: string;
  public domain!: string;

  public versions?: VersionsAttributes;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    },
    adminId: {
      type: DataTypes.STRING(300),
      allowNull: false,
      defaultValue: DataTypes.UUIDV4(),
      unique: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "admin", // Default role can be set to 'admin'
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    versions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        customerAppVersion: {
          link: "",
          version: "1.0.1",
          buildNo: "12",
        },
        driverAppVersion: {
          link: "",
          version: "1.3.0",
          buildNo: "110",
        },
        vendorAppVersion: {
          link: "",
          version: "2.1.1",
          buildNo: "14",
        },
        adminPanelVersion: "1.0.0",
      }
    },
  },
  {
    sequelize,
    modelName: "Admin",
    tableName: "admin",
    timestamps: true,
    paranoid: true, // Enables soft deletes
    indexes: [
      {
        unique: true,
        fields: ["adminId"],
      },
      {
        fields: ["email"],
        unique: true,
      },
      {
        fields: ["phone"],
        unique: true,
      },
      {
        fields: ["domain"],
        unique: true,
      },
    ],
    comment: "Table for storing admin details",
  }
);


export { Admin };


