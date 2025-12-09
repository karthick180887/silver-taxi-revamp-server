import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Service } from "./services";



export interface AllPriceChangesAttributes {
    id: number;
    adminId: string;
    priceId?: string;
    fromDate: Date;
    toDate: Date;
    price: number;
    serviceId: string;
    oldPrice?: number;
    applied?: boolean;
    status: boolean;
}


export interface AllPriceChangesCreationAttributes extends Optional<AllPriceChangesAttributes, "id"> { }

class AllPriceChanges
    extends Model<AllPriceChangesAttributes, AllPriceChangesCreationAttributes>
    implements AllPriceChangesAttributes {

    public id!: number;
    public adminId!: string;
    public priceId!: string;
    public fromDate!: Date;
    public toDate!: Date;
    public price!: number;
    public serviceId!: string;  
    public oldPrice!: number;
    public status!: boolean;
    public applied!: boolean;


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

AllPriceChanges.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    adminId: {
        type: DataTypes.STRING(225),
        allowNull: false,
    }
    ,
    priceId: {
        type: DataTypes.UUID,
        unique: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4(),
    },
    fromDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    toDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    serviceId: {
        type: DataTypes.STRING(225),
        allowNull: false,
        references: {
            model: Service,
            key: "serviceId",
        },
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    oldPrice: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    applied: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize,
    modelName: 'AllPriceChanges',
    tableName: 'all_price_changes',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ['adminId', 'priceId','serviceId'],
        },
    ],
});


export { AllPriceChanges };

