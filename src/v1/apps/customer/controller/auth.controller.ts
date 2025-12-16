import { Request, Response } from "express";
import { signInToken } from "../../../../common/services/jwt/jwt";
import { Op, Transaction } from "sequelize";
import SMSService from "../../../../common/services/sms/sms";
import { sequelize } from "../../../../common/db/postgres";
import { phoneNumberSchema, customerSignUpSchema } from "../../../../common/validations/customerSchema";
import { debugLogger as debug, infoLog, logger as log } from "../../../../utils/logger";
import { debugLog as newDebug, infoLog as newInfo } from "../../../../utils/logger";
import { Customer } from "../../../core/models/customer";
import { generateReferralCode } from "../../../core/function/referCode";
import { CustomerWallet } from "../../../core/models/customerWallets";
import { CompanyProfile } from "../../../core/models/companyProfile";
import { generateTransactionId } from "../../../core/function/commissionCalculation";
import { CustomerTransaction } from "../../../core/models/customerTransactions";
import dayjs from "dayjs";




const sms = SMSService();



/**
 * Generates a JWT token for the given customer
 * @param {any} adminId - admin id
 * @param {any} customerId - customer id
 * @param {any} name - customer name
 * @return {Promise<void>} Promise that resolves with the JWT token
 */
export const generatedCustomerToken = async (
    adminId: any,
    customerId: any,
    name: any,
): Promise<void> => {
    const userData = {
        adminId,
        id: customerId,
        username: name,
        role: "customer",
    }
    return await signInToken({ userData, adminId });
}


