import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";
import { Customer } from "./customer";
import { Tariff } from "./tariff";
import { Driver } from "./driver";
import { Enquiry } from "./enquiry";
import { Offers } from "./offers";
import { Vehicle } from "./vehicles";
import { Service } from "./services";
import { Vendor } from "./vendor";
import { PromoCode } from "./promoCodes";


// Define the attributes for the Enquiry model
export interface BookingAttributes {
    id: number;
    adminId: string;
    bookingId?: string;
    bookingNo?: string;
    vendorId?: string;
    customerId?: string;
    name: string;
    email?: string;
    phone: string;
    pickupDateTime: Date;
    dropDate?: Date | null;
    enquiryId?: string;
    driverId?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    assignAllDriver?: boolean;
    tariffId?: string;
    packageId?: string;
    serviceId?: string;
    vehicleId?: string;
    serviceType: "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages";
    status?: "Booking Confirmed" | "Started" | "Completed" | "Cancelled" | "Not-Started" | "Reassign" | "Manual Completed";
    type: "Website" | "App" | "Manual";
    paymentMethod: "UPI" | "Bank" | "Cash" | "Card" | "Wallet";
    paymentStatus: "Partial Paid" | "Paid" | "Unpaid";
    createdBy: "Admin" | "Vendor" | "User";
    pickup: string;
    drop: string;
    advanceAmount: number;
    upPaidAmount: number;
    distance: number;
    estimatedAmount: number;
    discountAmount: number;
    offerId?: string;
    promoCodeId?: string;
    finalAmount: number;
    driverBeta?: number;
    extraDriverBeta?: number;
    extraToll?: number;
    extraHill?: number;
    extraPermitCharge?: number;
    taxPercentage?: number;
    taxAmount?: number;
    pricePerKm?: number;
    extraPricePerKm?: number;
    duration?: string;

    startOtp: string;
    endOtp: string;
    tripStartedTime?: Date;
    tripCompletedTime?: Date;
    tripCompletedPaymentMethod?: "UPI" | "Cash" | "Link" | "Card" | "Bank" | "Wallet";
    startOdometerImage?: string | null;
    endOdometerImage?: string | null;
    startOdometerValue?: number;
    endOdometerValue?: number;

    driverCharges?: any;
    extraCharges?: any;
    driverAccepted?: "accepted" | "rejected" | "pending";
    tripCompletedPrice?: number;
    tripCompletedDuration?: string;
    tripCompletedFinalAmount?: number;
    tripCompletedTaxAmount?: number;
    tripCompletedDistance?: number;
    tripCompletedEstimatedAmount?: number;
    driverDeductionAmount?: number;
    vendorDeductionAmount?: number;
    bookingOrderId?: string;
    bookingPaymentId?: string;
    acceptTime?: Date;
    requestSentTime?: Date;

    adminCommission?: number;
    vendorCommission?: number;
    vehicleType?: string;
    offerName?: string;
    tripCompletedDriverBeta?: number;
    stops?: string[];
    days?: string;

    geoLocation?: any;
    isContacted?: boolean;
    lastAdminNotifyTime?: Date;

    normalFare?: any;
    modifiedFare?: any;
    driverCommissionBreakup?: any;
    vendorCommissionBreakup?: any;

    commissionTaxPercentage?: number;
    minKm?: number;

    convenienceFee?: number;
    adminContact?: string;
    test?: boolean;

}



// Define the creation attributes for the Booking model
interface BookingCreationAttributes extends Optional<BookingAttributes, 'id'> { }

