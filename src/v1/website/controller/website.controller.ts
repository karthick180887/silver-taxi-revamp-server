import { Request, Response } from "express";
import { Service } from "../../core/models/services";
import {
    Tariff, Vehicle, IPTracking,
    DynamicRoute, CompanyProfile,
    HourlyPackage, DayPackage,
    Booking, Customer, Driver,
    PopularRoutes,
    Blog
} from "../../core/models/index";



// Get all services
export const getAllActiveServices = async (req: Request, res: Response) => {
    try {

        const adminId = req.query.adminId as string;

        console.log("Admin ID in getAllActiveServices:", adminId);

        const services = await Service.findAll(
            {
                where: { adminId, isActive: true },
                attributes: ['serviceId', 'name', 'city'],
            });

        const dayPackagesValues = await DayPackage.findAll(
            {
                where: { adminId, status: true },
                attributes: ['noOfDays', 'distanceLimit'],
            });

        const hourlyPackagesValues = await HourlyPackage.findAll(
            {
                where: { adminId, status: true },
                attributes: ['noOfHours', 'distanceLimit'],
            });


        const dayPackages = new Set();
        const hourlyPackages = new Set();

        // Process day packages (type = "day")
        dayPackagesValues.forEach((dayPackage) => {
            // Extract values (handling Sequelize dataValues if present)
            const dayOrHour = dayPackage.dataValues?.noOfDays || dayPackage.noOfDays;
            const distanceLimit = dayPackage.dataValues?.distanceLimit || dayPackage.distanceLimit;
            const formattedString = `${dayOrHour} ${(Number(dayOrHour) > 1 ? "Days" : "Day")} ${distanceLimit} Km`;

            // console.log("dayPackage--->", dayPackage);
            // console.log("dayPackage noOfDays--->", dayOrHour, distanceLimit);
            dayPackages.add(formattedString.trim());
        });

        // Process hourly packages (type = "hour")
        hourlyPackagesValues.forEach((hourPackage) => {
            // Extract values
            const dayOrHour = hourPackage.noOfHours;
            const distanceLimit = hourPackage.distanceLimit;
            // Format the string
            const formattedString = `${dayOrHour} ${(Number(dayOrHour) > 1 ? "Hours" : "Hour")} ${distanceLimit} Km`;

            // console.log("hourPackage--->", hourPackage);
            // console.log("hourPackage noOfHours--->", dayOrHour, distanceLimit);
            hourlyPackages.add(formattedString.trim());
        });


        res.status(200).json({
            success: true,
            message: "Active Services retrieved successfully",
            data: {
                services,
                dayPackage: Array.from(dayPackages),
                hourlyPackage: Array.from(hourlyPackages),
            },
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching services",
        });
    }
};

//det active  Tariff
export const getAllActiveTariffs = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId as string;

        const tariffs = await Tariff.findAll(
            {
                where: { adminId, status: true },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                include: [
                    {
                        model: Vehicle,
                        as: 'vehicles',
                        attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                    }
                ]
            });


        if (tariffs.length === 0) {
            res.status(404).json({
                success: false,
                message: "No active tariffs found"
            });
            return;
        }

        const services = await Service.findAll({
            where: { adminId, isActive: true },
            attributes: ['serviceId', 'name', 'city'],
        });

        // First, create a map of service names to their IDs
        const serviceMap: Record<string, string> = {};
        services.forEach((service: any) => {
            serviceMap[service.name.toLowerCase()] = service.serviceId;
        });

        // Now use that to filter your tariffs
        const oneWay = tariffs.filter((tariff: any) => tariff.serviceId === serviceMap["one way"]);
        const roundTrip = tariffs.filter((tariff: any) => tariff.serviceId === serviceMap["round trip"]);
        const packages = tariffs.filter((tariff: any) => tariff.serviceId === serviceMap["packages"]);
        const airport = tariffs.filter((tariff: any) => tariff.serviceId === serviceMap["airport"]);


        res.status(200).json({
            success: true,
            message: "Active Tariffs retrieved successfully",
            data: {
                oneWay,
                roundTrip,
                packages,
                airport
            }
        });
    } catch (error) {
        console.error("Error fetching tariffs:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tariffs",
        });
    }
};
//det active  Tariff
export const getCompanyProfile = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId as string;

        const profile = await CompanyProfile.findOne({
            where: { adminId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        if (!profile) {
            res.status(400).json({
                success: false,
                message: "Profile not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Active Tariffs retrieved successfully",
            data: {
                profile
            }
        });
    } catch (error) {
        console.error("Error fetching tariffs:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tariffs",
        });
    }
};

//get all active vehicles
export const getAllActiveVehicles = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId as string;

        const vehicles = await Vehicle.findAll(
            {
                where: { adminId, isActive: true },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            });

        res.status(200).json({
            success: true,
            message: "Active Vehicles retrieved successfully",
            data: vehicles,
        });
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vehicles",
        });
    }
};
export const getAllBlogs = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId as string;

        const blogs = await Blog.findAll(
            {
                where: { adminId },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            });

        res.status(200).json({
            success: true,
            message: "All Blogs retrieved successfully",
            data: blogs,
        });
    } catch (error) {
        console.error("Error fetching blog:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching blog",
        });
    }
};
export const getSingleBlog = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId as string;
        const { id } = req.params

        const blogs = await Blog.findAll(
            {
                where: { url: id },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            });

        res.status(200).json({
            success: true,
            message: "Blog retrieved successfully",
            data: blogs,
        });
    } catch (error) {
        console.error("Error fetching blog:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching blog",
        });
    }
};