export const customerLogin = async (req: Request, res: Response) => {

    const adminId = req.body.adminId ?? req.query.adminId;
    const { type } = req.params;
    const { phone, otp, smsToken, customerId, fcmToken } = req.body;

    log.info(`[DEBUG] customerLogin HIT. Type: ${type}, Phone: ${phone}`);

    try {

        switch (type.toLowerCase()) {
            case "send":

                const validData = phoneNumberSchema.safeParse({ phoneNo: phone });

                if (!validData.success) {
                    const formattedErrors = validData.error.errors.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    }));

                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: formattedErrors,
                    });
                    return;
                }

                const formattedPhone = `91 ${phone}`;

                const customer = await Customer.findOne({ where: { adminId, phone: formattedPhone } });
                if (!customer) {
                    res.status(404).json({
                        success: false,
                        message: "Customer not found",
                    });
                    return;
                }

                const formattedNumber = phone.toString().replace(/^\+?91|\D/g, "");
                console.log(">>> MANUAL LOG: Sending OTP for mobile:", formattedNumber);
                const token = await sms.sendOtp({
                    mobile: Number(formattedNumber),
                    isOTPSend: true,
                    websiteName: null,
                    sendOtp: null,
                    id: customer.customerId
                });

                if (typeof token === "string") {
                    newDebug("Customer login for following customerId OTP sent successfully", customer.customerId);
                    res.status(200).json({
                        success: true,
                        message: "OTP sent successfully",
                        smsToken: token,
                        customerId: customer.customerId,
                    })
                    return;
                }

                newDebug("Customer login for following customerId OTP sending failed", customer.customerId);
                res.status(500).json({
                    success: false,
                    message: "Failed to send OTP",
                    error: "Internal server error"
                });

                log.info(`Customer login for adminId: ${adminId} and customerId: ${customer.customerId} exit <<$`);
                break;
            case "verify": {
                const { phone, otp, smsToken, accessToken } = req.body;

                if (!accessToken && (!otp || !smsToken)) {
                    res.status(400).json({
                        success: false,
                        message: "OTP and SMS Token are required if Access Token is provided",
                    });
                    return;
                }

                let smsResponse;
                if (accessToken) {
                    smsResponse = await sms.verifyWidgetToken(accessToken);
                } else {
                    smsResponse = await sms.verifyOTP({ otp: otp!, token: smsToken!, mobile: phone });
                }

                if (!smsResponse.success) {
                    debug.info(`Customer login for phone: ${phone} OTP verification failed`);
                    res.status(smsResponse.status).json({
                        success: false,
                        message: smsResponse.message || "Invalid OTP",
                    });
                    return;
                }

                // Logic change: We no longer have 'id' from AES token.
                // We rely on the phone number we just verified.
                const formattedPhone = `91 ${phone}`;
                const customerData = await Customer.findOne({
                    where: {
                        adminId,
                        phone: formattedPhone
                    },
                    attributes: { exclude: ['updatedAt', 'deletedAt'] }
                });


                if (!customerData) {
                    debug.info(`Customer login for not found`);
                    res.status(404).json({
                        success: false,
                        message: "Now this Customer does not exist",
                    });
                    return;
                }

                const authToken = await generatedCustomerToken(customerData.adminId, customerData.customerId, customerData.name);


                if (typeof authToken === "string") customerData.accessToken = authToken;

                // Update FCM Token if provided during login
                if (req.body.fcmToken) {
                    customerData.fcmToken = req.body.fcmToken;
                    await customerData.save();
                }

                res.status(smsResponse.status).json({
                    success: true,
                    message: smsResponse.message || "OTP verified successfully",
                    data: {
                        customer: customerData,
                        token: authToken,
                    }
                })

                log.info(`Customer login for adminId: ${adminId} and customerId: ${customerData.customerId} exit <<$`);
                return;
            }
            case "sdk_login":
                // Login Trusted by Client-Side SDK Verification
                const validSdkData = phoneNumberSchema.safeParse({ phoneNo: phone });

                if (!validSdkData.success) {
                    res.status(400).json({
                        success: false,
                        message: "Invalid phone number",
                    });
                    return;
                }

                // const sdkFormattedPhone = `91 ${phone}`; 
                // Using exact same format as 'send' case
                const sdkFormattedPhone = `91 ${phone}`;

                const sdkCustomer = await Customer.findOne({
                    where: {
                        adminId,
                        phone: sdkFormattedPhone
                    },
                    attributes: { exclude: ['updatedAt', 'deletedAt'] }
                });

                if (!sdkCustomer) {
                    res.status(404).json({
                        success: false,
                        message: "Customer not found. Please sign up first.",
                    });
                    return;
                }

                const sdkAuthToken = await generatedCustomerToken(sdkCustomer.adminId, sdkCustomer.customerId, sdkCustomer.name);

                if (typeof sdkAuthToken === "string") sdkCustomer.accessToken = sdkAuthToken;

                // Update FCM Token if provided
                if (req.body.fcmToken) {
                    sdkCustomer.fcmToken = req.body.fcmToken;
                    await sdkCustomer.save();
                }

                res.status(200).json({
                    success: true,
                    message: "Login successful (SDK Verified)",
                    data: {
                        customer: sdkCustomer,
                        token: sdkAuthToken,
                    }
                });
                return;

            default:
                debug.info(`Customer login for customerId: ${phone} invalid type ${type}`);
                res.status(400).json({
                    success: false,
                    message: "Invalid type",
                });
                return;
        }
    } catch (error) {
        console.log("# Customer login for customer", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
}

export const customerSignup = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const type = req.params.type;


    newInfo(`Customer signup for adminId: ${adminId} and type: ${type} entry $>>`);
    const today = dayjs().toDate();

    try {
        switch (type.toLowerCase()) {
            case "send": {
                const validData = phoneNumberSchema.safeParse(req.body);

                debug.info(`validData ${JSON.stringify(validData)} - send OTP for adminId: ${adminId}`);

                if (!validData.success) {
                    const formattedErrors = validData.error.errors.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    }));

                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: formattedErrors,
                    });
                    return;
                }

                const { phoneNo } = validData.data;

                const dbPhone = `91 ${phoneNo}`;

                debug.info(`Normalized DB phone: ${dbPhone}`);

                const customerData = await Customer.findOne({
                    where: {
                        phone: dbPhone,
                    },
                });

                if (customerData) {
                    res.status(200).json({
                        success: false,
                        message: "You already have an account with us. Please log in to continue.",
                    });
                    return;
                }



                // Uncomment below when using real SMS gateway
                const token = await sms.sendOtp({
                    mobile: Number(phoneNo),
                    isOTPSend: true,
                    websiteName: null,
                    sendOtp: null,
                    id: null
                });

                if (!token) {
                    debug.info(`Customer signup for adminId: ${adminId} - OTP sending failed`);
                    res.status(500).json({
                        success: false,
                        message: "Failed to send OTP",
                        error: "Internal server error",
                    });
                    return;
                }

                debug.info(`Customer signup for adminId: ${adminId} - OTP sent successfully`);
                res.status(200).json({
                    success: true,
                    message: "OTP sent successfully",
                    smsToken: token,
                });
                return;
            }


            case "verify": {
                const validData = customerSignUpSchema.safeParse(req.body);
                const { dob, gender } = req.body;
                debug.info(`validData ${validData} verify OTP for adminId: ${adminId}`);
                if (!validData.success) {
                    const formattedErrors = validData.error.errors.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    }));

                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: formattedErrors,
                    });
                    return;
                }

                const { name, phone, fcmToken, walletAmount = 0, email, otp, smsToken, referralCode, accessToken } = validData.data;

                if (!accessToken && (!otp || !smsToken)) {
                    res.status(400).json({
                        success: false,
                        message: "OTP and SMS Token are required if Access Token is not provided"
                    });
                    return;
                }

                const smsResponse = accessToken
                    ? await sms.verifyWidgetToken(accessToken)
                    : await sms.verifyOTP({ otp: otp!, token: smsToken!, mobile: phone });

                if (!smsResponse.success) {
                    debug.info(`Customer signup for adminId: ${adminId} OTP verification failed`);
                    res.status(smsResponse.status).json({
                        success: false,
                        message: smsResponse.message || "OTP verification failed",
                    });
                    return;
                }

                let customerReferral: any;
                if (referralCode) {
                    customerReferral = await Customer.findOne({
                        where: {
                            adminId,
                            referralCode: referralCode.trim()
                        }
                    });

                    if (!customerReferral) {
                        debug.info(`Customer signup for adminId: ${adminId} referral code not found`);
                        res.status(200).json({
                            success: false,
                            message: "Invalid referral code",
                        });
                        return;
                    }
                }

                const formatPhone = `91 ${phone}`;

                const result = await sequelize.transaction(async (t: Transaction) => {
                    const customer = await Customer.create({
                        adminId,
                        name,
                        phone: formatPhone,
                        email,
                        fcmToken,
                        dob,
                        gender,
                        createdBy: "Admin",
                        isApp: true
                    }, { transaction: t });

                    customer.customerId = `SLTC${phone.slice(5, 10)}${customer.id}`;
                    const { code: referralCodeGenerated } = generateReferralCode({ userId: customer.id });
                    customer.referralCode = referralCodeGenerated;
                    customer.referredBy = customerReferral?.customerId || null;
                    await customer.save({ transaction: t });

                    // 2. Create Customer Wallet
                    const wallet = await CustomerWallet.create({
                        adminId,
                        customerId: customer.customerId,
                        balance: Number(walletAmount),
                        startAmount: Number(walletAmount),
                    }, { transaction: t });

                    wallet.walletId = `cus-wlt-${wallet.id}`;
                    await wallet.save({ transaction: t });

                    customer.walletId = wallet.walletId;
                    await customer.save({ transaction: t });

                    return {
                        customer,
                        wallet
                    };
                });

                console.log("result", result);


                const authToken = await generatedCustomerToken(
                    result.customer.adminId,
                    result.customer.customerId,
                    result.customer.name
                );

                res.status(201).json({
                    success: true,
                    message: "OTP verified and customer created successfully",
                    data: {
                        customer: result.customer,
                        token: authToken,
                    },
                });

                log.info(`Customer signup for adminId: ${adminId} type ${type} exit <<$`);
                return;
            }

            default:
                debug.info(`Customer signup for adminId: ${adminId} type ${type} invalid`);
                res.status(400).json({
                    success: false,
                    message: "Invalid type. Use 'send' or 'verify'.",
                });
                return;
        }

    } catch (error) {
        debug.info(`# Customer signup for adminId: ${adminId} type ${type} error >> ${error}`);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
};
