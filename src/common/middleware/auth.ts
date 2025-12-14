import { getJwtToken, decodeToken } from "../services/jwt/jwt";
import { NextFunction, Request, Response } from "express";
import { JwtType } from "../types/jwt";
import { Admin, Customer, Driver, Vendor } from "../../v1/core/models";
import { getCachedUser } from "../services/cache/userSession";

// Admin
export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = await getJwtToken(req);

    if (!token) {
      res.send("Please provide a auth token");
      return;
    }
    const decode: JwtType = decodeToken(token);
    //@ts-ignore
    req.query.id = decode.userData?.id?.toString();
    req.query.username = decode.userData?.username?.toString();
    req.query.role = decode.userData?.role?.toString();
    req.query.domain = decode.userData?.domain?.toString();

    req.query.adminId = decode.adminId?.toString();
    next();
  } catch (err) {
    console.log("ERROR>", err);
    res.status(401).end();
  }
}

// Driver App
export async function appAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = await getJwtToken(req);

    if (!token) {
      res.send("Please provide a auth token");
      return;
    }
    const decode: JwtType = decodeToken(token);

    //@ts-ignore
    req.query.id = decode.userData?.id?.toString();
    req.query.username = decode.userData?.username?.toString();
    req.query.role = decode.userData?.role?.toString();

    req.query.driverId = decode.userData.id?.toString();
    req.query.adminId = decode.adminId?.toString();

    console.log("AppAuth Decode:", JSON.stringify(decode));

    if (req.query.driverId) {
      console.log("AppAuth: Searching for driverId:", req.query.driverId);

      let driver = await getCachedUser('driver', req.query.driverId as string);

      if (!driver) {
        console.log("driver not found or not logged in. ID:", req.query.driverId);
        res.status(401).json({ message: "driver not authorized" });
        return
      }

      if (!driver) {
        console.log("driver not found or not logged in");
        res.status(401).json({ message: "driver not authorized" });
        return
      }

      // console.log(`✅ driver verified: ${driver.driverId}`);
    } else {
      console.log("⚠️ No driver in token, using admin access only");
    }
    next();
  } catch (err) {
    console.log("ERROR>", err);
    res.status(401).end();
  }
}


//Customer App

export async function customerApp(req: Request, res: Response, next: NextFunction) {
  try {
    const token = await getJwtToken(req);

    if (!token) {
      res.send("Please provide a auth token");
      return;
    }
    const decode: JwtType = decodeToken(token);

    //@ts-ignore
    req.query.id = decode.userData?.id?.toString();
    req.query.username = decode.userData?.username?.toString();
    req.query.role = decode.userData?.role?.toString();

    req.query.customerId = decode.userData.id?.toString();
    req.query.adminId = decode.adminId?.toString();

    if (req.query.customerId) {
      const customer = await getCachedUser('customer', req.query.customerId as string);

      if (!customer) {
        console.log("customer not found or not logged in");
        res.status(401).json({ message: "customer not authorized" });
        return
      }

      // console.log(`✅ customer verified: ${customer.customerId}`);
    } else {
      console.log("⚠️ No customer in token, using admin access only");
    }
    next();
  } catch (err) {
    console.log("ERROR>", err);
    res.status(401).end();
  }
}

//Vendor App
export async function vendorApp(req: Request, res: Response, next: NextFunction) {
  try {
    // Allow login route without token
    if (req.path.startsWith('/auth')) {
      next();
      return;
    }

    const token = await getJwtToken(req);

    if (!token) {
      res.send("Please provide a auth token");
      return;
    }
    const decode: JwtType = decodeToken(token);

    //@ts-ignore
    req.query.id = decode.userData?.id?.toString();
    req.query.username = decode.userData?.username?.toString();
    req.query.role = decode.userData?.role?.toString();

    req.query.vendorId = decode.userData.id?.toString();
    req.query.adminId = decode.adminId?.toString();

    if (req.query.vendorId) {
      const vendor = await getCachedUser('vendor', req.query.vendorId as string);

      if (!vendor) {
        console.log("Vendor not found or not logged in");
        res.status(401).json({ message: "Vendor not authorized" });
        return
      }

      // console.log(`✅ Vendor verified: ${vendor.vendorId}`);
    } else {
      console.log("⚠️ No vendorId in token, using admin access only");
    }

    next();
  } catch (err) {
    console.log("ERROR>", err);
    res.status(401).end();
  }
}

// Website
export async function websiteAuth(req: Request, res: Response, next: NextFunction) {
  try {

    const domain = String(req.headers["x-domain"]).split("/")[2] || String(req.headers["x-domain"]);

    console.log("DOMAIN>", domain)

    if (!domain) {
      res.status(401).json({
        success: false,
        message: "Domain is required"
      });
      return;
    }

    const admin = await Admin.findOne({
      where: { domain }
    });

    // console.log("admin ---> ", admin)

    if (!admin) {
      res.status(401).send("Admin not found");
      return;
    }

    const adminId = admin.adminId;
    req.query.adminId = adminId;
    next();
  } catch (err) {
    console.log("Website Auth Error>", err);
    res.status(401).end();
  }
}






