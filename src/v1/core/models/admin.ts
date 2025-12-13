import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";

export interface AdminAttributes {
  id: number;
  adminId?: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  domain?: string;
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
        fields: ["adminId", "email", "phone", "domain"],
      },
    ],
    comment: "Table for storing admin details",
  }
);


export { Admin };


