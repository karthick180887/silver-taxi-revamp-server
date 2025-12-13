import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Service } from "./services";
import { Vendor } from "./vendor";

// Define the attributes for the Enquiry model
export interface EnquiryAttributes {
    id: number;
    enquiryId?: string;
    adminId: string;
    vendorId?: string;
    name?: string;
    email?: string;
    phone?: string;
    pickupDateTime: Date;
    dropDate?: Date | null;
    pickup: string;
    drop: string;
    serviceId: string;
    serviceType?: "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages";
    type: "Website" | "App" | "Manual";
    status: "Current" | "Future" | "Fake" | "Booked";
    createdBy: "Admin" | "Vendor" | "User";
    stops?: string[];
    days?: string;
}




// Define the creation attributes for the Enquiry model
interface EnquiryCreationAttributes extends Optional<EnquiryAttributes, 'id'> { }

// Create the Enquiry model class
class Enquiry
    extends Model<EnquiryAttributes, EnquiryCreationAttributes>
    implements EnquiryAttributes {
    public id!: number;
    public enquiryId!: string;
    public adminId!: string;
    public vendorId!: string;
    public name!: string;
    public email!: string;
    public phone!: string;
    public pickupDateTime!: Date;
    public dropDate!: Date | null;
    public pickup!: string;
    public drop!: string;
    public serviceId!: string;
    public serviceType!: "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages";
    public type!: "Website" | "App" | "Manual";
    public status!: "Current" | "Future" | "Fake" | "Booked";
    public createdBy!: "Admin" | "Vendor" | "User";
    public stops!: string[];
    public days!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

// Initialize the Enquiry model
Enquiry.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true,
        },
        enquiryId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
            unique: true,
        },
        adminId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: Admin,
                key: "adminId",
            }
        },
        vendorId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Vendor,
                key: "vendorId",
            }
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        pickupDateTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        dropDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        pickup: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        drop: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        serviceId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: Service,
                key: "serviceId",
            }
        },
        serviceType: {
            type: DataTypes.ENUM("One way", "Round trip", "Airport Pickup", "Airport Drop", "Day Packages", "Hourly Packages"),
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("Website", "App", "Manual"),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("Current", "Future", "Fake", "Booked"),
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.ENUM("Admin", "Vendor", "User"),
            allowNull: false,
        },
        stops: {
            type: DataTypes.ARRAY(DataTypes.STRING(255)),
            allowNull: true,
            defaultValue: [],
        },
        days: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "Enquiry",
        tableName: "enquirys",
        timestamps: true,
        paranoid: true,

        indexes: [
            {
                unique: true,
                fields: ["enquiryId", "adminId", "pickupDateTime", "pickup", "drop", "serviceId", "vendorId"],
            },

        ],
    }
);



export { Enquiry };