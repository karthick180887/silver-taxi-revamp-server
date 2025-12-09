import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../common/db/postgres';

export interface StateAttributes {
  id: number;
  stateId?: string;
  name: string;
  code?: string;
  status: boolean;
}

interface StateCreationAttributes extends Optional<StateAttributes, 'id'> {}

class State extends Model<StateAttributes, StateCreationAttributes> implements StateAttributes {
  public id!: number;
  public stateId!: string;
  public name!: string;
  public code!: string;
  public status!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

State.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    stateId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
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
    modelName: 'State',
    tableName: 'states',
    timestamps: true,
    paranoid: true,
    indexes: [{ unique: true, fields: ['stateId'] }],
  }
);

export { State };
