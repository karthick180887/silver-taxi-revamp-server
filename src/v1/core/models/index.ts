import { Admin } from "./admin";
import { Vendor } from "./vendor";
import { Tariff } from "./tariff";
import { Service } from "./services";
import { Vehicle } from "./vehicles";
import { Booking } from "./booking";
import { Enquiry } from "./enquiry";
import { PermitCharges } from "./permitCharges";
import { CompanyProfile } from "./companyProfile";
import { Invoice } from "./invoice";
import { Driver } from "./driver";
import { Notification } from "./notification";
import { DriverNotification } from "./driverNotification";
import { IPTracking } from "./ipTracking";
import { PaymentTransaction } from "./paymentTransaction";
import { Offers } from "./offers";
import { DayPackage } from "./dayPackages";
import { HourlyPackage } from "./hourlyPackages";
import { Customer } from "./customer";
import { DriverWallet } from "./driverWallets";
import { VendorWallet } from "./vendorWallets";
import { DynamicRoute } from "./dynamicRoutes";
import { WalletTransaction } from "./walletTransaction";
import { AllIncludes } from "./allIncludes";
import { PopularRoutes } from "./popularRoutes";
import { Blog } from "./blog";
import { AllPriceChanges } from "./allPriceChanges";
import { VehicleTypes } from "./vehicleTypes";
import { DriverBookingLog } from "./driverBookingLog";
import { PromoCode } from "./promoCodes";
import { PromoCodeUsage } from "./promoCodeUsage";
import { ReferralUsage } from "./referralUsage";
import { DriverBankDetails } from "./diverBankDetails";
import { TopDestinations } from "./topDestinations";
import { OfferUsage } from "./offerUsage";
import { CustomerWallet } from "./customerWallets";
import { CustomerTransaction } from "./customerTransactions";
import { CustomerNotification } from "./customerNotification";
import { TableConfig } from "./tableConfig";
import { State } from "./states";
import { City } from "./cities";
import { DriverWalletRequest } from "./driverWalletRequest";
import { NotificationTemplates } from "./notificationTemplates";
import { DriverActivityLog } from "./driverActivityLog";
import { BookingActivityLog } from "./bookingActivityLog";
import { VendorBankDetails } from "./vendorBankDetails";
import { VendorNotification } from "./vendorNotification";
import { ConfigKeys } from "./configKeys";

type SyncOptions = {
    alter?: boolean;
    force?: boolean;
};

/**
 * Syncs the Sequelize models in order of dependencies
 */
export async function syncDatabase(options: SyncOptions = { alter: true }) {
    try {
        console.log("🔁 Starting database sync...");

        // 1. Core admin and meta tables
        // await Admin.sync(options);
        await Notification.sync(options);
        await NotificationTemplates.sync(options);
        await Vendor.sync(options);
        await PopularRoutes.sync(options);
        await Blog.sync(options);
        await VehicleTypes.sync(options);
        await TableConfig.sync(options);
        await City.sync(options);
        await State.sync(options);
        await TopDestinations.sync(options);
        console.log("✅ Step 1: Core tables synced");

        // 2. Drivers, customers, vehicles
        await Driver.sync(options);
        await Vehicle.sync(options);
        await IPTracking.sync(options);
        await Customer.sync(options);
        await CompanyProfile.sync(options);
        await Offers.sync(options);
        await PaymentTransaction.sync(options);
        await DriverNotification.sync(options);
        await VendorNotification.sync(options);
        await VendorBankDetails.sync(options);
        await AllIncludes.sync(options);
        await PermitCharges.sync(options);
        await DriverBookingLog.sync(options);
        await DriverBankDetails.sync(options);
        await CustomerWallet.sync(options);
        await CustomerTransaction.sync(options);
        await CustomerNotification.sync(options);
        await PromoCode.sync(options);
        await PromoCodeUsage.sync(options);
        await ReferralUsage.sync(options);
        await OfferUsage.sync(options);
        await DriverWalletRequest.sync(options);
        await DriverActivityLog.sync(options);
        console.log("✅ Step 2: Users and transactions synced");

        // 3. Wallet system
        await DynamicRoute.sync(options);
        await DriverWallet.sync(options);
        await VendorWallet.sync(options);
        await WalletTransaction.sync(options);
        console.log("✅ Step 3: Wallet system synced");

        // 4. Booking and services
        await Service.sync(options);
        await AllPriceChanges.sync(options);
        await DayPackage.sync(options);
        await HourlyPackage.sync(options);
        await Tariff.sync(options);
        await Enquiry.sync(options);
        await Booking.sync(options);
        await BookingActivityLog.sync(options);
        await Invoice.sync(options);
        await ConfigKeys.sync(options);
        console.log("✅ Step 4: Booking & pricing synced");

        console.log("🎉 Database sync completed successfully.");
    } catch (error) {
        console.error("❌ Error syncing database:", error);
    }
}

