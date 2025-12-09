import { Request, Response } from "express";
import { Service, DayPackage, HourlyPackage } from "../../core/models"; // Import the Service model
import { Tariff } from "v1/core/models/tariff";

// Get all services
export const getAllServices = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const services = await Service.findAll(
            {
                where: { adminId },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                order: [['createdAt', 'ASC']],
            });


        res.status(200).json({
            success: true,

            message: "Services retrieved successfully",
            data: services,
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching services",
        });
    }
};

// Get service by ID
export const getServiceById = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const service = await Service.findOne({ where: { serviceId: id, adminId } });

        if (!service) {
            res.status(404).json({
                success: false,
                message: "Service not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Service retrieved successfully",
            data: service,
        });
    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching service",
        });
    }
};
// Get service by Name
export const getServiceByName = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { name } = req.query
        const decodedName = decodeURIComponent(name as string);
        const service = await Service.findOne({ where: { name: decodedName, adminId } });

        if (!service) {
            res.status(404).json({
                success: false,
                message: "Service not found in the service by name ",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Service retrieved successfully",
            data: service,
        });
    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching service",
        });
    }
};

// Create a new service
export const createService = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            name,
            tax,
            minKm,
            vendorCommission,
            driverCommission,
            isActive,
            city,
        } = req.body;

        const newService = await Service.create({
            adminId,
            name,
            tax,
            minKm,
            vendorCommission,
            driverCommission,
            isActive: isActive ?? true,
            city,
        });

        newService.serviceId = `ser-${newService.id}`;
        await newService.save();

        res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: newService,
        });
    } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({
            success: false,
            message: "Error creating service",
        });
    }
};

// Create a new service
export const updateServiceWithoutId = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            name,
            tax,
            minKm,
            vendorCommission,
            driverCommission,
            isActive,
            city,
        } = req.body;

        const newService = await Service.create({
            adminId,
            name,
            tax,
            minKm,
            vendorCommission,
            driverCommission,
            isActive: isActive ?? true,
            city,
        });

        newService.serviceId = `ser-${newService.id}`;
        await newService.save();


        res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: newService,
        });
    } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({
            success: false,
            message: "Error creating service",
            error: error
        });
    }
};

export const updateService = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const {
            tax,
            minKm,
            vendorCommission,
            driverCommission,
            isActive,
            city,
            include,
            exclude,
        } = req.body;
        // console.log("req.body--->",req.body);

        const service = await Service.findOne({ where: { serviceId: id, adminId } });

        if (!service) {
            res.status(404).json({
                success: false,
                message: "Service not found",
            });
            return;
        }

        const updatedService = await service.update({
            tax,
            minKm,
            vendorCommission,
            driverCommission,
            isActive,
            city,
            include,
            exclude,
        });
        // console.log("updatedService--->",updatedService);

        res.status(200).json({
            success: true,
            message: "Service updated successfully",
            data: updatedService,
        });
    } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({
            success: false,
            message: "Error updating service",
        });
    }
};

// Delete a service
export const deleteService = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { id } = req.params;
        const service = await Service.findOne({ where: { serviceId: id, adminId } });

        if (!service) {
            res.status(404).json({
                success: false,
                message: "Service not found",
            });
            return;
        }

        await service.destroy();

        res.status(200).json({
            success: true,
            message: "Service deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting service",
        });
    }
};

export const getPackages = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;

        const { type } = req.params;

        // Validate adminId exists
        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "Admin ID is required",
            });
            return;
        }

        if (!type) {
            res.status(400).json({
                success: false,
                message: "Package type is required",
            });
            return;
        }

        let packages;
        switch (type.toLowerCase()) {
            case "day":
                const dayPackage = await DayPackage.findAll({
                    where: { adminId },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                });
                packages = dayPackage;
                break;
            case "hourly":
                const hourlyPackage = await HourlyPackage.findAll({
                    where: { adminId },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                });
                packages = hourlyPackage;
                break;

            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid package type",
                });
                return;
        }

        res.status(200).json({
            success: true,
            message: "Packages retrieved successfully",
            data: packages,
        });

    } catch (error) {
        console.error("Error fetching packages:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching packages",
        });
    }
};

