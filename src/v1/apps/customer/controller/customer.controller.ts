import { Response, Request } from "express";
import { Customer } from "../../../core/models/customer";
import { TopDestinations } from "../../../core/models/topDestinations";
import SMSService from "../../../../common/services/sms/sms";
import { CompanyProfile } from "../../../core/models/companyProfile";


const sms = SMSService();



export const getCustomerDetails = async (req: Request, res: Response) => {

    const adminId = req.query.adminId ?? req.body.adminId;
    const customerId = req.query.customerId ?? req.body.customerId;

    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Customer id is required",
        });
        return;
    }

    const customer = await Customer.findOne({
        where: { customerId, adminId },
        attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] }
    });

    res.status(200).json({
        success: true,
        message: "Customer details fetched successfully",
        data: customer
    });
    return;
}


export const getAdminDetails = async (req: Request, res: Response) => {

    const adminId = req.query.adminId ?? req.body.adminId;
    const customerId = req.query.customerId ?? req.body.customerId;

    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Customer id is required",
        });
        return;
    }

    const profile = await CompanyProfile.findOne({
        where: { adminId },
        attributes: {
            exclude: [
                'id', 'updatedAt',
                'deletedAt', 'driverWalletAmount',
                'vendorId', 'vendorWalletAmount',
                'customerReferral', 'vendorReferral', 'driverReferral',
                'companyCommission', 'companyCommissionPercentage', 'createdAt',
                'taxCommissionPercentage', 'createdBy'
            ]
        }
    });


    res.status(200).json({
        success: true,
        message: "Admin details fetched successfully",
        data: profile
    });
    return;
}


export const getTopDestinations = async (req: Request, res: Response) => {
    const adminId = req.query.adminId ?? req.body.adminId;
    const customerId = req.query.customerId ?? req.body.customerId;
    const fromCity = req.query.fromCity ?? req.body.fromCity;

    try {

        if (!customerId) {
            res.status(404).json({
                success: false,
                message: "Customer ID is required"
            })
            return;
        };


        if (!fromCity) {
            res.status(404).json({
                success: false,
                message: "From city is required"
            })
            return;
        };

        const destinations = await TopDestinations.findAll({
            where: {
                fromCity: fromCity.toLowerCase().trim(),
                adminId
            },
            attributes: {
                exclude: ["id", "createdAt", "updatedAt", "deletedAt"]
            }
        })

        if (!destinations) {
            res.status(404).json({
                success: false,
                message: "No destinations found for given city"
            })
        }

        res.status(200).json({
            success: true,
            message: "Destinations fetched successfully",
            data: destinations
        });
    }
    catch (error) {
        console.error("Error fetching destinations:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
        return;
    }





}

export const getReferCodeandWallet = async (req: Request, res: Response) => {
    const adminId = req.query.adminId ?? req.body.adminId;
    const customerId = req.query.customerId ?? req.body.customerId;

    try {
        if (!customerId) {
            res.status(404).json({
                success: false,
                message: "Customer Id id required"
            });
            return;
        }

        const customer = await Customer.findOne({
            where: {
                adminId,
                customerId,

            },
            include: [
                'referCode',
            ]

        })
    }
    catch (err) {

    }
}


export const fcmTokenUpdate = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const customerId = req.body.customerId ?? req.query.customerId;
    const { fcmToken } = req.body

    if (!customerId) {
        res.status(401).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }

    try {
        const customer = await Customer.findOne({
            where: { customerId },
        });

        if (!fcmToken) {
            res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
            return;
        }

        if (!customer) {
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        customer.fcmToken = fcmToken;
        await customer.save();
        res.status(200).json({
            success: true,
            message: "FCM token updated successfully",
            data: customer,
        });

    } catch (error) {
        console.error("Error updating FCM token:", error);
        res.status(500).json({
            success: false,
            message: "Error updating FCM token",
            error,
        });
        return;
    }
}



export const updateProfile = async (req: Request, res: Response) => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const customerId = req.body.customerId ?? req.query.customerId;
    const {
        name,
        gender,
        dob,
        email,
        phone,
        otp,
        smsToken,
    } = req.body;

    try {
        if (!customerId) {
            res.status(400).json({
                success: false,
                message: "Customer ID is required",
            });
            return;
        }

        const customer = await Customer.findOne({ where: { customerId, adminId } });

        if (!customer) {
            res.status(404).json({
                success: false,
                message: "Customer not found",
            });
            return;
        }

        const existingCustomer = await Customer.findOne({
            where: {
                adminId,
                phone: `91 ${phone}`,
            },
        });
        console.log("phone", phone);

        console.log("existingCustomer", existingCustomer);

        if (existingCustomer && existingCustomer.customerId !== customer.customerId) {
            res.status(200).json({
                success: false,
                message: "Phone number already in use. Try another number.",
            });
            return;
        }

        const formattedNewPhone = phone ? `91 ${phone}` : null;
        const isPhoneChanged = formattedNewPhone && formattedNewPhone !== customer.phone;

        if (formattedNewPhone && formattedNewPhone === customer.phone) {
            res.status(400).json({
                success: false,
                message: "You are already using this phone number",
            });
            return;
        }

        if (isPhoneChanged && (!otp || !smsToken)) {
            const formattedNumber = phone.replace(/^\+?91|\D/g, "");
            const token = await sms.sendOtp({
                mobile: Number(formattedNumber),
                isOTPSend: true,
                websiteName: null,
                sendOtp: null,
                id: customer.customerId,
            });

            if (typeof token === "string") {
                res.status(200).json({
                    success: true,
                    message: "OTP sent successfully",
                    smsToken: token,
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: "Failed to send OTP",
            });
            return;
        }

        if (otp && smsToken) {
            if (!phone) {
                res.status(400).json({
                    success: false,
                    message: "Phone number is required for OTP verification",
                });
                return;
            }

            const smsResponse = await sms.verifyOTP({ otp, token: smsToken, mobile: phone });

            if (!smsResponse.success) {
                res.status(401).json({
                    success: false,
                    message: smsResponse.message || "Invalid OTP",
                });
                return;
            }

            // OTP success — update phone and other fields
            customer.phone = formattedNewPhone ?? phone;
            customer.name = name ?? customer.name;
            customer.gender = gender ?? customer.gender;
            customer.dob = dob ?? customer.dob;
            customer.email = email ?? customer.email;

            await customer.save();

            res.status(200).json({
                success: true,
                message: "Phone and profile updated successfully",
                data: {
                    customerId: customer.customerId,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    gender: customer.gender,
                    dob: customer.dob,
                },
            });
            return;
        }

        // ✅ Case: No phone involved — update only other fields
        if (!phone) {
            customer.name = name ?? customer.name;
            customer.gender = gender ?? customer.gender;
            customer.dob = dob ?? customer.dob;
            customer.email = email ?? customer.email;

            await customer.save();

            res.status(200).json({
                success: true,
                message: "Customer profile updated successfully",
                data: {
                    customerId: customer.customerId,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    gender: customer.gender,
                    dob: customer.dob,
                },
            });
            return;
        }

        // If phone is present with otp+token already handled above, no fallback needed here.

    } catch (error) {
        console.error("Error updating customer profile:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
        return;
    }
};