export const singleModelSync = async (model: any, options: SyncOptions = { alter: true }) => {
    try {
        console.log(`🔁 Syncing model: ${model.name}`);
        await model.sync(options);
        console.log(`✅ Model ${model.name} synced successfully.`);
    } catch (error) {
        console.error(`❌ Error syncing model ${model.name}:`, error);
    }
}



(async () => {
    // Step 1:
    // await singleModelSync(Notification, { alter: true});
    // await singleModelSync(NotificationTemplates, { alter: true });
    // await singleModelSync(Vendor, { alter: true });
    // await singleModelSync(PopularRoutes, { alter: true });
    // await singleModelSync(Blog, { alter: true });
    // await singleModelSync(VehicleTypes, { alter: true });
    // await singleModelSync(TableConfig, { alter: true });
    // await singleModelSync(City, { alter: true });
    // await singleModelSync(State, { alter: true });
    // await singleModelSync(TopDestinations, { alter: true });

    // Step 2:
    // await singleModelSync(Driver, { alter: true });
    // await singleModelSync(Vehicle, { alter: true });
    // await singleModelSync(IPTracking, { alter: true });
    // await singleModelSync(Customer, { alter: true });
    // await singleModelSync(CompanyProfile, { alter: true });
    // await singleModelSync(Offers, { alter: true });
    // await singleModelSync(PaymentTransaction, { alter: true });
    // await singleModelSync(DriverNotification, { alter: true });
    // await singleModelSync(AllIncludes, {alter: true});
    // await singleModelSync(PermitCharges, {alter: true});
    // await singleModelSync(DriverBookingLog, {alter: true});
    // await singleModelSync(DriverBankDetails, { alter: true });
    // await singleModelSync(CustomerWallet, { alter: true });
    // await singleModelSync(CustomerNotification, { alter: true});
    // await singleModelSync(CustomerTransaction, { alter: true});
    // await singleModelSync(PromoCode, { alter: true});
    // await singleModelSync(PromoCodeUsage, { alter: true});
    // await singleModelSync(ReferralUsage, { alter: true });
    // await singleModelSync(OfferUsage, { alter: true});
    // await singleModelSync(DriverWalletRequest, { alter: true});
    // await singleModelSync(DriverActivityLog, { alter: true });

    // Step 3:
    // await singleModelSync(DynamicRoute, { alter: true });
    // await singleModelSync(VendorWallet, { alter: true });
    // await singleModelSync(VendorNotification, { alter: true });
    // await singleModelSync(VendorBankDetails, { alter: true });
    // await singleModelSync(DriverWallet, { alter: true });
    // await singleModelSync(WalletTransaction, { alter: true});

    // Step 4:
    // await singleModelSync(Service, { alter: true });
    // await singleModelSync(AllPriceChanges, { alter: true });
    // await singleModelSync(HourlyPackage, { alter: true });
    // await singleModelSync(Tariff, { alter: true });
    // await singleModelSync(Enquiry, { alter: true});
    // await singleModelSync(Booking, { alter: true });
    // await singleModelSync(BookingActivityLog, { alter: true });
    // await singleModelSync(VendorBankDetails, { alter: true });
    // await singleModelSync(ConfigKeys, { alter: true });
}
)();


// (async () => {
//     await syncDatabase({ force: true, alter: true }); // or { force: true }
// })();

// Define associations
// Admin has many Vendors

Booking.belongsTo(Tariff, { foreignKey: 'tariffId', targetKey: 'tariffId', as: 'tariff' });

// Customer has many Bookings
Customer.hasMany(Booking, { foreignKey: 'customerId', sourceKey: 'customerId', as: 'bookings' });
Booking.belongsTo(Customer, { foreignKey: 'customerId', targetKey: 'customerId', as: 'customer' });

// Driver has many Bookings
Driver.hasMany(Booking, { foreignKey: 'driverId', sourceKey: 'driverId', as: 'bookings' });
Booking.belongsTo(Driver, { foreignKey: 'driverId', targetKey: 'driverId', as: 'driver' });

DriverBankDetails.belongsTo(Driver, { foreignKey: 'driverId', targetKey: 'driverId', as: 'driver' });
Driver.hasMany(DriverBankDetails, { foreignKey: 'driverId', sourceKey: 'driverId', as: 'driverBankDetails' });