export const getVendorPackages = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "Vendor ID is required",
            });
            return;
        }

        const { type } = req.params;

        // Validate adminId exists
        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "Admin ID is required",
            });
            return;
        }

        if (!type) {
            res.status(400).json({
                success: false,
                message: "Package type is required",
            });
            return;
        }

        let packages;
        switch (type.toLowerCase()) {
            case "day":
                const dayPackage = await DayPackage.findAll({
                    where: { adminId, vendorId },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                });
                packages = dayPackage;
                break;
            case "hourly":
                const hourlyPackage = await HourlyPackage.findAll({
                    where: { adminId, vendorId },
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                });
                packages = hourlyPackage;
                break;

            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid package type",
                });
                return;
        }

        res.status(200).json({
            success: true,
            message: "Vendor Packages retrieved successfully",
            data: packages,
        });

    } catch (error) {
        console.error("Error fetching vendor packages:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor packages",
        });
    }
};

export const getPackageTariffByVehicleId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vehicleId, serviceId, type } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;

        // Validate adminId exists
        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "Admin ID is required",
            });
            return;
        }

        let tariff;
        switch (type.toLowerCase()) {
            case "day":
                tariff = await DayPackage.findAll({ where: { adminId, serviceId, vehicleId } });
                break;
            case "hourly":
                tariff = await HourlyPackage.findAll({ where: { adminId, serviceId, vehicleId } });
                break;
        }
        // console.log("tariff--->", tariff);

        if (!tariff) {
            res.status(404).json({
                success: false,
                message: "Tariff not found",
            });
            return;
        }

        const tariffData = tariff.map((t: any) => ({
            packageId: t.packageId,
            dayOrHour: type === "day" ? t.noOfDays : t.noOfHours,
            price: t.price,
            extraPrice: t.extraPrice,
            distanceLimit: t.distanceLimit,
            status: t.status !== undefined ? t.status : true,
            createdBy: t.createdBy,
            serviceId: t.serviceId,
            vehicleId: t.vehicleId,
            type: type === "day" ? "day" : "hourly",
            driverBeta: t.driverBeta
        }));

        res.status(200).json({
            success: true,
            message: "Tariff retrieved successfully",
            data: tariffData,
        });
    } catch (error) {
        console.error("Error fetching tariff:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tariff",
        });
    }
};

export const getVendorPackageTariffByVehicleId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vehicleId, serviceId, type } = req.params;
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "Vendor ID is required",
            });
            return;
        }

        // Validate adminId exists
        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "Admin ID is required",
            });
            return;
        }

        let tariff;
        switch (type.toLowerCase()) {
            case "day":
                tariff = await DayPackage.findAll({ where: { adminId, vendorId, serviceId, vehicleId } });
                break;
            case "hourly":
                tariff = await HourlyPackage.findAll({ where: { adminId, vendorId, serviceId, vehicleId } });
                break;
        }
        // console.log("tariff--->", tariff);

        if (!tariff) {
            res.status(404).json({
                success: false,
                message: "Tariff not found",
            });
            return;
        }

        const tariffData = tariff.map((t: any) => ({
            packageId: t.packageId,
            dayOrHour: type === "day" ? t.noOfDays : t.noOfHours,
            price: t.price,
            extraPrice: t.extraPrice,
            distanceLimit: t.distanceLimit,
            status: t.status !== undefined ? t.status : true,
            createdBy: t.createdBy,
            serviceId: t.serviceId,
            vehicleId: t.vehicleId,
            type: type === "day" ? "day" : "hourly",
            driverBeta: t.driverBeta
        }));

        res.status(200).json({
            success: true,
            message: "Vendor Tariff retrieved successfully",
            data: tariffData,
        });
    } catch (error) {
        console.error("Error fetching vendor tariff:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor tariff",
        });
    }
};


