import { Request, Response } from "express";
import { Admin, DayPackage, Enquiry, HourlyPackage, Offers, Service, Vehicle } from "../../core/models";
import { getTariffs } from "../../core/function";
import { distancePriceCalculation } from "../../core/function/distancePriceCalculation";
import { createNotification } from "../../core/function/notificationCreate";
import { sendNotification } from "../../../common/services/socket/websocket";
import { findDistanceAndTime, getSegmentDistancesOptimized } from "../../../common/functions/distanceAndTime";

export const enquiryController = async (req: Request, res: Response): Promise<void> => {
    try {

        const adminId = req.query.adminId as string;

        const {
            name,
            email,
            phone,
            pickupDateTime,
            dropDate,
            pickup,
            drop,
            stops,
            // serviceId,
            serviceType,
            subServiceType,
            isEnquiry,
            packageType,
            packageValue,
            days
        } = req.body;

        console.log("website enquiry req.body--->", req.body);


        const requiredFields = ["pickup", "serviceType", "isEnquiry"];
        const missingFields = requiredFields.filter(field => {
            return req.body[field] === undefined || req.body[field] === null;
        });

        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            });
            return;
        }

        // console.log(pickupDateTime)

        const pickupConvert = new Date(pickupDateTime);
        // console.log("pickupConvert --> ", pickupConvert)
        const dropConvert = dropDate ? new Date(dropDate) : null;

        const service = await Service.findOne({
            where: {
                adminId,
                name: serviceType
            }
        });

        if (!service) {
            res.status(400).json({
                success: false,
                message: "Service not found"
            });
            return;
        }

        let newEnquiry: Enquiry | undefined;
        if (isEnquiry) {
            if (name !== "" && phone !== "") {
                newEnquiry = await Enquiry.create({
                    adminId,
                    name: name || null,
                    email: email || null,
                    phone,
                    pickupDateTime: pickupConvert,
                    dropDate: dropConvert,
                    pickup,
                    drop,
                    stops: stops || [],
                    serviceId: service.serviceId,
                    serviceType,
                    type: "Website",
                    status: "Current",
                    createdBy: "User",
                    days
                });
                let cleanedPhone = phone.replace(/^\+?91|\D/g, '');
                cleanedPhone = cleanedPhone.slice(5, 10);

                newEnquiry.enquiryId = `SLTE${cleanedPhone}${newEnquiry.id}`;
                await newEnquiry.save();

                const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
                const notification = {
                    adminId,
                    title: `New Website Enquiry created`,
                    description: `Enquiry Id: ${newEnquiry.enquiryId} , Customer Name: ${name} , Phone: ${phone}`,
                    type: "enquiry",
                    read: false,
                    date: new Date(),
                    time: time,
                };

                // const notificationResponse = await createNotification(notification as any);

                // console.log("notificationId", notificationId)

                // if (notificationResponse.success) {
                //     sendNotification(adminId, {
                //         notificationId: notificationResponse.notificationId ?? undefined,
                //         title: `New Website Enquiry created`,
                //         description: `Enquiry Id: ${newEnquiry.enquiryId} , Customer Name: ${name} , Phone: ${phone}`,
                //         type: "enquiry",
                //         read: false,
                //         date: new Date(),
                //         time: time,
                //     });
                // }
            }
        }

        // Check if newEnquiry is defined before accessing its properties
        let enquiryId = newEnquiry ? newEnquiry.enquiryId : 'no enquiry id';

        //offer calculation
        const offer = await Offers.findAll({ where: { adminId, status: true } });

        let filteredOffer: any = null;

        if (offer.length > 0) {
            // First, try to find offer matching the service name
            filteredOffer = offer.find((offer: any) => offer.category === service.name);

            // If no exact match, fallback to a general "All" category
            if (!filteredOffer) {
                filteredOffer = offer.find((offer: any) => offer.category === "All");
            }
        }

        // Use filteredOffer safely below
        // console.log("filteredOffer-->", filteredOffer);


        let newTariff: any[] = [];

        if (packageType) {
            let offerAmount: number = 0;
            let offerType: string = "";
            let offerId: string = "";

            const offer = await Offers.findAll({ where: { adminId } });
            // console.log("offer--->", offer);
            if (offer.length > 0) {
                // Find an offer that matches the serviceType
                let filteredOffer = offer.find((offer: any) => offer.category === "Package");
                // If no exact match is found, look for a general offer
                if (!filteredOffer) {
                    filteredOffer = offer.find((offer: any) => offer.category === "All");
                }

                // If a valid offer is found, assign its values
                if (filteredOffer) {
                    // console.log("filteredOffer--->", filteredOffer.value);
                    offerAmount = filteredOffer.value;
                    offerType = filteredOffer.type;
                    offerId = filteredOffer.offerId;
                }
            }

            switch (packageType) {
                case "hourly": {
                    const [hour, , hourDistance] = packageValue.split(' '); // Simplified destructuring
                    const hourlyPackages = await HourlyPackage.findAll({
                        where: {
                            adminId,
                            noOfHours: hour,
                            distanceLimit: Number(hourDistance),
                        },
                        include: [
                            {
                                model: Vehicle,
                                as: 'vehicles',
                                where: { isActive: true, isAdminVehicle: true },
                                attributes: [
                                    'vehicleId', 'name', 'type',
                                    'fuelType', 'isActive', 'seats',
                                    'bags', 'order', 'imageUrl'
                                ],
                                order: [['order', 'ASC']]
                            },
                            {
                                model: Service,
                                as: 'services',
                                where: { isActive: true },
                                attributes: { exclude: ['id', 'updatedAt', 'createdAt', 'deletedAt'] }
                            },
                        ],
                    });

                    if (!hourlyPackages || hourlyPackages.length === 0) {
                        res.status(400).json({
                            success: false,
                            message: "Hourly Package not found",
                        });
                        return;
                    }

                    newTariff = hourlyPackages.map((hourlyPackage) => {
                        const taxPercentage = Number((hourlyPackage as any).services?.tax?.GST) ?? 0;
                        let basePrice: number = hourlyPackage.price;
                        const driverBetta = hourlyPackage.driverBeta || 0;
                        basePrice += driverBetta;
                        let finalPrice: number = basePrice;
                        let discountApplyPrice: number = 0;

                        if (offerAmount > 0) {
                            // console.log("offerAmount--->", offerAmount);
                            if (offerType === "Percentage") {
                                offerAmount = (basePrice * offerAmount) / 100;
                                // console.log("offerAmount percentage--->", offerAmount);
                            } else {
                                offerAmount = offerAmount;
                            }
                            discountApplyPrice = basePrice - Math.ceil(offerAmount);
                        } else {
                            discountApplyPrice = 0;
                        }
                        const taxAmount = (basePrice * taxPercentage) / 100;
                        discountApplyPrice !== 0 ? finalPrice = discountApplyPrice + Math.ceil(taxAmount)
                            : finalPrice += discountApplyPrice + Math.ceil(taxAmount);
                        return {
                            enquiryId,
                            tariffId: hourlyPackage.packageId,
                            serviceId: hourlyPackage.serviceId,
                            vehicleId: hourlyPackage.vehicleId,
                            price: hourlyPackage.price,
                            extraPrice: hourlyPackage.extraPrice,
                            status: hourlyPackage.status,
                            packageId: hourlyPackage.packageId,
                            distance: hourlyPackage.distanceLimit,
                            duration: Number(hourlyPackage?.noOfHours) > 1 ? `${hourlyPackage.noOfHours} Hours` : `${hourlyPackage.noOfHours} Hour`,
                            vehicles: (hourlyPackage as any).vehicles,
                            services: (hourlyPackage as any).services,
                            order: (hourlyPackage as any).vehicles.order,
                            estimatedPrice: basePrice,
                            discountApplyPrice: Math.ceil(discountApplyPrice),
                            finalPrice: Math.ceil(finalPrice),
                            offerAmount: offerAmount,
                            offerType: offerType,
                            offerId: offerId,
                            driverBeta: driverBetta,
                            taxAmount: Math.ceil(taxAmount),
                            taxPercentage: taxPercentage,
                        };
                    });
                    break;
                }

                case "day": {
                    const [day, , dayDistance] = packageValue.split(' ');
                    // console.log("packageValue--->", packageValue);
                    // console.log("day--->", day, dayDistance);
                    const dayPackages = await DayPackage.findAll({
                        where: {
                            adminId,
                            noOfDays: day,
                            distanceLimit: Number(dayDistance),
                        },
                        include: [
                            {
                                model: Vehicle,
                                as: 'vehicles',
                            },
                            {
                                model: Service,
                                as: 'services',
                            },
                        ],
                    });

                    // console.log("dayPackage--->", dayPackage);
                    if (!dayPackages) {
                        res.status(400).json({
                            success: false,
                            message: "Day Package not found",
                        });
                        return;
                    }

                    newTariff = dayPackages.map((dayPackage) => {

                        // Example processing for day package (mirroring hourly logic)

                        const taxPercentage = (dayPackage as any).services?.tax?.GST ?? 0;
                        let basePrice: number = dayPackage.price;
                        let discountApplyPrice: number = 0;
                        const driverBetta = dayPackage.driverBeta || 0;
                        basePrice += driverBetta;
                        let finalPrice: number = basePrice;

                        if (offerAmount > 0) {
                            if (offerType === "Percentage") {
                                offerAmount = (basePrice * offerAmount) / 100;
                            } else {
                                offerAmount = offerAmount;
                            }
                            discountApplyPrice = basePrice - Math.ceil(offerAmount);
                        } else {
                            discountApplyPrice = 0;
                        }

                        const taxAmount = (basePrice * taxPercentage) / 100;
                        discountApplyPrice !== 0 ? finalPrice = discountApplyPrice + Math.ceil(taxAmount)
                            : finalPrice += discountApplyPrice + Math.ceil(taxAmount);


                        return {
                            enquiryId,
                            tariffId: dayPackage.packageId,
                            serviceId: dayPackage.serviceId,
                            vehicleId: dayPackage.vehicleId,
                            price: dayPackage.price,
                            extraPrice: dayPackage.extraPrice,
                            status: dayPackage.status,
                            vehicles: (dayPackage as any).vehicles,
                            services: (dayPackage as any).services,
                            estimatedPrice: basePrice,
                            discountApplyPrice: Math.ceil(discountApplyPrice),
                            finalPrice: Math.ceil(finalPrice),
                            offerAmount: offerAmount,
                            offerType: offerType,
                            offerId: offerId,
                            driverBetta: driverBetta,
                            taxPercentage: taxPercentage,
                            taxAmount: Math.ceil(taxAmount),
                        };
                    })
                    break;
                }
                default:
                    res.status(400).json({
                        success: false,
                        message: "Invalid packageType",
                    });
                    return;
            }
        } else {

            const routeInfo = await getSegmentDistancesOptimized({
                pickupCity: pickup,
                stops: stops || [],
                dropCity: drop,
                serviceType: serviceType
            });

            if (typeof routeInfo === 'string') {
                res.status(400).json({
                    success: false,
                    message: routeInfo,
                })
                return;
            }


            const tariffs = await getTariffs(adminId, service.serviceId);

            if (!tariffs || tariffs.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "No tariffs found"
                });
                return;
            }


            const tariffData = await Promise.all(tariffs.map(async (tariff: { tariffId: any; }) => {
                const { success, message, cals } = await distancePriceCalculation({
                    tariff: tariff,
                    pickupLocation: pickup,
                    dropLocation: drop,
                    service: service,
                    routeInfo: routeInfo,
                    pickupDateTime: pickupDateTime,
                    dropDate: dropDate,
                    adminId: adminId,
                    filteredOffers: filteredOffer,
                    subServiceType: subServiceType,
                    stops: stops || []
                });
                // console.log("success-->",success)
                // console.log("message-->",message)
                if (!success) {
                    return {
                        ...tariff,
                        price: 0,
                        distance: 0,
                        duration: 0
                    }
                }
                // console.log("cals-->",cals)
                // console.log("success-->",success)
                // console.log("message-->",message)

                return {
                    ...tariff,
                    estimatedPrice: cals?.price,
                    discountApplyPrice: cals?.discountApplyPrice,
                    finalPrice: cals?.finalPrice,
                    distance: cals?.distance,
                    duration: cals?.duration,
                    driverBeta: cals?.driverBeta,
                    taxAmount: cals?.taxAmount,
                    taxPercentage: cals?.taxPercentage,
                    toll: cals?.toll,
                    hill: cals?.hill,
                    permitCharge: cals?.permitCharge,
                    offerAmount: cals?.offerAmount,
                    offerType: cals?.offerType,
                    offerId: cals?.offerId,
                }
            }))

            newTariff = tariffData.map((tariff: any) => (
                {
                    enquiryId: enquiryId,
                    tariffId: tariff.dataValues.tariffId,
                    serviceId: tariff.dataValues.serviceId,
                    vehicleId: tariff.dataValues.vehicleId,
                    type: tariff.dataValues.type,
                    price: tariff.dataValues.price,
                    extraPrice: tariff.dataValues.extraPrice,
                    status: tariff.dataValues.status,
                    vehicles: tariff.vehicles,
                    services: tariff.services,
                    estimatedPrice: tariff.estimatedPrice,
                    discountApplyPrice: Math.ceil(tariff.discountApplyPrice),
                    finalPrice: Math.ceil(tariff.finalPrice),
                    offerAmount: tariff.offerAmount,
                    offerType: tariff.offerType,
                    offerId: tariff.offerId,
                    distance: tariff.distance,
                    duration: tariff.duration,
                    driverBeta: tariff.driverBeta,
                    taxAmount: Math.ceil(tariff.taxAmount),
                    taxPercentage: tariff.taxPercentage,
                    toll: tariff.toll,
                    hill: tariff.hill,
                    permitCharge: tariff.permitCharge
                }
            ));
        }

        // console.log("newTariff--->", newTariff);

        //    if (service.name === "Airport Pickup" || service.name === "Airport Drop") {
        //         // console.log("subServiceType--->", subServiceType);
        //         newTariff = newTariff.filter((item: any) => item.type === subServiceType);
        //     } 


        // Function to group by a specific key
        const groupBy: any = (arr: any[], key: string) => {
            return arr.reduce((acc, item) => {
                const groupKey = item.vehicles[key];
                if (!acc[groupKey]) acc[groupKey] = [];
                acc[groupKey].push(item);
                return acc;
            }, {});
        };

        // Group data by vehicle type and fuel type
        const filterByVehicleType = groupBy(newTariff, "type");
        const filterByVehicleFuelType = groupBy(newTariff, "fuelType");

        console.log("Updated newTariff--->", JSON.stringify(newTariff, null, 2));

        res.status(200).json({
            success: true,
            message: "Enquiry submitted successfully",
            data: {
                newTariff,
                filterByVehicleType,
                filterByVehicleFuelType
            }
        });
    } catch (error) {
        console.error("Error creating enquiry:", error);
        res.status(500).json({
            success: false,
            message: "Error creating enquiry",
        });
    }
};