//store ip address
export const storeIpAddress = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId as string;
        const { ipAddress } = req.body;

        const newIpAddress = await IPTracking.create({
            adminId,
            ipAddress,
            visitTime: new Date(),
        });

        newIpAddress.ipAddressId = `ip-${newIpAddress.ipAddressId}`;
        await newIpAddress.save();

        res.status(200).json({
            success: true,
            message: "IP address stored successfully",
            data: newIpAddress,
        });
    } catch (error) {
        console.error("Error storing IP address:", error);
        res.status(500).json({
            success: false,
            message: "Error storing IP address",
        });
    }
}


//get all active dynamic routes
export const getAllActiveDynamicRoutes = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId as string;

        const dynamicRoutes = await DynamicRoute.findAll(
            {
                where: { adminId, status: true },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt', 'adminId'] },
            });

        res.status(200).json({
            success: true,
            message: "Active Dynamic Routes retrieved successfully",
            data: dynamicRoutes,
        });
    } catch (error) {
        console.error("Error fetching dynamic routes:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dynamic routes",
        });
    }
};
export const getAllActivePopularRoutes = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId as string;

        const popularRoutes = await PopularRoutes.findAll(
            {
                where: { adminId, status: true },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt', 'adminId', 'distance', 'duration'] },
            });

        res.status(200).json({
            success: true,
            message: "Active Popular Routes retrieved successfully",
            data: popularRoutes,
        });
    } catch (error) {
        console.error("Error fetching popular routes:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching popular routes",
        });
    }
};


// Get all services
export const getBookingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const adminId = req.query.adminId as string;

        const booking = await Booking.findOne({
            where: { bookingId: id },
            attributes: [
                "bookingId", "customerId", "driverId", "pickup", "drop",
                "pickupDateTime", "dropDate",
                "serviceType", "status",
                "distance", "estimatedAmount",
                "discountAmount", "finalAmount",
                "advanceAmount", "upPaidAmount",
                "offerId", "paymentMethod",
                "paymentStatus"],
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ["customerId", "name", "phone", "email"]
                },
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ["driverId", "name", "phone", "email", "license", "remark"]
                }
            ]
        });

        if (!booking) {
            res.status(400).json({
                success: false,
                message: "Booking not found"
            });
            return;
        }
        console.log("booking --> ", booking.pickupDateTime)

        const dateTimeConvert = new Date(booking.pickupDateTime);
        const istDate = new Date(dateTimeConvert.getTime() - (5.5 * 60 * 60 * 1000));

        const bookingData = {
            bookingId: booking.bookingId,
            customerId: booking.customerId,
            driverId: booking.driverId,
            pickup: booking.pickup,
            drop: booking.drop,
            pickupDateTime: istDate,
            dropDate: booking.dropDate,
            serviceType: booking.serviceType,
            status: booking.status,
            distance: booking.distance,
            estimatedAmount: booking.estimatedAmount,
            discountAmount: booking.discountAmount,
        }

        const customerData = (booking as any).customer;
        const driverData = (booking as any).driver;

        res.status(200).json({
            success: true,
            message: "Active Services retrieved successfully",
            data: {
                booking: bookingData,
                customer: customerData,
                driver: driverData
            },
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching services",
        });
    }
};


export const getIncludeAndExclude = async (req: Request, res: Response) => {
    try {
        const adminId = req.query.adminId as string;
        const { id } = req.params;

        const service = await Service.findOne({
            where: { adminId, serviceId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt', 'adminId'] },
        });

        if (!service) {
            res.status(400).json({
                success: false,
                message: "Service not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Include and Exclude retrieved successfully",
            data: service,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching include and exclude",
            error: error
        });
    }
}