export const createPackage = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "Admin ID is required",
            });
            return;
        }

        const {
            serviceId,
            vehicleId,
            type,
            status,
            extraPrice,
            dayOrHour,
            distanceLimits,
            prices,
            createdBy,
            driverBeta
        } = req.body;

        // console.log("req.body--->", req.body);

        const validateFields = ["serviceId", "vehicleId", "type", "prices", "dayOrHour"];
        const missingFields = validateFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            });
            return
        }

        const createdPackages = [];

        switch (type.toLowerCase()) {
            case "day":
                let dayPackages;
                if (vendorId && createdBy === "Vendor") {
                    dayPackages = await DayPackage.findAll({
                        where: {
                            adminId, vendorId, serviceId, vehicleId
                        }
                    });
                } else {
                    dayPackages = await DayPackage.findAll({
                        where: {
                            adminId, serviceId, vehicleId
                        }
                    });
                }

                if (dayPackages.length > 0) {
                    await Promise.all(dayPackages.map(async (pkg) => {
                        await pkg.destroy({ force: true });
                    }));
                }

                for (let i = 0; i < dayOrHour.length; i++) {
                    const newDayPackage = await DayPackage.create({
                        adminId,
                        vendorId: createdBy === "Vendor" ? vendorId : null,
                        serviceId,
                        vehicleId,
                        noOfDays: dayOrHour[i],
                        distanceLimit: distanceLimits[i],
                        price: prices[i],
                        extraPrice: extraPrice ?? 0,
                        status,
                        createdBy,
                        driverBeta: driverBeta
                    });

                    newDayPackage.packageId = `dl-pkg-${newDayPackage.id}`;
                    await newDayPackage.save();
                    createdPackages.push(newDayPackage);
                }
                break;

            case "hourly":

                let hourlyPackages;
                if (vendorId && createdBy === "Vendor") {
                    hourlyPackages = await HourlyPackage.findAll({
                        where: {
                            adminId, vendorId, serviceId, vehicleId
                        }
                    });
                } else {
                    hourlyPackages = await HourlyPackage.findAll({
                        where: {
                            adminId, serviceId, vehicleId
                        }
                    });
                }

                if (hourlyPackages.length > 0) {
                    await Promise.all(hourlyPackages.map(async (pkg) => {
                        await pkg.destroy({ force: true });
                    }));
                }

                for (let i = 0; i < dayOrHour.length; i++) {
                    const newHourlyPackage = await HourlyPackage.create({
                        adminId,
                        vendorId: createdBy === "Vendor" ? vendorId : null,
                        serviceId,
                        vehicleId,
                        noOfHours: dayOrHour[i],
                        distanceLimit: distanceLimits[i],
                        price: prices[i],
                        extraPrice,
                        status,
                        createdBy,
                        driverBeta: driverBeta
                    });

                    newHourlyPackage.packageId = `hr-pkg-${newHourlyPackage.id}`;
                    await newHourlyPackage.save();
                    createdPackages.push(newHourlyPackage);
                }
                break;

            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid package type",
                });
                return
        }

        res.status(201).json({
            success: true,
            message: `${type} ${createdBy === "Vendor" ? "Vendor" : "Admin"} packages created successfully`,
            data: createdPackages,
        });

    } catch (error) {
        console.error("Error creating package:", error);
        res.status(500).json({
            success: false,
            message: "Error creating package",
        });
    }
};

// export const updatePackage = async (req: Request, res: Response) => {
//     try {
//         const adminId = req.body.adminId ?? req.query.adminId;

//         if (!adminId) {
//             res.status(400).json({ success: false, message: "Admin ID is required" });
//             return;
//         }

//         const {
//             serviceId,
//             vehicleId,
//             type,
//             extraPrice,
//             createdBy
//         } = req.body;

//         if (!serviceId || !vehicleId || !type) {
//             res.status(400).json({ success: false, message: "Missing required fields" });
//             return;
//         }

//         if (type === "hourly") {
//             const noOfHours = req.body.noOfHours ?? [];
//             const price = req.body.price ?? [];

//             if (!noOfHours.length || noOfHours.length !== price.length) {
//                 res.status(400).json({
//                     success: false,
//                     message: "Mismatch between noOfHours and price lengths",
//                 });
//                 return;
//             }

//             const existingPackages = await HourlyPackage.findAll({ where: { adminId, serviceId, vehicleId } });
//             let createdPackages = [];
//             let updatedPackages = [];

//             for (let i = 0; i < noOfHours.length; i++) {
//                 let existingPackage = existingPackages.find(pkg => pkg.noOfHours === noOfHours[i]);

