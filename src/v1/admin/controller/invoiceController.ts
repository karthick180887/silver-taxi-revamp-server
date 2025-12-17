import { Request, Response } from "express";
import { Booking, Invoice, CompanyProfile } from "../../core/models"
import { Op } from "sequelize";


export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const { rows, count } = await Invoice.findAndCountAll({
            where: { adminId },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [
                {
                    model: CompanyProfile,
                    as: 'companyProfile',
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: "Invoices retrieved successfully",
            data: {
                rows,
                count,
                totalPages: Math.ceil(count / limit),
                page,
                limit
            }
        });


    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching invoices",
        });
    }
}
export const getVendorInvoices = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;
        const invoices = await Invoice.findAll({
            where: { adminId, vendorId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [
                {
                    model: CompanyProfile,
                    as: 'companyProfile',
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: "Vendor Invoices retrieved successfully",
            data: invoices
        });


    } catch (error) {
        console.error("Error fetching vendor invoices:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor invoices",
        });
    }
}


export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findOne({
            where: {
                [Op.or]: [
                    { invoiceId: id },
                    { bookingId: id }
                ]
            },
            attributes: {
                exclude: ['id', 'updatedAt', 'deletedAt']
            }
        });
        if (!invoice) {
            res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Invoice retrieved successfully",
            data: invoice
        });
    } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching invoice",
        });
    }
}

export const toggleChanges = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status !== "Paid" && status !== "Unpaid" && status !== "Pending") {
            res.status(400).json({
                success: false,
                message: "Invalid status",
            });
            return;
        }

        const invoice = await Invoice.findOne({ where: { invoiceId: id } });
        if (!invoice) {
            res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
            return;
        }

        if (status) {
            await invoice.update({ status });
        }

        res.status(200).json({
            success: true,
            message: "Invoice updated successfully"
        });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({
            success: false,
            message: "Error updating booking",
        });
    }
};


export const createInvoice = async (req: Request, res: Response) => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

        const {
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
            totalAmount,
            paymentDetails,
            createdBy,
            status,
            note,
        } = req.body;


        let validationFields = [
            "totalAmount",
            "serviceType",
            "status",
            "name",
            "phone",
            "totalKm",
            "pricePerKm",
            "travelTime",
            "address",
            "paymentDetails"
        ]
        let missingFields = validationFields.filter(field => !req.body[field])
        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            });
            return;
        }

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
            res.status(400).json({
                success: false,
                message: "Invalid invoiceDate format",
            });
            return;
        }

        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth()
        const day = date.getDate()
        const time = date.getTime()
        const optionalInvoiceNo = `INV-${year}${month + 1}${day}-${time.toString().split(":")[0]}`;

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
            totalAmount,
            otherCharges,
            paymentDetails,
            createdBy: createdBy ?? "Admin" as "Admin" | "Vendor",
            status: status ?? "Unpaid",
            note
        });

        newInvoice.invoiceId = `inv-${newInvoice.id}`;
        await newInvoice.save();

        res.status(201).json({
            success: true,
            message: `${newInvoice.createdBy} Invoice created successfully`,
            data: newInvoice
        });


    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({
            success: false,
            message: "Error creating invoice",
        });
    }
}


export const updateInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            bookingId,
            invoiceDate,
            name,
            phone,
            email,
            paymentMethod,
            pickup,
            pickupDateTime,
            drop,
            dropDate,
            companyId,
            serviceType,
            vehicleType,
            totalKm,
            pricePerKm,
            travelTime,
            otherCharges,
            GSTNumber,
            address,
            totalAmount,
            paymentDetails,
            status
        } = req.body;

        const invoice = await Invoice.findOne({
            where: { invoiceId: id }
        });

        if (!invoice) {
            res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
            return;
        }

        // Update the invoice with the new values
        const updatedInvoice = await invoice.update({
            bookingId,
            companyId,
            invoiceDate,
            name,
            phone,
            email,
            paymentMethod,
            pickup,
            pickupDateTime,
            drop,
            dropDate,
            GSTNumber,
            serviceType,
            vehicleType,
            totalKm,
            pricePerKm,
            travelTime,
            otherCharges,
            address,
            totalAmount,
            paymentDetails,
            status
        });

        res.status(200).json({
            success: true,
            message: `${invoice.createdBy} Invoice updated successfully`,
            data: updatedInvoice
        });

    } catch (error) {
        console.error("Error updating invoice:", error);
        res.status(500).json({
            success: false,
            message: "Error updating invoice",
        });
    }
}

export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findOne({ where: { invoiceId: id } });

        if (!invoice) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        await invoice.destroy();

        res.status(200).json({ success: true, message: "Invoice deleted successfully" });

    } catch (error) {

        console.error("Error deleting invoice:", error);
        res.status(500).json({ success: false, message: "Error deleting invoice" });
    }
}

export const multiDeleteInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const { invoiceIds } = req.body;

        if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: invoiceIds must be an array of invoice IDs",
            });
            return;
        }

        const invoices = await Invoice.findAll({
            where: { invoiceId: invoiceIds }
        });

        if (invoices.length === 0) {
            res.status(404).json({
                success: false,
                message: "No invoices found with the provided IDs",
            });
            return;
        }

        await Promise.all(invoices.map(invoice => invoice.destroy()));

        res.status(200).json({
            success: true,
            message: "Invoices deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting invoices:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting invoices",
        });
    }
};
