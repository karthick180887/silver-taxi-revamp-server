import { Request, Response } from "express";
import { encodeToken, signInRefreshToken, decodeToken } from "../../../../common/services/jwt/jwt";
import { Op, Transaction } from "sequelize";
import SMSService from "../../../../common/services/sms/sms";
import {
    DriverWallet, Driver,
    Vehicle, State, City
} from "../../../core/models";
import { sequelize } from "../../../../common/db/postgres";
import { updateWithDocumentStatus } from "../../../core/function/driverFunctions";
import { phoneNumberSchema, signUpSchema, step1Schema, step2Schema, step3Schema, step4Schema } from "../../../../common/validations/driverSchema";
import { debugLogger as debug, infoLogger as log } from "../../../../utils/logger";
import { generateReferralCode } from "../../../core/function/referCode";

const sms = SMSService();

/**
 * Generates a JWT token for the given driver
 * @param {any} adminId - admin id
 * @param {any} driverId - driver id
 * @param {any} name - driver name
 * @return {Promise<void>} Promise that resolves with the JWT token
 */
export const generatedDriverToken = async (
    adminId: any,
    driverId: any,
    name: any,
): Promise<void> => {
    const userData = {
        adminId,
        id: driverId,
        username: name,
        role: "driver",
    }
    return await encodeToken({ userData, adminId });
}

export const generatedDriverRefreshToken = async (
    adminId: any,
    driverId: any,
    name: any,
): Promise<void> => {
    const userData = {
        adminId,
        refreshId: driverId,
        username: name,
        role: "driver",
    }

    return await signInRefreshToken(userData, 21 * 24 * 60 * 60);
}

export const accessToken = async (req: Request, res: Response) => {

    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(400).json({
            success: false,
            message: "Refresh token is required",
        });
        return;
    }

    try {
        const data = decodeToken(refreshToken);

        // debug.info(`Access token get ${JSON.stringify(data)}`);

        const { adminId, refreshId: driverId, username } = data;
        console.log(adminId, driverId, username);

        if (!adminId || !driverId || !username) {
            res.status(400).json({
                success: false,
                message: "Invalid refresh token",
            });
            return;
        }

        const accessToken = await generatedDriverToken(adminId, driverId, username);

        res.status(200).json({
            success: true,
            message: "Access token generated successfully",
            data: {
                token: accessToken
            },
        });

    } catch (error: any) {

        console.error("Error getting access token:", error);

        const isJwtError = error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError';
        res.status(isJwtError ? 401 : 500).json({
            success: false,
            message: isJwtError ? "Invalid or expired refresh token" : "Error getting access token",
            error: error.message,
        });
        return;
    }
}

export const driverStatus = async (req: Request, res: Response): Promise<void> => {

    const adminId = req.body.adminId ?? req.query.adminId;

    const { id } = req.params;

    log.info(`Driver status for adminId: ${adminId} and driverId: ${id} entry $>>`);

    if (!id) {
        res.status(400).json({
            success: false,
            message: "Driver id is required",
        });
        return;
    }
    try {
        const driver = await Driver.findOne({
            where: {
                driverId: id,
                adminId,
            },
            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
            include: [
                {
                    model: Vehicle,
                    as: "vehicle",
                    attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                },

            ]
        });

        if (!driver) {
            debug.info(`Driver status for adminId: ${adminId} and driverId: ${id} not found`);
            res.status(404).json({
                success: false,
                message: "Driver not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Driver found",
            data: driver
        });

        log.info(`Driver status for adminId: ${adminId} and driverId: ${id} exit <<$`);

    } catch (error) {
        debug.info(`# Driver status for adminId: ${adminId} and driverId: ${id} error`, error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: (error as Error)
        });
    }
}

