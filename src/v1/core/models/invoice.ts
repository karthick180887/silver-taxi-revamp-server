import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Booking } from "./booking";
import { CompanyProfile } from "./companyProfile";
import { Vendor } from "./vendor";

export interface InvoiceAttributes {
    id: number;
    invoiceId?: string;
    adminId: string;
    vendorId?: string;
    bookingId?: string;
    companyId?: string;
    invoiceNo?: string;
    invoiceDate: Date;
    name: string;
    phone: string;
    email?: string;
    address: string;
    GSTNumber?: string;
    paymentMethod?: "Cash" | "Card" | "UPI" | "Bank" | "Wallet";
    pickupDateTime?: Date;
    status: "Partial Paid" | "Paid" | "Unpaid";
    dropDate?: Date | null;
    pickup?: string;
    drop?: string;
    serviceType: string;
    vehicleType:string
    totalKm: number;
    pricePerKm: number;
    travelTime: string;
    estimatedAmount?: number;
    advanceAmount?: number;
    totalAmount: number;
    note?: string;
    paymentDetails?: string;
    otherCharges?:any;
    createdBy?: "Vendor" | "Admin";
}

interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, "id"> {}

class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
    public id!: number;
    public invoiceId!: string;
    public adminId!: string;
    public vendorId!: string;
    public bookingId!: string;
    public companyId!: string;
    public invoiceNo!: string;
    public invoiceDate!: Date;
    public name!: string;
    public phone!: string;
    public email!: string;
    public address!: string;
    public GSTNumber!: string;
    public paymentMethod!: "Cash" | "Card" | "UPI" | "Bank" | "Wallet";
    public status!: "Partial Paid" | "Paid" | "Unpaid";
    public pickupDateTime!: Date;
    public dropDate!: Date | null;
    public pickup!: string;
    public drop!: string;
    public note!: string;
    public serviceType!: string;
    public vehicleType!: string;

    public totalKm!: number;
    public pricePerKm!: number;
    public travelTime!: string;
    public estimatedAmount!: number;
    public advanceAmount!: number;
    public totalAmount!: number;
    public paymentDetails!: any;
    public otherCharges!: any;
    public createdBy!: "Vendor" | "Admin";

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

Invoice.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true,
        },
        invoiceId: {
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
            },
        },
        bookingId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
            references: {
                model: Booking,
                key: "bookingId",
            },
        },
        vendorId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Vendor,
                key: "vendorId",
            }
        },
        companyId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: CompanyProfile,
                key: "companyId",
            },
        },
        invoiceNo: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        invoiceDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("Partial Paid", "Paid", "Unpaid"),
            allowNull: false,
            defaultValue: "Unpaid",
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        GSTNumber: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        paymentMethod: {
            type: DataTypes.ENUM("Cash", "Card", "UPI", "Bank", "Wallet"),
            allowNull: true,
            defaultValue: null,
        },
        pickup: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        pickupDateTime: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        drop: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        dropDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        serviceType: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        vehicleType :{
            type:DataTypes.STRING(50),
            allowNull:true
        },
        totalKm: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        pricePerKm: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        travelTime: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        estimatedAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        advanceAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        totalAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        paymentDetails: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        otherCharges: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.ENUM("Vendor", "Admin"),
            allowNull: true,
        }
    },
    {
        sequelize,
        modelName: "Invoice",
        tableName: "invoices",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["invoiceId", "adminId", "bookingId", "companyId", "invoiceNo"],
            },
            {
                fields: ["otherCharges"],
                using: 'GIN',
                name: 'idx_invoice_otherCharges',
            },
        ],
        comment: "Table for invoices",
    }

);

export { Invoice };