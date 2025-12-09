import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../common/db/postgres';

export interface TableConfigAttributes {
  id: number;
  adminId: string;
  pageId?: string;
  pageName: string;
  preferences: Record<string, boolean>; // JSONB to store column visibilities
}

interface TableConfigCreationAttributes extends Optional<TableConfigAttributes, 'id'> {}

class TableConfig
  extends Model<TableConfigAttributes, TableConfigCreationAttributes>
  implements TableConfigAttributes
{
  public id!: number;
  public adminId!: string;
  public pageId!: string;
  public pageName!: string;
  public preferences!: Record<string, boolean>;

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

TableConfig.init(
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
    pageId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    pageName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'TableConfig',
    tableName: 'table_configs',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['adminId', 'pageId', 'pageName'],
      },
      {
        fields: ['preferences'],
        using: 'gin',
        name: 'preferences_gin_index',
      }
    ],
  }
);

export { TableConfig };