export const driverLogin = async (req: Request, res: Response): Promise<void> => {

    const adminId = req.body.adminId ?? req.query.adminId;
    const { type } = req.params;
    const { phone, otp, smsToken, driverId } = req.body;

    log.info(`Driver login for adminId: ${adminId} and driverId: ${driverId} entry $>>`);

    try {
        switch (type.toLowerCase()) {
            case "send":
                const sendWhere: any = { phone };
                if (adminId) sendWhere.adminId = adminId;

                const driver = await Driver.findOne({ where: sendWhere });
                if (!driver) {
                    res.status(404).json({
                        success: false,
                        message: "Driver not found",
                    });
                    return;
                }

                // if (driver.onRide) {
                //     res.status(400).json({
                //         success: false,
                //         message: 'Driver is currently on a ride, please try again later',
                //     });
                //     return;
                // }

                if (driver.isActive === false && driver.adminVerified === "Approved") {
                    res.status(400).json({
                        success: false,
                        message: 'Your account is inactive. Please contact the admin for further assistance',
                    });
                    return;
                }


                const formattedNumber = Number(phone.toString().replace(/^\+?91|\D/g, ""));
                const token = await sms.sendOtp({
                    mobile: formattedNumber,
                    isOTPSend: true,
                    websiteName: null,
                    sendOtp: null,
                    id: driver.driverId
                });

                if (typeof token === "string") {
                    debug.info(`Driver login for driverId: ${driverId} OTP sent successfully`);
                    res.status(200).json({
                        success: true,
                        message: "OTP sent successfully",
                        smsToken: token,
                        driverId: driver.driverId,
                    })
                    return;
                }

                debug.info(`Driver login for driverId: ${driverId} OTP sending failed`);
                res.status(500).json({
                    success: false,
                    message: "Failed to send OTP",
                    error: "Internal server error"
                });

                log.info(`Driver login for adminId: ${adminId} and driverId: ${driverId} exit <<$`);
                break;
            case "verify":
                const smsResponse = await sms.verifyOTP({
                    otp,
                    token: smsToken
                });

                if (!smsResponse.success) {
                    debug.info(`Driver login for driverId: ${driverId} OTP verification failed`);
                    res.status(smsResponse.status).json({
                        success: false,
                        message: smsResponse.message || "Invalid OTP",
                    });
                    return;
                }

                const id = driverId || smsResponse.id;

                const verifyWhere: any = { driverId: id };
                if (adminId) verifyWhere.adminId = adminId;

                const driverData = await Driver.findOne({
                    where: verifyWhere,
                    attributes: { exclude: ['updatedAt', 'deletedAt'] },
                    include: [
                        {
                            model: Vehicle,
                            as: "vehicle",
                            attributes: { exclude: ['id', 'updatedAt', 'deletedAt'] },
                        },
                    ]
                });

                if (!driverData) {
                    debug.info(`Driver login for driverId: ${driverId} not found`);
                    res.status(404).json({
                        success: false,
                        message: "Now this Driver does not exist",
                    });
                    return;
                }

                const authToken = await generatedDriverToken(driverData.adminId, driverData.driverId, driverData.name);
                const refreshToken = await generatedDriverRefreshToken(driverData.adminId, driverData.driverId, driverData.name);
                console.log("auth Token >> ", authToken, " \n refresh token >> ", refreshToken);

                if (typeof authToken === "string") driverData.accessToken = authToken;
                if (typeof refreshToken === "string") driverData.refreshToken = refreshToken;

                // Update FCM Token if provided during login
                if (req.body.fcmToken) {
                    driverData.fcmToken = req.body.fcmToken;
                    await driverData.save();
                    debug.info(`Driver login for driverId: ${driverId} FCM Token updated`);
                }

                res.status(smsResponse.status).json({
                    success: true,
                    message: smsResponse.message || "OTP verified successfully",
                    data: {
                        driver: driverData,
                        token: authToken,
                        refreshToken: refreshToken
                    }
                })

                log.info(`Driver login for adminId: ${adminId} and driverId: ${driverId} exit <<$`);
                return;
            default:
                debug.info(`Driver login for driverId: ${driverId} invalid type ${type}`);
                res.status(400).json({
                    success: false,
                    message: "Invalid type",
                });
                return;
        }
    } catch (error) {
        debug.info(`# Driver login for driverId: ${driverId} error`, error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
}

export const driverSignup = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.body.adminId ?? req.query.adminId;
    const type = req.params.type;

    log.info(`Driver signup for adminId: ${adminId} and type: ${type} entry $>>`);

    try {
        switch (type.toLowerCase()) {
            case "send": {
                const validData = phoneNumberSchema.safeParse(req.body);
                debug.info(`validData ${validData} send OTP for adminId: ${adminId}`);
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
                const formattedNumber = Number(phoneNo.toString().replace(/^\+?91|\D/g, ""));
                const token = await sms.sendOtp({
                    mobile: formattedNumber,
                    isOTPSend: true,
                    websiteName: null,
                    sendOtp: null,
                    id: null
                });
                if (!token) {
                    debug.info(`Driver signup for adminId: ${adminId} OTP sending failed`);
                    res.status(500).json({
                        success: false,
                        message: "Failed to send OTP",
                        error: "Internal server error"
                    });
                    return;
                }
                if (typeof token === "string") {
                    debug.info(`Driver signup for adminId: ${adminId} OTP sent successfully`);
                    res.status(200).json({
                        success: true,
                        message: "OTP sent successfully",
                        smsToken: token
                    });
                    return;
                }

                debug.info(`Driver signup for adminId: ${adminId} OTP sending failed`);
                res.status(500).json({
                    success: false,
                    message: "Failed to send OTP",
                });
                log.info(`Driver signup for adminId: ${adminId} type ${type} exit <<$`);
                return;
            }

            case "verify": {
                const validData = signUpSchema.safeParse(req.body);
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

                const { name, phone, email, walletAmount = 0, fcmToken, otp, smsToken } = validData.data;

                const smsResponse = await sms.verifyOTP({ otp, token: smsToken });

                if (!smsResponse.success) {
                    debug.info(`Driver signup for adminId: ${adminId} OTP verification failed`);
                    res.status(smsResponse.status).json({
                        success: false,
                        message: smsResponse.message || "OTP verification failed",
                    });
                    return;
                }

                const checkDriver = await Driver.findOne({
                    where: {
                        adminId,
                        phone,
                    },
                    paranoid: false
                });

                if (checkDriver) {
                    if (checkDriver.deletedAt !== null) {
                        debug.info(`Driver signup for adminId: ${adminId} driver already deleted`);
                        res.status(200).json({
                            success: false,
                            message: "Driver was previously deleted. Please contact admin.",
                        });
                        return;
                    }

                    debug.info(`Driver signup for adminId: ${adminId} driver already exists`);
                    res.status(200).json({
                        success: false,
                        message: "Driver already exists",
                    });
                    return;
                }


                const createdBy: "Vendor" | "Admin" | "Driver" = "Driver";

                const result = await sequelize.transaction(async (t: Transaction) => {
                    const driver = await Driver.create({
                        adminId,
                        name,
                        phone: phone.trim(),
                        email: undefined,
                        fcmToken,
                        isActive: false,
                        adminVerified: 'Pending',
                        createdBy,
                    }, { transaction: t });

                    driver.driverId = `SLTD${phone.slice(5, 10)}${driver.id}`;
                    const { code: referralCodeGenerated } = generateReferralCode({ userId: driver.id });
                    driver.referralCode = referralCodeGenerated;
                    await driver.save({ transaction: t });

                    const wallet = await DriverWallet.create({
                        adminId,
                        driverId: driver.driverId,
                        balance: Number(walletAmount),
                        startAmount: Number(walletAmount),
                    }, { transaction: t });

                    wallet.walletId = `drv-wlt-${wallet.id}`;
                    await wallet.save({ transaction: t });

                    driver.walletId = wallet.walletId;
                    await driver.save({ transaction: t });

                    return { driver, wallet };
                });

                const authToken = await generatedDriverToken(
                    result.driver.adminId,
                    result.driver.driverId,
                    result.driver.name
                );

                res.status(201).json({
                    success: true,
                    message: "OTP verified and driver created successfully",
                    data: {
                        driver: result.driver,
                        wallet: result.wallet,
                        token: authToken,
                    },
                });

                log.info(`Driver signup for adminId: ${adminId} type ${type} exit <<$`);
                return;
            }

            default:
                debug.info(`Driver signup for adminId: ${adminId} type ${type} invalid`);
                res.status(400).json({
                    success: false,
                    message: "Invalid type. Use 'send' or 'verify'.",
                });
                return;
        }

    } catch (error) {
        debug.info(`# Driver signup for adminId: ${adminId} type ${type} error >> ${error}`);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
};


export const driverSignupSteps = async (req: Request, res: Response): Promise<void> => {

    const adminId = req.body.adminId ?? req.query.adminId;;
    const driverId = req.body.driverId ?? req.query.driverId;
    const { step } = req.params;
    const vehicleId = req.body.vehicleId;

    const driverDocFields = [
        "driverImageUrl", "aadharImageFront", "aadharImageBack",
        "panCardImage", "licenseImageFront", "licenseImageBack", "licenseValidity"
    ];

    const vehicleDocFields = [
        "vehicleId",
        "rcBookImageFront", "rcBookImageBack", "rcExpiryDate",
        "insuranceImage", "insuranceExpiryDate",
        "pollutionImage", "pollutionExpiryDate"
    ];

    log.info(`Driver signup for adminId: ${adminId} step ${step} entry >>`);
    try {
        switch (step.toString()) {
            case "1": {
                if (!driverId) {
                    res.status(401).json({
                        success: false,
                        message: "Driver ID is required"
                    });
                    return;
                }

                const driver = await Driver.findOne({ where: { adminId, driverId } });
                if (!driver) {
                    res.status(404).json({
                        success: false,
                        message: "Driver not found"
                    });
                    return;
                }


                const allowedFields = ["name", "phone", "address", "gender", "dateOfBirth", "state", "city", "pinCode"];
                const incomingData = allowedFields.reduce((acc, key) => {
                    if (req.body[key] !== undefined) acc[key] = req.body[key];
                    return acc;
                }, {} as any);


                const schema = driver.isUpdated ? step1Schema.partial() : step1Schema;
                const validation = schema.safeParse(incomingData);
                // const validation = step1Schema.safeParse(incomingData);
                if (!validation.success) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: validation.error.errors.map(err => ({ field: err.path.join("."), message: err.message }))
                    });
                    return;
                }

                if (!driver.isUpdated) {
                    await driver.update(incomingData);
                } else {
                    updateWithDocumentStatus(driver, incomingData, allowedFields);
                    driver.profileVerified = "pending";
                    await driver.save();
                }

                res.status(200).json({ success: true, message: "Driver basic info processed", data: driver });
                log.info(`Driver signup for adminId: ${adminId} step ${step} exit <<`);
                return;
            }

            case "2": {
                if (!driverId) {
                    res.status(401).json({
                        success: false,
                        message: "Driver ID is required"
                    });
                    return;
                }

                const allowedFields = ["vehicleName", "vehicleType", "vehicleNumber", "vehicleYear", "fuelType"];

                const incomingData = allowedFields.reduce((acc, key) => {
                    if (req.body[key] !== undefined) acc[key] = req.body[key];
                    return acc;
                }, {} as any);

                const vehicle = await Vehicle.findOne({ where: { adminId, driverId } });

                if (!vehicle) {

                    const validation = step2Schema.safeParse(incomingData);
                    if (!validation.success) {
                        res.status(400).json({
                            success: false,
                            message: "Validation error",
                            errors: validation.error.errors.map(err => ({ field: err.path.join("."), message: err.message }))
                        });
                        return;
                    }

                    const createVehicle = await Vehicle.create({
                        adminId,
                        driverId,
                        isActive: true,
                        isAdminVehicle: false,
                        name: incomingData.vehicleName,
                        type: incomingData.vehicleType,
                        vehicleNumber: incomingData.vehicleNumber,
                        vehicleYear: incomingData.vehicleYear,
                        fuelType: incomingData.fuelType
                    })

                    createVehicle.vehicleId = `veh-${createVehicle.id}`;
                    await createVehicle.save();
                    res.status(200).json({
                        success: true,
                        message: "Vehicle created successfully",
                        data: createVehicle
                    });
                    return;
                }


                const schema = vehicle.isUpdated ? step2Schema.partial() : step2Schema;
                const validation = schema.safeParse(incomingData);
                // const validation = step2Schema.safeParse(incomingData);
                if (!validation.success) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: validation.error.errors.map(err => ({ field: err.path.join("."), message: err.message }))
                    });
                    return;
                }

                if (!vehicle.isUpdated) {
                    await vehicle.update(incomingData);
                } else {
                    updateWithDocumentStatus(vehicle, incomingData, allowedFields);
                    vehicle.profileVerified = "pending";
                    await vehicle.save();
                }

                res.status(200).json({
                    success: true,
                    message: "Vehicle info processed",
                    data: vehicle
                });
                log.info(`Driver signup for adminId: ${adminId} step ${step} exit <<`);
                return;
            }

            case "3": {
                if (!driverId) {
                    res.status(401).json({
                        success: false,
                        message: "Driver ID is required"
                    });
                    return;
                }

                const driver = await Driver.findOne({ where: { adminId, driverId } });
                if (!driver) {
                    res.status(404).json({
                        success: false,
                        message: "Driver not found"
                    });
                    return;
                }

                const incomingData = driverDocFields.reduce((acc, key) => {
                    if (req.body[key] !== undefined) acc[key] = req.body[key];
                    return acc;
                }, {} as any);

                console.log("step 3 Data", incomingData);

                const schema = driver.isUpdated ? step3Schema.partial() : step3Schema;
                const validation = schema.safeParse(incomingData);

                // const validation = step3Schema.safeParse({ ...incomingData });
                if (!validation.success) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: validation.error.errors.map(err => ({ field: err.path.join("."), message: err.message }))
                    });

                    return;
                }

                if (!driver.isUpdated) {
                    await driver.update({ ...incomingData, documentUploaded: true });
                } else {
                    updateWithDocumentStatus(driver, incomingData, driverDocFields, true);
                    driver.documentVerified = "pending";
                    await driver.save();
                }

                res.status(200).json({
                    success: true,
                    message: "Driver documents processed",
                    data: driver
                });
                log.info(`Driver signup for adminId: ${adminId} step ${step} exit <<`);
                return;
            }

            case "4": {
                if (!driverId) {
                    res.status(401).json({
                        success: false,
                        message: "Driver ID are required"
                    });
                    return;
                }

                const vehicle = await Vehicle.findOne({ where: { adminId, vehicleId, driverId } });
                if (!vehicle) {
                    res.status(404).json({
                        success: false,
                        message: "Vehicle not found"
                    });
                    return;
                }

                const incomingData = vehicleDocFields.reduce((acc, key) => {
                    if (req.body[key] !== undefined) acc[key] = req.body[key];
                    return acc;
                }, {} as any);

                console.log("step 4 Data", incomingData);

                const schema = vehicle.isUpdated ? step4Schema.partial() : step4Schema;
                const validation = schema.safeParse(incomingData);

                // const validation = step4Schema.safeParse({ vehicleId, ...incomingData });
                if (!validation.success) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: validation.error.errors.map(err => ({ field: err.path.join("."), message: err.message }))
                    });

                    console.log(validation.error.errors.map(err => ({
                        field: err.path.join("."),
                        message: err.message
                    })));
                    return;
                }

                if (!vehicle.isUpdated) {
                    await vehicle.update({ ...incomingData, documentUploaded: true });
                } else {
                    updateWithDocumentStatus(vehicle, incomingData, vehicleDocFields, true);
                    vehicle.documentVerified = "pending";
                    await vehicle.save();
                }

                res.status(200).json({
                    success: true,
                    message: "Vehicle documents processed",
                    data: vehicle
                });
                log.info(`Driver signup for adminId: ${adminId} step ${step} exit <<`);
                return;
            }

            default:
                debug.info(`Driver signup for adminId: ${adminId} step ${step} invalid`);
                res.status(400).json({
                    success: false,
                    message: "Invalid step"
                });
        }
    } catch (error) {
        debug.info(`Driver signup for adminId: ${adminId} step ${step} error: ${error}`);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
};

