import { Response, Request } from "express";
import bcrypt from "bcrypt";
import { signInToken } from "../../../../common/services/jwt/jwt";
import { Admin, Vendor } from "../../../core/models";
import { Op } from "sequelize";
import { getConfigKey } from "../../../../common/services/node-cache";

export const generatedVendorToken = async (
  vendorId: any,
  name: any,
  adminId: any
): Promise<void> => {
  const userData = {
    id: vendorId,
    username: name,
    role: "vendor",
  };
  return await signInToken({ userData, adminId });
};

export const vendorSignIn = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, phone, password } = req.body;

    console.log(
      "vendorSignIn called with email:",
      email,
      "phone:",
      phone,
      "password:",
      password
    );

    const conditions = [];
    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });

    const vendor = await Vendor.findOne({
      where: {
        [Op.or]: conditions,
        isLogin: true,
      },
    });

    console.log("vendor found:", vendor?.vendorId);

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

    const token = await generatedVendorToken(
      vendor?.vendorId,
      vendor?.name,
      vendor?.adminId
    );

    // Update FCM Token if provided during login
    if (req.body.fcmToken) {
      vendor.fcmToken = req.body.fcmToken;
      await vendor.save();
    }

    res.json({
      success: true,
      message: "Vendor signed in successfully",
      data: {
        token,
        role: "vendor",
        user: vendor.name,
        email: vendor.email,
        permission: ["vendor_access"],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getConfigKeys = async (req: Request, res: Response) => {
  const adminId = req.query.adminId ?? req.body.adminId;
  const vendorId = req.query.vendorId ?? req.body.vendorId;

  if (!vendorId) {
    res.status(401).json({
      success: false,
      message: "Vendor id is required",
    });
    return;
  }

  try {
    const keys = ["google_map_key", "razorpay_key"]; // whitelist
    const result: Record<string, string | null> = {};

    for (const key of keys) {
      result[key] = await getConfigKey(key);
    }

    res.status(200).json({
      success: true,
      message: "key fetch successfully",
      data: {
        google_maps_key: result["google_map_key"],
        razorpay_key: result["razorpay_key"]
      }
    });

  } catch (err) {
    console.log("error >> ", err)
    res.status(500).json({
      success: false,
      message: "Internal error"
    });
  }
}