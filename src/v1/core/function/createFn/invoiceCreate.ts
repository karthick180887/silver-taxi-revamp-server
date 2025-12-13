import { sendNotification } from "../../../../common/services/socket/websocket";
import { CompanyProfile, Invoice } from "../../models/index";
import { paymentMethodsObj } from "../payment/razorpay";
import { createNotification } from "../notificationCreate";

export interface InvoiceResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: any;
}



export const createInvoice = async (data: any): Promise<InvoiceResponse> => {
    try {

        const {
            adminId,
            vendorId,
            bookingId,
            companyId,
            invoiceDate,
            name,
            phone,
            email,
            serviceType,
            vehicleType,
            invoiceNo,
            totalKm,
            pickup,
            drop,
            pricePerKm,
            travelTime,
            otherCharges,
            address,
            GSTNumber,
            estimatedAmount,
            advanceAmount,
            totalAmount,
            paymentDetails,
            paymentMethod,
            createdBy,
            status,
            note,
        } = data

        console.log("INVOICE CREATE Fn data >> ", data);


        // let validationFields = [
        //     "totalAmount",
        //     "serviceType",
        //     "status",
        //     "name",
        //     "phone",
        //     "totalKm",
        //     "pricePerKm",
        //     "travelTime",
        //     "address",
        //     "paymentDetails"
        // ]
        // let missingFields = validationFields.filter(field => data[field])
        // if (missingFields.length > 0) {
        //     return {
        //         success: false,
        //         message: `Missing required fields: ${missingFields.join(", ")}`,
        //     }
        // }

        const company = await CompanyProfile.findOne(
            {
                where: { adminId },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
            });


        // const pickupDateTimeObj = new Date(pickupDateTime);
        // if (isNaN(pickupDateTimeObj.getTime())) {
        //     res.status(400).json({
        //         success: false,
        //         message: "Invalid pickupDateTime format",
        //     });
        //     return;
        // }

        // let dropDateObj: Date | null = null;
        // if (dropDate) {
        //     dropDateObj = new Date(dropDate);
        //     if (isNaN(dropDateObj.getTime())) {
        //         res.status(400).json({
        //             success: false,
        //             message: "Invalid dropDate format",
        //         });
        //         return;
        //     }
        // }

        const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : new Date();
        if (isNaN(invoiceDateObj.getTime())) {
            return {
                success: false,
                message: "Invalid invoiceDate format",
            };
        }

        const date = new Date();
        const { customAlphabet } = await import('nanoid');
        const nanoid = customAlphabet('1234567890', 6);
        const optionalInvoiceNo = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${nanoid()}`;

        const methodKey = paymentMethod.toLowerCase() as keyof typeof paymentMethodsObj;
        const paymentType: "Wallet" | "UPI" | "Bank" | "Cash" | "Card" =
            (paymentMethodsObj[methodKey] as "Wallet" | "UPI" | "Bank" | "Cash" | "Card") || "UPI";


        const newInvoice = await Invoice.create({
            adminId,
            vendorId: createdBy === "Vendor" ? vendorId : null,
            bookingId,
            companyId: companyId ?? company?.companyId,
            invoiceNo: invoiceNo ?? optionalInvoiceNo,
            invoiceDate: invoiceDateObj,
            name,
            phone,
            email,
            serviceType,
            vehicleType,
            totalKm,
            pricePerKm,
            travelTime,
            address,
            GSTNumber,
            pickup: pickup ?? null,
            drop: drop ?? null,
            estimatedAmount,
            advanceAmount,
            totalAmount,
            otherCharges,
            paymentDetails,
            paymentMethod: paymentType ?? "UPI",
            createdBy: createdBy === "User" ? "Admin" : createdBy ?? "Admin",
            status: status ?? "Unpaid",
            note
        });

        newInvoice.invoiceId = `inv-${newInvoice.id}`;
        await newInvoice.save();

        const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
        const notification = {
            adminId,
            vendorId: createdBy === "Vendor" ? vendorId : null,
            title: `Invoice Generated – Trip #${bookingId}`,
            description: ` Invoice has been created for Trip #${bookingId}.`,
            type: "invoice",
            read: false,
            date: new Date(),
            time: time,
        };

        const adminNotification = {
            adminId,
            vendorId: null,
            title: `Invoice Generated – Trip #${bookingId}`,
            description: ` Invoice has been created for Trip #${bookingId}.`,
            type: "invoice",
            read: false,
            date: new Date(),
            time: time,
        }

        const adminNotificationResponse = await createNotification(adminNotification as any);

        if (createdBy === "Vendor") {
            const notificationResponse = await createNotification(notification as any);
            if (notificationResponse.success) {
                sendNotification(vendorId, {
                    notificationId: notificationResponse.notificationId ?? undefined,
                    title: `Invoice Generated – Trip #${bookingId}`,
                    description: ` Invoice has been created for Trip #${bookingId}.`,
                    type: "invoice",
                    read: false,
                    date: new Date(),
                    time: time,
                });
            }
        }

        if (adminNotificationResponse.success) {
            sendNotification(adminId, {
                notificationId: adminNotificationResponse.notificationId ?? undefined,
                title: `Invoice Generated – Trip #${bookingId}`,
                description: ` Invoice has been created for Trip #${bookingId}.`,
                type: "invoice",
                read: false,
                date: new Date(),
                time: time,
            });
        }

        return {
            success: true,
            message: `${newInvoice.createdBy} Invoice created successfully`,
            data: newInvoice
        }

    } catch (error) {
        console.error("Error creating invoice:", error);
        return {
            success: false,
            message: "Error creating invoice",
        }
    }
}