export const saveEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        const enquiryData = req.body;


        // Normalize serviceType to match DB values
        let normalizedServiceType = enquiryData.serviceType;
        if (normalizedServiceType) {
            if (normalizedServiceType.toLowerCase() === "one-way trip") {
                normalizedServiceType = "One way";
            } else if (normalizedServiceType.toLowerCase() === "round trip") {
                normalizedServiceType = "Round trip";
            }
        }

        // Find serviceId from Service table
        let serviceRecord = await Service.findOne({
            where: { name: normalizedServiceType }
        });

        if (!serviceRecord) {
            res.status(400).json({
                success: false,
                message: "Service not found for the given serviceType",
            });
            return;
        }

        enquiryData.serviceId = serviceRecord.serviceId;
        enquiryData.serviceType = normalizedServiceType;





        const newEnquiry = await Enquiry.create({
            adminId: enquiryData.adminId || null,
            name: enquiryData.name || null,
            email: enquiryData.email || null,
            phone: enquiryData.phone || null,
            pickupDateTime: enquiryData.pickupDateTime || null,
            dropDate: enquiryData.dropDate || null,
            pickup: enquiryData.pickup ?? "null",
            drop: enquiryData.drop ?? "null",
            serviceId: enquiryData.serviceId,
            serviceType: (enquiryData.serviceType as "One way" | "Round trip") ?? "One way",
            type: (enquiryData.type as "Website" | "App" | "Manual") ?? "Website",
            status: (enquiryData.status as "Current" | "Future" | "Fake" | "Booked") ?? "Current",
            createdBy: (enquiryData.createdBy as "Admin" | "Vendor" | "User") ?? "User",
            stops: enquiryData.stops || [],
            days: enquiryData.days || null
        });


        const nextId = newEnquiry.id;
        newEnquiry.enquiryId = `EQ-${nextId.toString().padStart(4, '0')}`;
        await newEnquiry.save();

        console.log("Enquiry Data", newEnquiry);
        res.status(200).json({
            success: true,
            message: "Enquiry saved successfully",
            data: newEnquiry,
        });
    } catch (error) {
        console.error("Error saving enquiry:", error);
        res.status(500).json({
            success: false,
            message: "Error saving enquiry",
        });
    }
};