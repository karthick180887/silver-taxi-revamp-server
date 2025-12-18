import { Request, Response } from 'express';
import { Booking, Customer, Service, HourlyPackage, DayPackage, Enquiry, Tariff, Vehicle, CustomerWallet, CompanyProfile } from '../../core/models';
import { createNotification } from '../../core/function/notificationCreate';
import { sendNotification } from '../../../common/services/socket/websocket';
// import { sendBooking } from '../../../common/services/mail';
import { sendWhatsAppMessage } from '../../../common/services/whatsApp/wachat'
import SMSService from '../../../common/services/sms/sms';
import { sequelize } from '../../../common/db/postgres';
import { generateReferralCode } from '../../core/function/referCode';
import { publishNotification } from '../../../common/services/rabbitmq/publisher';
import { toLocalTime } from '../../core/function/dataFn';

const sms = SMSService()

export const bookingCreate = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.query.adminId as string;

        const {
            name,
            email,
            phone,
            pickup,
            drop,
            pickupDateTime,
            dropDate,
            enquiryId,
            vehicleId,
            serviceId,
            serviceType,
            tariffId,
            packageId,
            offerId,
            finalAmount,
            paymentMethod,
            estimatedAmount,
            discountAmount,
            distance,
            advanceAmount,
            upPaidAmount,
            paymentStatus,
            driverBeta,
            toll,
            hill,
            permitCharge,
            taxPercentage,
            taxAmount,
            pricePerKm,
            duration,
            vehicleType,
            stops,
            // days,
            extraToll,
            extraHill,
            extraPermitCharge,
            extraDriverBeta,
            extraPricePerKm
        } = req.body;

        console.log("Body Data", req.body);

        let days = 1;

        // console.log("website data",req.body);

        // Validate common required fields
        const requiredFields = ['phone', 'pickup', 'pickupDateTime', 'serviceType', 'vehicleType'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
            return;
        }

        // Update enquiry status to booked if enquiryId is provided
        if (enquiryId !== null && enquiryId !== undefined && enquiryId !== "") {
            const enquiry = await Enquiry.findOne({ where: { enquiryId } });
            if (!enquiry) {
                return;
            }
            await enquiry.update({ status: "Booked" });
            await enquiry.save();
        }

        // Validate dates
        const pickupDateTimeObj = new Date(pickupDateTime);
        if (isNaN(pickupDateTimeObj.getTime())) {
            res.status(400).json({
                success: false,
                message: "Invalid pickupDateTime format",
            });
            return;
        }

        let dropDateObj: Date | null = null;
        if (dropDate) {
            dropDateObj = new Date(dropDate);
            if (isNaN(dropDateObj.getTime())) {
                res.status(400).json({
                    success: false,
                    message: "Invalid dropDate format",
                });
                return;
            }
        }


        const start = new Date(pickupDateTime);
        const end = new Date(dropDate);

        // Normalize to midnight
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        days = serviceType === "Round trip"
            ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 1;


        let convertedDistance = Math.round(Number(distance));
        let convertedDuration = duration;

        if (packageId) {

            let [type, name, recordId] = packageId.split("-");

            switch (type) {
                case "hr":
                    const hourlyPackage = await HourlyPackage.findOne({ where: { id: recordId } });
                    if (hourlyPackage) {
                        convertedDistance = Number(hourlyPackage.distanceLimit);
                        convertedDuration = `${hourlyPackage.noOfHours} Hours`;
                    }
                    break;
                case "dl":
                    const dayPackage = await DayPackage.findOne({ where: { id: recordId } });
                    if (dayPackage) {
                        convertedDistance = Number(dayPackage.distanceLimit);
                        convertedDuration = `${dayPackage.noOfDays} Days`;
                    }
                    break;
            }
        }


        const companyProfile = await CompanyProfile.findOne({
            where: { adminId },
        });

        const { customAlphabet } = await import("nanoid");
        const generateOtp = customAlphabet('1234567890', 6);  // 6 digits for MSG91 compatibility
        const startOtp = generateOtp();
        const endOtp = generateOtp();

        // Create booking
        const bookingData = {
            adminId,
            name,
            email,
            phone,
            pickup,
            drop: drop || "",
            pickupDateTime: pickupDateTimeObj,
            dropDate: dropDateObj,
            enquiryId,
            vehicleId,
            serviceId,
            serviceType,
            tariffId: serviceType === "Hourly Packages" ? null : tariffId || null,
            packageId: packageId || null,
            status: "Booking Confirmed" as "Booking Confirmed",
            type: "Website" as "Website",
            distance: convertedDistance,
            duration: convertedDuration,
            advanceAmount: advanceAmount ?? 0,
            estimatedAmount,
            discountAmount: discountAmount ?? 0,
            finalAmount,
            upPaidAmount: upPaidAmount ?? finalAmount,
            offerId: offerId || null,
            paymentMethod: paymentMethod || "Cash",
            paymentStatus: advanceAmount > 0 ? "Partial Paid" as "Partial Paid" : "Unpaid" as "Unpaid",
            createdBy: "User" as "User",
            driverBeta: driverBeta || null,
            toll: toll ?? null,
            hill: hill ?? null,
            permitCharge: permitCharge ?? null,
            taxPercentage: taxPercentage ?? null,
            taxAmount: taxAmount ?? null,
            pricePerKm: pricePerKm ?? null,
            startOtp,
            endOtp,
            vehicleType: vehicleType,
            stops: stops || null,
            days: days.toString(),
            normalFare: {
                distance: distance,
                pricePerKm: pricePerKm,
                driverBeta: driverBeta,
                toll: toll,
                hill: hill,
                permitCharge: permitCharge,
                estimatedAmount: estimatedAmount,
                finalAmount: finalAmount,
            },
            modifiedFare: {
                distance: distance,
                pricePerKm: pricePerKm,
                extraPricePerKm: extraPricePerKm,
                driverBeta: (driverBeta ?? 0) + (extraDriverBeta ?? 0),
                toll: (toll ?? 0) + (extraToll ?? 0),
                hill: (hill ?? 0) + (extraHill ?? 0),
                permitCharge: (permitCharge ?? 0) + (extraPermitCharge ?? 0),
                estimatedAmount: Number(estimatedAmount) + (distance * (extraPricePerKm ?? 0)),
                finalAmount: Number(finalAmount),
            }
        };

        const newBooking = await Booking.create(bookingData);
        let cleanedPhone = phone.replace(/^\+?91|\D/g, '');
        let phoneNumber = cleanedPhone.slice(5, 10);

        newBooking.bookingId = `SLTB${phoneNumber}${newBooking.id}`;

        await newBooking.save();

        let customer = await Customer.findOne({ where: { phone } });
        if (!customer) {
            const t = await sequelize.transaction();

            try {
                customer = await Customer.create({
                    adminId,
                    name,
                    email,
                    phone: `91 ${cleanedPhone}`,
                    createdBy: "Admin",
                    bookingCount: 1,
                    totalAmount: finalAmount || 0,
                }, { transaction: t });

                customer.customerId = `SLTC${phoneNumber}${customer.id}`;
                const { code: referralCode } = generateReferralCode({ userId: customer.id });
                customer.referralCode = referralCode;
                await customer.save({ transaction: t });

                const wallet = await CustomerWallet.create({
                    adminId,
                    customerId: customer.customerId,
                    balance: 0,
                    startAmount: 0,
                }, { transaction: t });

                wallet.walletId = `cus-wlt-${wallet.id}`;
                await wallet.save({ transaction: t });

                customer.walletId = wallet.walletId;
                await customer.save({ transaction: t }); // ✅ save only once, inside transaction

                await t.commit();
            } catch (error) {
                await t.rollback();
                console.error("Transaction failed:", error);
                throw error;
            }
        } else {
            await customer.update({
                bookingCount: customer.bookingCount + 1,
                totalAmount: customer.totalAmount + finalAmount,
            });
        }

        newBooking.customerId = customer.customerId;
        if (!name) newBooking.name = customer.customerId;
        await newBooking.save();

        const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
        const notification = {
            adminId,
            title: `New Website Booking created`,
            description: `Booking Id: ${newBooking.bookingId} , Customer Name: ${name} , Phone: ${phone}`,
            type: "booking",
            read: false,
            date: new Date(),
            time: time,
        };

        const notificationResponse = await createNotification(notification as any);

        if (notificationResponse.success) {
            sendNotification(adminId, {
                notificationId: notificationResponse.notificationId ?? undefined,
                title: `New Website Booking created`,
                description: `Booking Id: ${newBooking.bookingId} , Customer Name: ${name} , Phone: ${phone}`,
                type: "booking",
                read: false,
                date: new Date(),
                time: time,
            });
        }

        // let tariff: any;
        // if (tariffId) {
        //     tariff = await Tariff.findOne(
        //         {
        //             where: { tariffId: tariffId },
        //             include: [
        //                 {
        //                     model: Vehicle,
        //                     as: 'vehicles',
        //                 }
        //             ]
        //         }
        //     );
        // }

        // try {
        //     // Send email to customer
        //     const emailData = {
        //         bookingId: newBooking.bookingId,
        //         bookingDate: new Date(newBooking.createdAt).toLocaleString('en-IN', {
        //             timeZone: 'Asia/Kolkata',
        //             year: 'numeric',
        //             month: 'long',
        //             day: 'numeric',
        //             hour: '2-digit',
        //             minute: '2-digit'
        //         }),
        //         fullName: name,
        //         mobileNo: phone,
        //         email: email,
        //         pickup: pickup,
        //         drop: drop ?? null,
        //         pickupDate: new Date(pickupDateTime).toLocaleString('en-IN', {
        //             timeZone: 'Asia/Kolkata',
        //             year: 'numeric',
        //             month: 'long',
        //             day: 'numeric'
        //         }),
        //         pickupTime: new Date(pickupDateTime).toLocaleString('en-IN', {
        //             hour: '2-digit',
        //             minute: '2-digit'
        //         }),
        //         dropDate: dropDateObj ? new Date(dropDateObj).toLocaleString('en-IN', {
        //             timeZone: 'Asia/Kolkata',
        //             year: 'numeric',
        //             month: 'long',
        //             day: 'numeric'
        //         }) : null,
        //         vehicleType: (tariff as any).vehicles.type,
        //         vehicleName: (tariff as any).vehicles.name,
        //         serviceType: service.name,
        //         estimatedAmount: estimatedAmount,
        //         discountAmount: discountAmount,
        //         taxAmount: taxAmount,
        //         toll: toll,
        //         hill: hill,
        //         permitCharge: permitCharge,
        //         finalAmount: finalAmount,
        //         advanceAmount: advanceAmount,
        //         upPaidAmount: upPaidAmount,
        //         paymentMethod: paymentMethod,
        //     };

        //     // console.log("emailData ---> ", emailData);
        //     const emailResponse = await sendBooking(emailData);
        //     // console.log("emailResponse ---> ", emailResponse);
        //     if (emailResponse.status === 200) {
        //         console.log(`Email sent successfully to ${emailResponse.sentTo}`);
        //     } else {
        //         console.log("Email not sent");
        //     }

        // } catch (error) {
        //     console.error("Error sending email:", error);
        // }

        const IST_OFFSET = 5.5 * 60 * 60 * 1000;
        // send wa notification to customer
        try {
            const waCustomerPayload = {
                phone: cleanedPhone,
                variables: [
                    { type: "text", text: `${(companyProfile?.name ?? "silvercalltaxi.in")}` },
                    {
                        type: "text", text: `${new Date(
                            new Date(newBooking.pickupDateTime).getTime() - IST_OFFSET
                        ).toLocaleString('en-IN', {
                            timeZone: "Asia/Kolkata",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                        })}`
                    },
                    { type: "text", text: `${newBooking.pickup}${newBooking.stops.length > 0 ? ` → ${newBooking.stops.slice(0, 2).join(" → ")} → ${newBooking.drop}` : ""}${newBooking.drop ? `→ ${newBooking.drop}` : ""}` },
                    { type: "text", text: `${newBooking.serviceType === "Round trip" ? `${newBooking.serviceType} day(s)${newBooking.days}` : newBooking.serviceType}` },
                    { type: "text", text: newBooking.distance },
                    { type: "text", text: newBooking.minKm },
                    { type: "text", text: newBooking.pricePerKm },
                    { type: "text", text: newBooking.driverBeta },
                    // { type: "text", text: newBooking.extraCharges["Toll"].toString() ?? "0" },
                    { type: "text", text: newBooking.extraCharges["Hill"].toString() ?? "0" },
                    { type: "text", text: newBooking.extraCharges["Permit Charge"].toString() ?? "0" },
                    { type: "text", text: newBooking.estimatedAmount.toString() },
                    { type: "text", text: newBooking.taxAmount.toString() },
                    { type: "text", text: newBooking.discountAmount.toString() },
                    { type: "text", text: newBooking.finalAmount.toString() },
                    { type: "text", text: companyProfile?.phone[0] ?? "9876543210" },
                    { type: "text", text: companyProfile?.website ?? "silvercalltaxi.in" },
                ],
                templateName: "bookingConfirmedAcknowledgement"
            }

            publishNotification("notification.whatsapp", waCustomerPayload)
                .catch((err) => console.log("❌ Failed to publish Whatsapp notification", waCustomerPayload.templateName, err));

        } catch (error) {
            console.log("❌ Failed to publish create booking Whatsapp notification", error);
        }


        // Send SMS to customer
        try {
            const smsResponse = await sms.sendTemplateMessage({
                mobile: Number(cleanedPhone),
                template: "customer_booking_acknowledgement",
                data: {
                    contact: `${(companyProfile?.name ?? "silvercalltaxi.in")}`,
                    location: `${pickup} ${stops.length > 0 ? ` → ${stops.join(" → ")} → ${drop}` : drop ? ` → ${drop}` : ""}`,
                    pickupDateTime: new Date(
                        new Date(pickupDateTime).getTime() - IST_OFFSET
                    ).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    }),
                    serviceType: `${newBooking.serviceType === "Round trip" ? `${newBooking.serviceType} day(s)${newBooking.days}` : newBooking.serviceType}`,
                    distance: newBooking.distance,
                    minKm: newBooking.minKm,
                    pricePerKm: newBooking.pricePerKm,
                    driverBeta: newBooking.driverBeta,
                    hill: newBooking.extraCharges["Hill"].toString() ?? "0",
                    permitCharges: newBooking.extraCharges["Permit Charge"].toString() ?? "0",
                    estimatedAmount: newBooking.estimatedAmount.toString(),
                    taxAmount: newBooking.taxAmount.toString(),
                    discountAmount: newBooking.discountAmount.toString(),
                    finalAmount: newBooking.finalAmount.toString(),
                    contactNumber: companyProfile?.phone[0] ?? "9876543210",
                    website: companyProfile?.website ?? "https://silvercalltaxi.in"
                }
            })
            if (smsResponse) {
                console.log("SMS sent successfully to customer");
            } else {
                console.log("SMS not sent to customer");
            }
        } catch (error) {
            console.error(`Error sending SMS to customer: ${error}`);
        }


        res.status(201).json({
            success: true,
            message: `${serviceType} booking created successfully`,
            data: newBooking.toJSON()
        });

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};