// Vehicle.hasMany(Booking, { foreignKey: 'vehicleId', sourceKey: 'vehicleId', as: 'bookings' });
// Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId', targetKey: 'vehicleId', as: 'vehicles' });

Offers.hasMany(Booking, { foreignKey: 'offerId', sourceKey: 'offerId', as: 'bookings' });
Booking.belongsTo(Offers, { foreignKey: 'offerId', targetKey: 'offerId', as: 'offers' });

Vendor.hasOne(VendorWallet, { foreignKey: 'vendorId', sourceKey: 'vendorId', as: 'wallet' });
VendorWallet.belongsTo(Vendor, { foreignKey: 'vendorId', targetKey: 'vendorId', as: 'vendor' });

Driver.hasOne(DriverWallet, { foreignKey: 'driverId', sourceKey: 'driverId', as: 'wallet' });
DriverWallet.belongsTo(Driver, { foreignKey: 'driverId', targetKey: 'driverId', as: 'driver' });
Driver.hasMany(WalletTransaction, { foreignKey: 'driverId', sourceKey: 'driverId', as: 'walletTransactions' });
Driver.hasMany(Vehicle, { foreignKey: 'driverId', sourceKey: 'driverId', as: 'vehicle' });
Vehicle.belongsTo(Driver, { foreignKey: 'vehicleId', targetKey: 'vehicleId', as: 'driver' });

WalletTransaction.belongsTo(Vendor, { foreignKey: 'vendorId', targetKey: 'vendorId', as: 'vendor' });
WalletTransaction.belongsTo(Driver, { foreignKey: 'driverId', targetKey: 'driverId', as: 'driver' });

Tariff.belongsTo(Vehicle, { foreignKey: 'vehicleId', targetKey: 'vehicleId', as: 'vehicles' });
Tariff.belongsTo(Service, { foreignKey: 'serviceId', targetKey: 'serviceId', as: 'services' });

DayPackage.belongsTo(Vehicle, { foreignKey: 'vehicleId', targetKey: 'vehicleId', as: 'vehicles' });
DayPackage.belongsTo(Service, { foreignKey: 'serviceId', targetKey: 'serviceId', as: 'services' });

HourlyPackage.belongsTo(Vehicle, { foreignKey: 'vehicleId', targetKey: 'vehicleId', as: 'vehicles' });
HourlyPackage.belongsTo(Service, { foreignKey: 'serviceId', targetKey: 'serviceId', as: 'services' });

Invoice.belongsTo(Booking, { foreignKey: 'bookingId', targetKey: 'bookingId', as: 'booking' });
Invoice.belongsTo(CompanyProfile, { foreignKey: 'companyId', targetKey: 'companyId', as: 'companyProfile' });

Enquiry.belongsTo(Service, { foreignKey: 'serviceId', targetKey: 'serviceId', as: 'services' });

Offers.hasMany(OfferUsage, { foreignKey: 'offerId', sourceKey: 'offerId', as: 'offerUsage' });
OfferUsage.belongsTo(Offers, { foreignKey: 'offerId', targetKey: 'offerId', as: 'offers' });


PromoCode.hasMany(PromoCodeUsage, { foreignKey: 'codeId', sourceKey: 'codeId', as: 'promoCodeUsage' });
PromoCodeUsage.belongsTo(PromoCode, { foreignKey: 'codeId', targetKey: 'codeId', as: 'promoCodeDetails' });



export {
    Admin,
    Vendor,
    Tariff,
    Booking,
    Enquiry,
    Vehicle,
    Service,
    CompanyProfile,
    Invoice,
    Driver,
    DriverNotification,
    IPTracking,
    PermitCharges,
    PopularRoutes,
    PaymentTransaction,
    CustomerNotification,
    Offers,
    DriverBookingLog,
    DayPackage,
    HourlyPackage,
    Customer,
    DriverWallet,
    VendorWallet,
    Notification,
    AllIncludes,
    VehicleTypes,
    AllPriceChanges,
    WalletTransaction,
    DynamicRoute,
    Blog,
    PromoCode,
    PromoCodeUsage,
    ReferralUsage,
    DriverBankDetails,
    TopDestinations,
    OfferUsage,
    CustomerWallet,
    CustomerTransaction,
    TableConfig,
    State,
    City,
    DriverWalletRequest,
    NotificationTemplates,
    DriverActivityLog,
    BookingActivityLog,
    ConfigKeys
};





