import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

export interface PermitChargesAttributes {
    id: number;
    adminId: string;
    permitId?: string;
    origin: string;
    destination: string;
    noOfPermits?: number;
}


export interface PermitChargesCreationAttributes extends Optional<PermitChargesAttributes, "id"> { }

class PermitCharges
    extends Model<PermitChargesAttributes, PermitChargesCreationAttributes>
    implements PermitChargesAttributes {

    public id!: number;
    public adminId!: string;
    public permitId!: string;
    public origin!: string;
    public destination!: string;
    public noOfPermits!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

PermitCharges.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    adminId: {
        type: DataTypes.STRING(225),
        allowNull: false,
        references: {
            model: Admin,
            key: "adminId",
        },
    },
    permitId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: DataTypes.UUIDV4(),
    },
    origin: {
        type: DataTypes.STRING(225),
        allowNull: false,
    },
    destination: {
        type: DataTypes.STRING(225),
        allowNull: false,
    },
    noOfPermits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize,
    modelName: 'PermitCharges',
    tableName: 'permit_charges',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            unique: true,
            fields: ['permitId'],
        },
        {
            fields: ['adminId', 'origin', 'destination'],
        },
    ],
});



export { PermitCharges };

