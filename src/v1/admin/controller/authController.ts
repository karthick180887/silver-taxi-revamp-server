import { Response, Request } from "express";
import bcrypt from "bcrypt"
import { encodeToken } from "../../../common/services/jwt/jwt";
import { Admin, Vendor, ConfigKeys } from "../../../v1/core/models";
import { Op } from "sequelize";
import { decryptKey, encryptKey } from "../../../utils/cryptoJs";
import { setConfigKey } from "../../../common/services/node-cache";
import { refreshRazorpayKeys } from "../../../common/configs/razorpay";


export const generatedVendorToken = async (
    vendorId: any,
    name: any,
    adminId: any,
): Promise<void> => {
    const userData = {
        id: vendorId,
        username: name,
        role: "vendor",
    }
    return await encodeToken({ userData, adminId });
}

export const generatedAdminToken = async (
    adminId: any,
    name: any,
): Promise<void> => {
    const userData = {
        id: adminId,
        username: name,
        role: "admin",
    }
    return await encodeToken({ userData, adminId });
}

export const SignUp = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name, email, phone,
            password, adminId, role, domain } = req.body;

        let newUser;
        let hashPassword;

        switch (role) {
            case "0":
                hashPassword = await bcrypt.hash(password, 10);
                newUser = await Admin.findOne({ where: { email } });

                if (newUser) {
                    res.status(403).json({
                        success: false,
                        message: "User already exists",
                    });
                }

                const createAdmin = await Admin.create({
                    name,
                    email,
                    phone,
                    password: hashPassword,
                    domain,
                    role: "admin",
                });

                const admin = await createAdmin.update({ adminId: `admin-${createAdmin.id}` });
                await admin.save();

                res.status(200).json({
                    success: true,
                    message: "Admin created successfully",
                    data: admin,
                });
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid role",
                });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
}

export const vendorSignIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, phone, password } = req.body;

        const vendor = await Vendor.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { phone }
                ],
                isLogin: true
            }
        });

        if (!vendor || !bcrypt.compareSync(password, vendor.password)) {
            res.status(404).json({
                success: false,
                message: "Invalid user details",
            });
            return;
        }

        const admin = await Admin.findOne({ where: { adminId: vendor?.adminId } });

        if (!admin) {
            res.status(404).json({
                success: false,
                message: "Admin not found",
            });
            return;
        }

        const token = await generatedVendorToken(vendor?.vendorId, vendor?.name, vendor?.adminId);

        res.json({
            success: true,
            message: "Vendor signed in successfully",
            data: {
                token,
                role: "vendor",
                user: vendor.name,
                adminId: vendor.adminId, // Added
                vendorId: vendor.vendorId, // Added
                id: vendor.id, // Added
                email: vendor.email,
                permission: ["vendor_access"]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export const adminSignIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, phone, password } = req.body;

        let admin = await Admin.findOne({
            where:
            {
                [Op.or]: [
                    { email },
                    { phone }
                ]

            }
        });

        if (!admin || !bcrypt.compareSync(password, admin.password)) {
            res.status(404).json({
                success: false,
                message: "Invalid user details",
            });
            return;
        }

        const token = await generatedAdminToken(admin?.adminId, admin?.name);

        res.json({
            success: true,
            message: "Admin signed in successfully",
            data: {
                token,
                user: admin.name,
                adminId: admin.adminId, // Added
                id: admin.id, // Added
                email: admin.email,
                role: "admin",
                permission: ["admin_access"]
            }
        });
    } catch (error: any) {
        console.error("Admin Sign In Error Details:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
            stack: error.stack
        });
    }
}

export const signIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, phone, password } = req.body;

        console.log("signIn called with email:", email, "phone:", phone, "password:", password);

        const vendor = await Vendor.findOne({
            where:
            {
                [Op.or]: [
                    { email },
                    { phone }
                ]
            }
        });

        if (!vendor) {
            const admin = await Admin.findOne({
                where:
                {
                    [Op.or]: [
                        { email },
                        { phone }
                    ]

                }
            });

            if (!admin) {
                res.status(404).json({
                    success: false,
                    message: "Invalid user details",
                });
                return;
            }

            if (!bcrypt.compareSync(password, admin.password)) {
                res.status(404).json({
                    success: false,
                    message: "Invalid user credentials",
                });
                return;
            }

            const token = await generatedAdminToken(admin.adminId, admin.name);

            res.json({
                success: true,
                message: "Admin signed in successfully",
                data: {
                    token,
                    user: admin.name,
                    adminId: admin.adminId, // Added adminId
                    id: admin.id, // Added id
                    email: admin.email,
                    role: "admin",
                    permission: ["admin_access"]
                }
            });
            return;
        }

        if (vendor.isLogin === false) {
            res.status(400).json({
                success: false,
                message: "login permission denied call admin",
            });
            return;
        }

        if (!bcrypt.compareSync(password, vendor.password)) {
            res.status(404).json({
                success: false,
                message: "Invalid user credentials",
            });
            return;
        }

        const token = await generatedVendorToken(vendor?.vendorId, vendor?.name, vendor?.adminId);

        res.status(200).json({
            success: true,
            message: "Vendor signed in successfully",
            data: {
                token,
                role: "vendor",
                user: vendor.name,
                adminId: vendor.adminId, // Added
                vendorId: vendor.vendorId, // Added
                id: vendor.id, // Added
                email: vendor.email,
                permission: ["vendor_access"]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export const getAllConfigKeys = async (req: Request, res: Response): Promise<void> => {
    try {
        const keys = await ConfigKeys.findAll({ where: { status: true } });

        const decrypted = keys.map(k => ({
            id: k.id,
            keyName: k.keyName,
            keyValue: decryptKey(k.keyValue),
            isPublic: k.isPublic,
            description: k.description,
        }));

        res.status(200).json({
            success: true,
            message: "Keys fetch successfully",
            data: decrypted,
        });
    } catch (error) {
        console.error("Error storing config keys:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const storeConfigKeys = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.adminId ?? req.query.adminId;
        const { keys } = req.body;

        if (!keys || !Array.isArray(keys)) {
            res.status(400).json({
                success: false,
                message: "Keys must be an array"
            });
            return;
        }

        // Encrypt each key before storing
        const encryptedKeys = keys.map(k => ({
            keyName: String(k.keyName).toLowerCase(),
            keyValue: encryptKey(k.keyValue),
            isPublic: k.isPublic ?? true,
            description: k.description ?? null,
            adminId: adminId,
            status: true,
        }));

        // Bulk insert/update
        await ConfigKeys.bulkCreate(encryptedKeys, {
            updateOnDuplicate: ["keyValue", "isPublic", "description", "status"],
        });

        encryptedKeys.forEach(k => {
            setConfigKey(k.keyName, decryptKey(k.keyValue));
        });

        await refreshRazorpayKeys()

        res.status(200).json({
            success: true,
            message: "Config keys stored/updated successfully",
        });
    } catch (error) {
        console.error("Error storing config keys:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


