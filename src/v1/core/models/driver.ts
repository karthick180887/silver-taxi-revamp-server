import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";


export interface DriverAttributes {
    id: number;
    adminId: string;
    driverId?: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    gender?: "Male" | "Female" | "Other";
    dateOfBirth?: Date;
    assigned?: boolean;
    isActive: boolean;
    isOnline?: boolean;
    onRide?: boolean;
    driverImageUrl?: string;
    panCardImage?: string;
    // New Changes from here
    panCardVerified?: "pending" | "accepted" | "rejected";
    panCardRemark?: string;
    aadharImageFront?: string;
    aadharImageFrontVerified?: "pending" | "accepted" | "rejected";
    aadharImageFrontRemark?: string;
    aadharImageBack?: string;
    aadharImageBackVerified?: "pending" | "accepted" | "rejected";
    aadharImageBackRemark?: string;
    licenseImageFront?: string;
    licenseImageFrontVerified?: "pending" | "accepted" | "rejected";
    licenseImageFrontRemark?: string;
    licenseImageBack?: string;
    licenseImageBackVerified?: "pending" | "accepted" | "rejected";
    licenseImageBackRemark?: string;
    isUpdated?: boolean; // Indicates if the driver has updated their documents
    // to here.
    licenseValidity?: Date;
    vehicleId?: string;
    adminVerified?: "Pending" | "Approved" | "Rejected";
    documentUploaded?: boolean;
    profileVerified?: "pending" | "accepted" | "rejected";
    documentVerified?: "pending" | "accepted" | "rejected";
    remark?: string;
    documentRemark?: string;
    createdBy: "Vendor" | "Admin" | "Driver";
    fcmToken?: string;
    accessToken?: string;
    refreshToken?: string;
    state?: string;
    pinCode?: string;
    city?: string;
    // New Changes from here

    onlineTime?: Date | null;
    offlineTime?: Date | null;

    bookingCount?: number;
    totalEarnings?: string;

    walletId?: string;

    geoLocation?: any;
    referralCode?: string;
    inActiveReason?: string;
    lastActiveDate?: Date;
    lastInActiveDate?: Date;
}

interface DriverCreationAttributes extends Optional<DriverAttributes, 'id'> { }

class Driver
    extends Model<DriverAttributes, DriverCreationAttributes>
    implements DriverAttributes {
    public id!: number;
    public adminId!: string;
    public driverId!: string;
    public name!: string;
    public phone!: string;
    public email!: string;
    public address!: string;
    public gender!: "Male" | "Female" | "Other";
    public dateOfBirth!: Date;
    public assigned!: boolean;
    public isActive!: boolean;
    public isOnline!: boolean;
    public onRide!: boolean;
    public driverImageUrl!: string;
    public panCardImage!: string;
    public aadharImageFront!: string;
    public aadharImageBack!: string;
    public licenseImageFront!: string;
    public licenseImageBack!: string;
    public licenseValidity!: Date;
    public vehicleId!: string;
    public adminVerified!: "Pending" | "Approved" | "Rejected";
    public documentUploaded!: boolean;
    public profileVerified!: "pending" | "accepted" | "rejected";
    public documentVerified!: "pending" | "accepted" | "rejected";
    public remark!: string;
    public documentRemark!: string;
    public createdBy!: "Vendor" | "Admin" | "Driver";
    public fcmToken!: string;
    public accessToken!: string;
    public refreshToken!: string;
    public panCardVerified!: "pending" | "accepted" | "rejected";
    public panCardRemark!: string;
    public aadharImageFrontVerified!: "pending" | "accepted" | "rejected";
    public aadharImageFrontRemark!: string;
    public aadharImageBackVerified!: "pending" | "accepted" | "rejected";
    public aadharImageBackRemark!: string;
    public licenseImageFrontVerified!: "pending" | "accepted" | "rejected";
    public licenseImageFrontRemark!: string;
    public licenseImageBackVerified!: "pending" | "accepted" | "rejected";
    public licenseImageBackRemark!: string;
    public isUpdated!: boolean;
    public state!: string;
    public city!: string;
    public pinCode!: string;
    public bookingCount!: number;
    public totalEarnings!: string;
    public onlineTime!: Date | null;
    public offlineTime!: Date | null;
    
    public walletId!: string;
    
    public geoLocation!: any;
    public referralCode!: string;
    
    public inActiveReason!: string;
    public lastActiveDate!: Date;
    public lastInActiveDate!: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}


Driver.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true,
        },
        driverId: {
            type: DataTypes.TEXT,
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
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        gender: {
            type: DataTypes.ENUM("Male", "Female", "Other"),
            allowNull: true,
            defaultValue: null,
        },
        dateOfBirth: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        assigned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        isOnline: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        onRide: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        driverImageUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        panCardImage: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        aadharImageFront: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        aadharImageBack: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        licenseImageFront: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        licenseImageBack: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        licenseValidity: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        vehicleId: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        adminVerified: {
            type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
            allowNull: false,
            defaultValue: "Pending",
        },
        documentUploaded: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        profileVerified: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            allowNull: false,
            defaultValue: "pending",
        },
        documentVerified: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            allowNull: false,
            defaultValue: "pending",
        },
        remark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        documentRemark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.ENUM("Vendor", "Admin", "Driver"),
            allowNull: true,
            defaultValue: "Admin",
        },
        fcmToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        accessToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        bookingCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        totalEarnings: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '0',
        },
        walletId: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        // New Changes from here
        // These fields are for verification of documents
        panCardVerified: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            allowNull: false,
            defaultValue: "pending",
        },
        panCardRemark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        aadharImageFrontVerified: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            allowNull: false,
            defaultValue: "pending",
        },
        aadharImageFrontRemark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        aadharImageBackVerified: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            allowNull: false,
            defaultValue: "pending",
        },
        aadharImageBackRemark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        licenseImageFrontVerified: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            allowNull: false,
            defaultValue: "pending",
        },
        licenseImageFrontRemark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        licenseImageBackVerified: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            allowNull: false,
            defaultValue: "pending",
        },
        licenseImageBackRemark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        city: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue:null,
        },
        pinCode: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        isUpdated: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        onlineTime: {
            type: DataTypes.DATE,
            allowNull: true,

        },
        offlineTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        geoLocation: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null
        },
        referralCode: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: null,
            unique: true,
        },
        inActiveReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        lastActiveDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        lastInActiveDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: "Driver",
        tableName: "drivers",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["driverId", "adminId", "walletId", "referralCode"],
            },
            // Common query patterns
            {
                fields: ["adminId", "createdAt"], // pagination queries
            },
            {
                fields: ["adminId", "isActive", "createdAt"], // active drivers with pagination
            },
            {
                fields: ["adminId", "isActive"], // active drivers
            },
            {
                fields: ["adminId", "isOnline", "createdAt"], // online drivers with pagination
            },
            {
                fields: ["adminId", "isOnline"], // online drivers
            },
            {
                fields: ["adminId", "adminVerified", "createdAt"], // verification status
            },
            {
                fields: ["adminId", "adminVerified"], // verification status
            },
            {
                fields: ["phone"], // phone search (already unique but index helps with LIKE queries)
            },
            {
                fields: ["name"], // name search
            },
            {
                fields: ["driverId"], // driverId lookup
            },
            {
                fields: ["referralCode"], // referral code lookup (already unique)
            },
            {
                fields: ["vehicleId"], // vehicle lookup
            },
        ],
        comment: "Table for drivers",
    }
)



export { Driver };

