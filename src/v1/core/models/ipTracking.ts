import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";


interface IPTrackingAttributes {
    id: number;
    adminId?: string;
    ipAddressId?: string;
    ipAddress: string;
    ipRange?: string;
    visitTime: Date;
    userAgent?: string;
    pageVisited?: string;
}

interface IPTrackingCreationAttributes extends Optional<IPTrackingAttributes, "id"> { }


class IPTracking
    extends Model<IPTrackingAttributes, IPTrackingCreationAttributes>
    implements IPTrackingAttributes {
    public id!: number;
    public adminId!: string;
    public ipAddressId!: string;
    public ipAddress!: string;
    public ipRange!: string;
    public visitTime!: Date;
    public userAgent!: string;

    public pageVisited!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

IPTracking.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            unique: true,
        },
        adminId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Admin,
                key: "adminId",
            }
        },
        ipAddressId: {
            type: DataTypes.STRING(225),
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
            unique: true,
        },
        ipAddress: {
            type: DataTypes.INET,
            allowNull: false,
        },
        ipRange: {
            type: DataTypes.CIDR,
            allowNull: true,
        },
        visitTime: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        userAgent: {
            type: DataTypes.STRING(512),
            allowNull: true,
        },
        pageVisited: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "IPTracking",
        tableName: "ip_tracking",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["adminId", "ipAddressId"],
            },
        ]
    }
);

export { IPTracking };
