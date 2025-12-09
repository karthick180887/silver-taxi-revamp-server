import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";

export interface BlogAttributes {
    id: number;
    adminId: string;
    blogId?: string;
    url: string;
    title: string;
    publishDate?: Date;
    coverImage?: string;
    description: string;
    htmlContent: string;
    status: boolean;
}


interface BlogCreationAttributes extends Optional<BlogAttributes, 'id'> { }

class Blog
    extends Model<BlogAttributes, BlogCreationAttributes>
    implements BlogAttributes {
    public id!: number;
    public blogId!: string;
    public adminId!: string;
    public url!: string;
    public title!: string;
    public publishDate!: Date;
    public coverImage!: string;
    public description!: string;
    public htmlContent!: string;
    public status!: boolean;

}


Blog.init(
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
        blogId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            defaultValue: DataTypes.UUIDV4,
        },
        url: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: null
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        publishDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        coverImage: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        htmlContent: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: 'Blog',
        tableName: 'blogs',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['blogId'],
            },
            {
                fields: ['adminId', 'title'],
            },
        ],
    }
);

export { Blog };
