import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";


export interface PopularRoutesAttributes {
    id: number;
    adminId: string;
    routeId?: string;
    from: string;
    to: string;
    fromImage?: string;
    toImage?: string;
    distance?: string;
    duration?: string;
    price?: string;
    status: boolean;
}


export interface PopularRoutesCreationAttributes extends Optional<PopularRoutesAttributes, 'id'> { }

class PopularRoutes extends Model<PopularRoutesAttributes, PopularRoutesCreationAttributes> implements PopularRoutesAttributes {
    public id!: number;
    public adminId!: string;
    public routeId!: string;
    public from!: string;
    public to!: string;
    public fromImage!: string;
    public toImage!: string;
    public distance!: string;
    public duration!: string;
    public price!: string;      
    public status!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}


PopularRoutes.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    adminId: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    routeId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: DataTypes.UUIDV4,
    },
    from: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    to: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    fromImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    toImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    distance: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
    duration: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
    price: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
    },
}, {
    sequelize,
    modelName: 'PopularRoutes',
    tableName: 'popular_routes',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            unique: true,
            fields: ['routeId'],
        },
        {
            fields: ['from', 'to', 'price'],
        },
    ],
});


export { PopularRoutes };
