import { Request, Response } from "express";
import { Enquiry, Service } from "../../core/models";
import { Op } from "sequelize";
import { sendNotification } from "../../../common/services/socket/websocket";
import { createNotification } from "../../core/function/notificationCreate";

// Get all enquires
// Get all enquires
export const getAllEnquiries = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        console.log(`[Enquiries] Fetching for adminId: ${adminId}, page: ${page}, limit: ${limit}`);

        const offset = (page - 1) * limit;

        const [enquiresData, totalEnquiriesCount, todayEnquiriesCount, websiteEnquiriesCount] = await Promise.all([
            Enquiry.findAndCountAll({
                // where: { adminId },
                attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                include: {
                    model: Service,
                    as: 'services',
                    attributes: ['serviceId', 'name'],
                },
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: offset,
                distinct: true
            }),
            Enquiry.count({}), // where: { adminId }
            Enquiry.count({
                // where: {
                //     adminId,
                //     createdAt: {
                //         [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                //     }
                // } as any
            }),
            Enquiry.count({
                // where: {
                //     adminId,
                //     [Op.or]: [{ source: 'Website' }, { createdBy: 'Website' }] 
                // } as any
            })
        ]);

        const totalPages = Math.ceil(enquiresData.count / limit);

        res.status(200).json({
            success: true,
            message: "Enquires retrieved successfully",
            data: {
                enquiries: enquiresData.rows,
                stats: {
                    totalEnquiries: totalEnquiriesCount,
                    todayEnquiries: todayEnquiriesCount,
                    websiteEnquiries: websiteEnquiriesCount
                },
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalCount: enquiresData.count,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: limit
                }
            },
        });

    } catch (error) {
        console.error("Error fetching enquires:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching enquires",
        });
    }
};

export const getVendorEnquiries = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Enquiry",
            });
            return;
        }

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "vendorId is required in Enquiry",
            });
            return;
        }
        const enquires = await Enquiry.findAll({
            where: { adminId, createdBy: "Vendor", vendorId },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: {
                model: Service,
                as: 'services',
                attributes: ['serviceId', 'name'],
            }
        });

        res.status(200).json({
            success: true,
            message: "Vendor Enquires retrieved successfully",
            data: enquires,
        });

    } catch (error) {
        console.error("Error fetching vendor enquires:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendor enquires",
        });
    }
};

// Get a single enquiry by ID
export const getEnquiryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const enquiry = await Enquiry.findOne({
            where: { enquiryId: id },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
        });

        if (!enquiry) {
            res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Single Enquiry retrieved successfully",
            data: enquiry,
        });

    } catch (error) {
        console.error("Error fetching enquiry:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching enquiry",
        });
    }
};