export const bookingUpdate = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.query.adminId as string;
        const { id } = req.params;
        const {
            pickupDateTime,
            dropDate
        } = req.body;

        const booking = await Booking.findOne({
            where: {
                adminId,
                bookingId: id
            }
        });
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }

        await booking.update({
            pickupDateTime,
            dropDate
        });
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking updated successfully",
            data: booking
        });

    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};


export const bookingSave = async (req: Request, res: Response): Promise<void> => {
    try {

        const {
            name,
            email,
            phone,
            adminId,
            pickup,
            drop,
            pickupDateTime,
            dropDate,
            enquiryId,
            vehicleId,
            serviceId,
            tariffId,
            packageId,
            offerId,
            finalAmount,
            paymentMethod,
            estimatedAmount,
            discountAmount,
            distance,
            advanceAmount,
            upPaidAmount,
            paymentStatus,
            driverBeta,
            toll,
            hill,
            permitCharge,
            taxPercentage,
            taxAmount,
            pricePerKm,
            duration,
            vehicleType,
            stops
        } = req.body;

        // Debug: Log incoming request body
        console.log("bookingSave - req.body:", req.body);
        // console
        // console.log("Cname", carType);

        // Validate required fields
        const requiredFields = ['name', 'phone', 'pickup', 'pickupDateTime', 'serviceType', 'vehicleType'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            console.debug("bookingSave - missingFields:", missingFields);
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
            return;
        }

        // Validate dates
        const pickupDateTimeObj = new Date(pickupDateTime);
        if (isNaN(pickupDateTimeObj.getTime())) {
            console.debug("bookingSave - Invalid pickupDateTime:", pickupDateTime);
            res.status(400).json({
                success: false,
                message: "Invalid pickupDateTime format",
            });
            return;
        }

        let dropDateObj: Date | null = null;
        if (dropDate) {
            dropDateObj = new Date(dropDate);
            if (isNaN(dropDateObj.getTime())) {
                console.debug("bookingSave - Invalid dropDate:", dropDate);
                res.status(400).json({
                    success: false,
                    message: "Invalid dropDate format",
                });
                return;
            }
        }


        // Normalize serviceType to match DB values
        // let normalizedServiceType = req.body.serviceType;
        // if (normalizedServiceType) {
        //     if (normalizedServiceType.toLowerCase() === "one-way trip") {
        //         normalizedServiceType = "One way";
        //     } else if (normalizedServiceType.toLowerCase() === "round trip") {
        //         normalizedServiceType = "Round trip";
        //     }
        // }

        // Find serviceId from Service table
        let serviceRecord = await Service.findOne({
            where: { name: req.body.serviceType }
        });


        if (!serviceRecord) {
            res.status(400).json({
                success: false,
                message: "Service not found for the given serviceType",
            });
            return;
        }

        req.body.serviceId = serviceRecord.serviceId;



        // Validate service configuration
        const service = await Service.findOne({ where: { serviceId: serviceRecord.dataValues.serviceId, adminId } });
        if (!service) {
            console.debug("bookingSave - Service not found:", serviceId, adminId);
            res.status(404).json({
                success: false,
                message: `Service configuration not found`,
            });
            return;
        }

        let convertedDistance = Math.round(Number(distance));
        let convertedDuration = duration;

        if (packageId) {
            let [type, name, recordId] = packageId.split("-");
            switch (type) {
                case "hr":
                    try {
                        const hourlyPackage = await HourlyPackage.findOne({ where: { id: recordId } });
                        if (hourlyPackage) {
                            convertedDistance = Number(hourlyPackage.distanceLimit);
                            convertedDuration = `${hourlyPackage.noOfHours} Hours`;
                        }
                    } catch (err) {
                        console.debug("bookingSave - Error fetching hourlyPackage:", err);
                    }
                    break;
                case "dl":
                    try {
                        const dayPackage = await DayPackage.findOne({ where: { id: recordId } });
                        if (dayPackage) {
                            convertedDistance = Number(dayPackage.distanceLimit);
                            convertedDuration = `${dayPackage.noOfDays} Days`;
                        }
                    } catch (err) {
                        console.debug("bookingSave - Error fetching dayPackage:", err);
                    }
                    break;
            }
        }


        let resolvedVehicleId = vehicleId;
        if (!resolvedVehicleId && vehicleType) {
            const vehicle = await Vehicle.findOne({ where: { type: vehicleType } });
            if (vehicle) {
                resolvedVehicleId = vehicle.vehicleId;
            }
        }

        const { customAlphabet } = await import("nanoid");
        const generateOtp = customAlphabet('1234567890', 6);  // 6 digits for MSG91 compatibility
        const startOtp = generateOtp();
        const endOtp = generateOtp();
        // Create booking in Postgres using ORM
        const bookingData = {
            adminId,
            name,
            email,
            phone,
            pickup,
            drop,
            pickupDateTime: pickupDateTimeObj,
            dropDate: dropDateObj,
            enquiryId,
            vehicleId: resolvedVehicleId,
            serviceId: serviceRecord.dataValues.serviceId,
            serviceType: service.name,
            tariffId: tariffId || null,
            packageId: packageId || null,
            status: "Booking Confirmed" as "Booking Confirmed",
            type: "Website" as "Website",
            distance: convertedDistance,
            duration: convertedDuration,
            advanceAmount: advanceAmount ?? 0,
            estimatedAmount,
            discountAmount: discountAmount ?? 0,
            finalAmount,
            upPaidAmount: upPaidAmount ?? finalAmount,
            offerId,
            paymentMethod,
            paymentStatus: paymentStatus || "Pending",
            createdBy: "User" as "User",
            driverBeta: driverBeta || null,
            toll: toll ?? null,
            hill: hill ?? null,
            permitCharge: permitCharge ?? null,
            taxPercentage: taxPercentage ?? null,
            taxAmount: taxAmount ?? null,
            pricePerKm: pricePerKm ?? null,
            startOtp,
            endOtp,
            vehicleType: vehicleType,
            stops: stops || null
        };

        console.log("Booking Data", bookingData);


        const newBooking = await Booking.create(bookingData);
        let cleanedPhone = phone.replace(/^\+?91|\D/g, '');
        cleanedPhone = cleanedPhone.slice(0, 6);

        newBooking.bookingId = `SLTB${cleanedPhone}${newBooking.id}`;

        await newBooking.save();

        let customer = await Customer.findOne({ where: { phone } });
        if (!customer) {
            const t = await sequelize.transaction();

            try {
                customer = await Customer.create({
                    adminId,
                    name,
                    email,
                    phone: `91 ${cleanedPhone}`,
                    createdBy: "Admin",
                    bookingCount: 1,
                    totalAmount: finalAmount || 0,
                }, { transaction: t });

                customer.customerId = `SLTC${cleanedPhone}${customer.id}`;
                const { code: referralCode } = generateReferralCode({ userId: customer.id });
                customer.referralCode = referralCode;
                await customer.save({ transaction: t });

                const wallet = await CustomerWallet.create({
                    adminId,
                    customerId: customer.customerId,
                    balance: 0,
                    startAmount: 0,
                }, { transaction: t });

                wallet.walletId = `cus-wlt-${wallet.id}`;
                await wallet.save({ transaction: t });

                customer.walletId = wallet.walletId;
                await customer.save({ transaction: t }); // ✅ save only once, inside transaction

                await t.commit();
            } catch (error) {
                await t.rollback();
                console.error("Transaction failed:", error);
                throw error;
            }
        } else {
            await customer.update({
                bookingCount: customer.bookingCount + 1,
                totalAmount: customer.totalAmount + finalAmount,
            });
        }

        newBooking.customerId = customer.customerId;
        if (!name) newBooking.name = customer.customerId;
        await newBooking.save();


        // console.log("Enquriy ID", enquiryId);
        try {
            if (enquiryId) {
                const bookingWithEnquiry = await Booking.findOne({ where: { enquiryId } });
                // console.log("Log---1", bookingWithEnquiry);
                if (bookingWithEnquiry) {
                    const enquiry = await Enquiry.findOne({ where: { enquiryId } });
                    // console.log("Log---2", enquiry);
                    if (enquiry) {
                        enquiry.status = "Booked";
                        await enquiry.save();
                    }
                }
            }
        } catch (error) {
            console.error("Database error:", error);
        }

        res.status(201).json({
            success: true,
            message: `${service.name} booking created successfully in Postgres`,
            data: newBooking
        });

    } catch (error) {
        console.error("Error creating booking in Postgres:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
