import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../common/db/postgres';

export interface CityAttributes {
  id: number;
  cityId?: string;
  name: string;
  stateId: string;
  pinCode?: string;
  status: boolean;
}

interface CityCreationAttributes extends Optional<CityAttributes, 'id'> {}

class City extends Model<CityAttributes, CityCreationAttributes> implements CityAttributes {
  public id!: number;
  public cityId!: string;
  public name!: string;
  public stateId!: string;
  public pinCode!: string;
  public status!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

City.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cityId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    stateId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    pinCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'City',
    tableName: 'cities',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['cityId'] },
      { fields: ['stateId', 'name'] },
    ],
  }
);

export { City };