//                 if (existingPackage) {
//                     existingPackage.price = price[i];
//                     existingPackage.extraPrice = extraPrice;
//                     await existingPackage.save();
//                     updatedPackages.push(existingPackage);
//                 } else {
//                     let newPackage = await HourlyPackage.create({
//                         adminId,
//                         serviceId,
//                         vehicleId,
//                         noOfHours: noOfHours[i],
//                         price: price[i],
//                         extraPrice,
//                         packageId: `hr-pkg-${Date.now()}-${i}`,
//                         createdBy
//                     });

//                     createdPackages.push(newPackage);
//                 }
//             }

//             res.status(200).json({
//                 success: true,
//                 message: "Hourly Packages updated successfully",
//                 createdPackages,
//                 updatedPackages,
//             });
//         }

//         if (type === "day") {
//             const noOfDays = req.body.noOfDays ?? [];
//             const price = req.body.price ?? [];

//             if (!noOfDays.length || noOfDays.length !== price.length) {
//                 res.status(400).json({
//                     success: false,
//                     message: "Mismatch between noOfDays and price lengths",
//                 });
//                 return;
//             }

//             const existingPackages = await DayPackage.findAll({ where: { adminId, serviceId, vehicleId } });
//             let createdPackages = [];
//             let updatedPackages = [];

//             for (let i = 0; i < noOfDays.length; i++) {
//                 let existingPackage = existingPackages.find(pkg => pkg.noOfDays === noOfDays[i]);

//                 if (existingPackage) {
//                     existingPackage.price = price[i];
//                     existingPackage.extraPrice = extraPrice;
//                     await existingPackage.save();
//                     updatedPackages.push(existingPackage);
//                 } else {
//                     let newPackage = await DayPackage.create({
//                         adminId,
//                         serviceId,
//                         vehicleId,
//                         noOfDays: noOfDays[i],
//                         price: price[i],
//                         extraPrice,
//                         packageId: `dl-pkg-${Date.now()}-${i}`,
//                         createdBy
//                     });

//                     createdPackages.push(newPackage);
//                 }
//             }

//             res.status(200).json({
//                 success: true,
//                 message: "Day Packages updated successfully",
//                 createdPackages,
//                 updatedPackages,
//             });
//         }

//         res.status(400).json({ success: false, message: "Invalid package type" });

//     } catch (error) {
//         console.error("Error updating package:", error);
//         res.status(500).json({ success: false, message: "Error updating package" });
//     }
// };

export const deletePackage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type } = req.body;
        let selectedPackage; // Renamed variable to avoid using reserved word
        switch (type.toLowerCase()) {
            case "day":
                selectedPackage = await DayPackage.findOne({ where: { packageId: id } });
                if (!selectedPackage) {
                    res.status(404).json({
                        success: false,
                        message: "Day package not found",
                    });
                    return;
                }
                break;
            case "hourly":
                selectedPackage = await HourlyPackage.findOne({ where: { packageId: id } });
                if (!selectedPackage) {
                    res.status(404).json({
                        success: false,
                        message: "Hourly package not found",
                    });
                    return;
                }
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid package type",
                });
                return;
        }

        await selectedPackage.destroy({ force: true });
        res.status(200).json({
            success: true,
            message: "Package deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting package:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting package",
        });
    }
};

export const deleteMultiplePackages = async (req: Request, res: Response) => {
    try {
        const { ids, type } = req.body; // Expecting an array of package IDs
        let selectedPackages; // Renamed variable to avoid using reserved word

        switch (type.toLowerCase()) {
            case "day":
                selectedPackages = await DayPackage.findAll({ where: { packageId: ids } });
                if (selectedPackages.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: "No day packages found",
                    });
                    return;
                }
                break;
            case "hourly":
                selectedPackages = await HourlyPackage.findAll({ where: { packageId: ids } });
                if (selectedPackages.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: "No hourly packages found",
                    });
                    return;
                }
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid package type",
                });
                return;
        }

        await Promise.all(selectedPackages.map(pkg => pkg.destroy({ force: true })));
        res.status(200).json({
            success: true,
            message: "Packages deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting packages:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting packages",
        });
    }
};