// Create a new enquiry
export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const vendorId = req.body.vendorId ?? req.query.id;
        const {
            name,
            email,
            phone,
            pickupDateTime,
            dropDate,
            pickup,
            drop,
            serviceId,
            type,
            status,
            createdBy
        } = req.body;



        if (!pickup || !drop || !serviceId || !type) {
            res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
            return;
        }

        // console.log(pickupDateTime)


        const service = await Service.findOne({ where: { serviceId } });
        const serviceType = service ? service.name : undefined;


        const pickupConvert = new Date(pickupDateTime);
        // console.log("pickupConvert", pickupConvert)
        const dropConvert = dropDate ? new Date(dropDate) : null;
        const newEnquiry = await Enquiry.create({
            adminId,
            vendorId: createdBy === "Vendor" ? vendorId : null,
            name,
            email,
            phone,
            pickupDateTime: pickupConvert,
            dropDate: dropConvert,
            pickup,
            serviceType,
            drop,
            serviceId,
            type: type ?? "Manual",
            status: status ?? "Current",
            createdBy: createdBy ?? "Admin"
        });

        let cleanedPhone = phone.replace(/^\+?91|\D/g, '');
        cleanedPhone = cleanedPhone.slice(5, 10);

        newEnquiry.enquiryId = `SLTE${cleanedPhone}${newEnquiry.id}`;
        await newEnquiry.save();

        const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
        const notification = {
            adminId,
            vendorId: createdBy === "Vendor" ? vendorId : null,
            title: `New ${createdBy === "Vendor" ? "Vendor" : "Admin"} Enquiry created`,
            description: `Enquiry Id: ${newEnquiry.enquiryId} , Customer Name: ${name} , Phone: ${phone}`,
            type: "enquiry",
            read: false,
            date: new Date(),
            time: time,
        };

        const adminNotification = {
            adminId,
            vendorId: null,
            title: `New ${createdBy === "Vendor" ? "Vendor" : "Admin"} Enquiry created`,
            description: `Enquiry Id: ${newEnquiry.enquiryId} , Customer Name: ${name} , Phone: ${phone}`,
            type: "enquiry",
            read: false,
            date: new Date(),
            time: time,
        };

        const adminNotificationResponse = await createNotification(adminNotification as any);

        // console.log("notificationId", notificationId)

        if (createdBy === "Vendor") {
            const notificationResponse = await createNotification(notification as any);
            if (notificationResponse.success) {
                sendNotification(vendorId, {
                    notificationId: notificationResponse.notificationId ?? undefined,
                    title: `New Vendor Enquiry created`,
                    description: `Enquiry Id: ${newEnquiry.enquiryId} , Customer Name: ${name} , Phone: ${phone}`,
                    type: "enquiry",
                    read: false,
                    date: new Date(),
                    time: time,
                });
            }
        }

        if (adminNotificationResponse.success) {
            sendNotification(adminId, {
                notificationId: adminNotificationResponse.notificationId ?? undefined,
                title: `New ${createdBy === "Vendor" ? "Vendor" : "Admin"} Enquiry created`,
                description: `Enquiry Id: ${newEnquiry.enquiryId} , Customer Name: ${name} , Phone: ${phone}`,
                type: "enquiry",
                read: false,
                date: new Date(),
                time: time,
            });
        }


        res.status(201).json({
            success: true,
            message: `${createdBy === "Vendor" ? "Vendor" : "Admin"} enquiry created successfully`,
            data: newEnquiry,
        });
    } catch (error) {
        console.error("Error creating enquiry:", error);
        res.status(500).json({
            success: false,
            message: "Error creating enquiry",
        });
    }
};

// Update an existing enquiry
export const updateEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            name, email, phone,
            pickup, drop,
            pickupDateTime,
            dropDate,
            serviceId, type,
            status,
        } = req.body;

        // console.log(req.body)

        const enquiry = await Enquiry.findOne({
            where: { enquiryId: id }
        });

        if (!enquiry) {
            res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
            return;
        }

        const pickupConvert = new Date(pickupDateTime);

        console.log("pickupConvert", pickupConvert)
        const dropConvert = dropDate ? new Date(dropDate) : null;

        const updatedEnquiry = await enquiry.update({
            name,
            email,
            phone,
            pickup,
            pickupDateTime: pickupConvert,
            dropDate: dropConvert,
            drop,
            serviceId,
            type: type ?? "Manual",
            status: status ?? "Current",
        });



        res.status(200).json({
            success: true,
            message: "Enquiry updated successfully",
            data: updatedEnquiry,
        });
    } catch (error) {
        console.error("Error updating enquiry:", error);
        res.status(500).json({
            success: false,
            message: "Error updating enquiry",
        });
    }
};

// Delete a enquiry
export const deleteEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const enquiry = await Enquiry.findOne({
            where: { enquiryId: id }
        });

        if (!enquiry) {
            res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
            return;
        }

        await enquiry.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: "Enquiry deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting enquiry:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting enquiry",
        });
    }
};


export const multiDeleteEnquiries = async (req: Request, res: Response): Promise<void> => {
    try {
        const { enquiryIds } = req.body;

        if (!Array.isArray(enquiryIds) || enquiryIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid request: enquiryIds must be an array of enquiry IDs",
            });
            return;
        }

        const enquiries = await Enquiry.findAll({
            where: { enquiryId: enquiryIds }
        });

        if (enquiries.length === 0) {
            res.status(404).json({
                success: false,
                message: "No enquiries found with the provided IDs",
            });
            return;
        }

        await Promise.all(enquiries.map(enquiry => enquiry.destroy({ force: true })));

        res.status(200).json({
            success: true,
            message: "Enquiries deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting enquiries:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting enquiries",
        });
    }
};


export const toggleChanges = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const enquiry = await Enquiry.findOne({
            where: { enquiryId: id }
        });

        if (!enquiry) {
            res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
            return;
        }

        await enquiry.update({ status });

        res.status(200).json({
            success: true,
            message: "Enquiry status updated successfully",
            data: enquiry,
        });
    } catch (error) {
        console.error("Error toggling changes:", error);
        res.status(500).json({
            success: false,
            message: "Error toggling changes",
        });
    }
}