// Create the Booking model class
class Booking
    extends Model<BookingAttributes, BookingCreationAttributes>
    implements BookingAttributes {
    public id!: number;
    public adminId!: string;
    public bookingId!: string;
    public bookingNo!: string;
    public vendorId!: string;
    public customerId!: string;
    public name!: string;
    public email!: string;
    public phone!: string;
    public pickupDateTime!: Date;
    public dropDate!: Date | null;
    public enquiryId!: string;
    public driverId!: string | null;
    public driverName!: string | null;
    public driverPhone!: string | null;
    public assignAllDriver!: boolean;
    public tariffId!: string;
    public packageId!: string;
    public serviceId!: string;
    public vehicleId!: string;
    public serviceType!: "One way" | "Round trip" | "Airport Pickup" | "Airport Drop" | "Day Packages" | "Hourly Packages";
    public status!: "Booking Confirmed" | "Started" | "Completed" | "Cancelled" | "Not-Started" | "Reassign" | "Manual Completed";
    public paymentMethod!: "UPI" | "Bank" | "Cash" | "Card" | "Wallet";
    public type!: "Website" | "App" | "Manual";
    public pickup!: string;
    public drop!: string;
    public distance!: number;
    public estimatedAmount!: number;
    public discountAmount!: number;
    public advanceAmount!: number;
    public upPaidAmount!: number;
    public offerId!: string;
    public promoCodeId!: string;
    public createdBy!: "Admin" | "Vendor" | "User";
    public finalAmount!: number;
    public paymentStatus!: "Partial Paid" | "Paid" | "Unpaid";
    public driverBeta!: number;
    public extraDriverBeta!: number;
    public extraToll!: number;
    public extraHill!: number;
    public extraPermitCharge!: number;
    public taxPercentage!: number;
    public taxAmount!: number;
    public pricePerKm!: number;
    public extraPricePerKm!: number;
    public duration!: string;

    public startOtp!: string;
    public endOtp!: string;
    public tripStartedTime!: Date;
    public tripCompletedTime!: Date;
    public tripCompletedPaymentMethod!: "UPI" | "Cash" | "Link" | "Card" | "Bank" | "Wallet";
    public startOdometerImage!: string | null;
    public endOdometerImage!: string | null;
    public startOdometerValue!: number;
    public endOdometerValue!: number;

    public driverCharges!: any;
    public extraCharges!: any;
    public driverAccepted!: "accepted" | "rejected" | "pending";
    public tripCompletedPrice!: number;
    public tripCompletedDistance!: number;
    public tripCompletedEstimatedAmount!: number;



    public tripCompletedDuration!: string;
    public tripCompletedFinalAmount!: number;
    public tripCompletedTaxAmount!: number;
    public driverDeductionAmount!: number;
    public vendorDeductionAmount!: number;
    public bookingOrderId!: string;
    public bookingPaymentId!: string;
    public acceptTime!: Date;
    public requestSentTime!: Date;


    public adminCommission!: number;
    public vendorCommission!: number;
    public vehicleType!: string;
    public offerName!: string;
    public tripCompletedDriverBeta!: number;
    public stops!: string[];
    public days!: string;

    public geoLocation!: any;
    public isContacted!: boolean;
    public lastAdminNotifyTime!: Date;

    public normalFare!: any;
    public modifiedFare!: any;

    public driverCommissionBreakup!: any;
    public vendorCommissionBreakup!: any;
    public commissionTaxPercentage!: number;

    public minKm!: number;
    public convenienceFee!: number;
    public adminContact!: string;
    public test!: boolean;


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

// Initialize the Booking model
Booking.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true,
        },
        bookingId: {
            type: DataTypes.TEXT,
            allowNull: true,
            unique: true,
            defaultValue: DataTypes.UUIDV4(),
        },
        bookingNo: {
            type: DataTypes.TEXT,
            allowNull: true,
            unique: true,
            defaultValue: DataTypes.UUIDV4(),
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
        customerId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Customer,
                key: "customerId",
            }
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        serviceType: {
            type: DataTypes.ENUM("One way", "Round trip", "Airport Pickup", "Airport Drop", "Day Packages", "Hourly Packages"),
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.ENUM("UPI", "Bank", "Cash", "Card", "Wallet"),
            allowNull: false,
        },
        pickupDateTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        dropDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        enquiryId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Enquiry,
                key: "enquiryId",
            },
        },
        driverId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            // references: {
            //     model: Driver,
            //     key: "driverId",
            // },
            defaultValue: null
        },
        driverName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        driverPhone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: null
        },
        assignAllDriver: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        serviceId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Service,
                key: "serviceId",
            },
        },
        tariffId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: Tariff,
                key: "tariffId",
            },
        },
        packageId: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        vehicleId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            // references: {
            //     model: Vehicle,
            //     key: "vehicleId",
            // },
        },
        advanceAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        upPaidAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        pickup: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        drop: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },

        distance: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        estimatedAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        discountAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        offerId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        promoCodeId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
            references: {
                model: PromoCode,
                key: "codeId",
            },
        },
        finalAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.ENUM("Admin", "Vendor", "User"),
            allowNull: false,
        },
        paymentStatus: {
            type: DataTypes.ENUM("Partial Paid", "Paid", "Unpaid"),
            allowNull: false,
            defaultValue: "Unpaid",
        },
        status: {
            type: DataTypes.ENUM("Booking Confirmed", "Started", "Completed", "Cancelled", "Not-Started", "Reassign", "Manual Completed"),
            allowNull: false,
            defaultValue: "Booking Confirmed",
        },
        type: {
            type: DataTypes.ENUM("Website", "App", "Manual"),
            allowNull: false,
            defaultValue: "Website",
        },
        driverBeta: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        extraDriverBeta: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        extraToll: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        extraHill: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        extraPermitCharge: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        taxPercentage: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: null,
        },
        taxAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        pricePerKm: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        extraPricePerKm: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        duration: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        startOtp: {
            type: DataTypes.STRING(6),
            allowNull: false,
        },
        endOtp: {
            type: DataTypes.STRING(6),
            allowNull: false,
        },
        tripStartedTime: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        tripCompletedTime: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        tripCompletedPaymentMethod: {
            type: DataTypes.ENUM("UPI", "Cash", "Link", "Card", "Bank", "Wallet"),
            allowNull: true,
            defaultValue: null
        },
        startOdometerImage: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        endOdometerImage: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        startOdometerValue: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            validate: {
                isInt: true,
                min: 0
            }
        },
        endOdometerValue: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            validate: {
                isInt: true,
                min: 0
            }
        },
        extraCharges: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        driverCharges: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        driverAccepted: {
            type: DataTypes.ENUM("accepted", "rejected", "pending"),
            allowNull: true,
            defaultValue: "pending",
        },
        tripCompletedPrice: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            validate: {
                isInt: true,
                min: 0
            }
        },
        tripCompletedDuration: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        tripCompletedFinalAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            validate: {
                isInt: true,
                min: 0
            }
        },
        tripCompletedTaxAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        tripCompletedDistance: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,

        },
        tripCompletedEstimatedAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        driverDeductionAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            validate: {
                isInt: true,
                min: 0
            }
        },
        vendorDeductionAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            validate: {
                isInt: true,
                min: 0
            }
        },
        bookingOrderId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        bookingPaymentId: {
            type: DataTypes.STRING(150),
            allowNull: true,
            defaultValue: null,
        },
        acceptTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        requestSentTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        adminCommission: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        vendorCommission: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        vehicleType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        offerName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        tripCompletedDriverBeta: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        stops: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: []
        },
        geoLocation: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        isContacted: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        days: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        lastAdminNotifyTime: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        normalFare: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        modifiedFare: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        driverCommissionBreakup: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        vendorCommissionBreakup: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        commissionTaxPercentage: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        minKm: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        convenienceFee: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        adminContact: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: ""
        },
    },
    {
        sequelize,
        modelName: "Booking",
        tableName: "bookings",
        timestamps: true,
        paranoid: true,
        indexes: [
            // Unique identifiers
            {
              unique: true,
              fields: ['bookingId'],
            },
            {
              unique: true,
              fields: ['bookingNo'],
            },
          
            // Admin-level views (dashboards, lists) - Most common queries
            {
              fields: ['adminId', 'createdAt'],      // list bookings by admin with pagination
            },
            {
              fields: ['adminId', 'status', 'createdAt'], // filter by status + time (most common)
            },
            {
              fields: ['adminId', 'status'], // filter by status only
            },
            {
              fields: ['adminId', 'paymentStatus', 'createdAt'], // payment status filtering
            },
            {
              fields: ['adminId', 'serviceType', 'createdAt'], // service type filtering
            },
            {
              fields: ['adminId', 'type', 'createdAt'], // booking type filtering (Website/App/Manual)
            },
            {
              fields: ['adminId', 'isContacted', 'createdAt'], // contacted status filtering
            },
            {
              fields: ['adminId', 'pickupDateTime'], // date range queries
            },
            {
              fields: ['adminId', 'pickupDateTime', 'createdAt'], // date range queries with sorting
            },
          
            // Driver-specific views
            {
              fields: ['driverId', 'status', 'createdAt'], // driver history / current trips with sorting
            },
            {
              fields: ['driverId', 'status'], // driver history / current trips
            },
            {
              fields: ['driverId', 'createdAt'], // driver bookings by date
            },
            {
              fields: ['driverName'], // search by driver name
            },
            {
              fields: ['driverPhone'], // search by driver phone
            },
          
            // Customer-specific views
            {
              fields: ['customerId', 'createdAt'], // customer bookings with pagination
            },
            {
              fields: ['customerId', 'status', 'createdAt'], // customer history with status
            },
            {
              fields: ['customerId', 'status'], // customer history
            },
          
            // Vendor-specific views
            {
              fields: ['vendorId', 'createdAt'], // vendor bookings with pagination
            },
            {
              fields: ['vendorId', 'status', 'createdAt'], // vendor history with status
            },
            {
              fields: ['vendorId', 'status'], // vendor history
            },
            {
              fields: ['adminId', 'vendorId', 'createdAt'], // admin filtering by vendor
            },
          
            // Fast search by phone, name, and other searchable fields
            {
              fields: ['phone'], // phone search
            },
            {
              fields: ['name'], // name search
            },
            {
              fields: ['enquiryId'], // enquiry lookup
            },
            {
              fields: ['serviceId'], // service lookup
            },
            {
              fields: ['vehicleId'], // vehicle lookup
            },
            {
              fields: ['tariffId'], // tariff lookup
            },
            {
              fields: ['offerId'], // offer lookup
            },
            {
              fields: ['promoCodeId'], // promo code lookup
            },
          ],
          comment: "Table for bookings",  
    }
);


export { Booking };