export const getAllStates = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string | undefined;

        let states: any = null;

        if (search && search.length === 2) {
            states = await State.findAll({
                where: {
                    status: true,
                    ...(search && {
                        name: {
                            [Op.iLike]: `%${search}%`, // Case-insensitive match for PostgreSQL
                        },
                    }),
                },
                attributes: ['stateId', 'name', 'code'],
                order: [['name', 'ASC']],
            });
        } else {
            states = await State.findAll({
                where: { status: true },
                attributes: ['stateId', 'name', 'code'],
                order: [['name', 'ASC']],
            });
        }

        res.status(200).json({
            success: true,
            message: "States fetched successfully",
            data: states
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: (err as Error).message
        });
    }
};



export const getCities = async (req: Request, res: Response) => {
    try {
        const stateId = req.query.stateId as string | undefined;
        const search = req.query.search as string | undefined;
        console.log("stateId", stateId);
        console.log("search", search);


        let cities: any[] = [];
        if (!stateId) {
            cities = await City.findAll({
                where: {
                    status: true,
                    ...(search && {
                        name: {
                            [Op.iLike]: `%${search}%`, // Case-insensitive match for PostgreSQL
                        },
                    }),
                },
                attributes: ['cityId', 'name', 'pinCode'],
                order: [['name', 'ASC']],
            });
        }
        else {
            cities = await City.findAll({
                where: {
                    status: true,
                    stateId,
                },
                attributes: ['cityId', 'name', 'pinCode'],
                order: [['name', 'ASC']],
            });
        }

        res.status(200).json({
            success: true,
            message: "Cities fetched successfully",
            data: cities
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: (err as Error).message
        });
    }
};
