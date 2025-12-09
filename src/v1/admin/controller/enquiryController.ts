import { Request, Response } from "express";
import { Enquiry, Service } from "../../core/models";
import { sendNotification } from "../../../common/services/socket/websocket";
import { createNotification } from "../../core/function/notificationCreate";
import { QueryParams } from "../../../common/types/global.types";
import { Op } from "sequelize";
import dayjs from "../../../utils/dayjs";
import { capitalizeFirstLetter } from "../../core/function/objectArrays";

// Get all enquires
export const getAllEnquiries = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const {
            page = 1,
            limit = 25,
            search = '',
            status = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        }: QueryParams = req.query;

        if (!adminId) {
            res.status(400).json({
                success: false,
                message: "adminId is required in Enquiry",
            });
            return;
        }

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause: any = { adminId };

        // Add status filter if provided
        if (status) {
            whereClause.status = status;
        }

        // Build search conditions
        const searchConditions: any[] = [];
        if (search) {
            searchConditions.push(
                { enquiryId: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { serviceId: { [Op.iLike]: `%${search}%` } },
            );
            const types = ['website', 'app', 'manual'];
            if (types.includes(search.toLowerCase())) {
                searchConditions.push({ type: { [Op.eq]: capitalizeFirstLetter(search) } });
            }
        }

        // Add search conditions to where clause if they exist
        if (searchConditions.length > 0) {
            whereClause[Op.or] = searchConditions;
        }
        const baseWhereClause = { ...whereClause };
        delete baseWhereClause.status;

        // Define sort order mapping
        const order: any[] = [];
        order.push([sortBy, sortOrder]);

        const [criticalResults, countResults] = await Promise.all([
            Promise.all([
                Enquiry.findAll({
                    where: whereClause,
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                    include: {
                        model: Service,
                        as: 'services',
                        attributes: ['serviceId', 'name'],
                    },
                    order,
                    limit: parseInt(limit as any),
                    offset: offset
                }),
                Enquiry.count({ where: baseWhereClause })

            ]),
            Promise.allSettled([
                // Enquiry Total Count
                Enquiry.count({ where: baseWhereClause }),
                // Enquiry Current Count
                Enquiry.count({
                    where: {
                        ...baseWhereClause, createdAt: {
                            [Op.gte]: dayjs().startOf('day').toDate(),
                            [Op.lte]: dayjs().endOf('day').toDate()
                        }
                    }
                }),
                // Enquiry Website Count
                Enquiry.count({ where: { ...baseWhereClause, type: 'Website' } }), ,
            ])
        ]);

        const [enquires, count] = criticalResults;

        const enquiriesCount = {
            total: countResults[0].status === 'fulfilled' ? countResults[0].value : 0,
            today: countResults[1].status === 'fulfilled' ? countResults[1].value : 0,
            website: countResults[2].status === 'fulfilled' ? countResults[2].value : 0,
        }

        const totalPages = Math.ceil(count / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        res.status(200).json({
            success: true,
            message: "Enquires retrieved successfully",
            data: {
                enquires,
                enquiriesCount,
                pagination: {
                    currentPage: parseInt(page as any),
                    totalPages,
                    totalCount: count,
                    hasNext,
                    hasPrev,
                    limit: parseInt(limit as any)
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

