import { z } from "zod";

export const phoneNumberSchema = z.object({
    phoneNo: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid phone number"),
})

// export const phoneNumberSchema = z.object({
//     phoneNo: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid phone number"),
// })
// Signup Info
export const signUpSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid phone number"),
    email: z.string().optional().default(""),
    fcmToken: z.string().min(1, "FCM Token is required"),
    walletAmount: z.number().optional().default(0),
    otp: z.string().min(6, "OTP must be at least 6 characters long").max(6, "OTP must be exactly 6 characters long"),
    smsToken: z.string().min(1, "SMS Token is required"),
})

// ✅ Step 1: Basic Driver Info
export const step1Schema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid phone number"),
    // address: z.string().min(1, "Address is required"),
    // gender: z.enum(["Male", "Female", "Other"]),
    // dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    //     message: "Invalid date of birth",
    // }),
    // city: z.string().optional(),
    // pinCode: z.string()
    //     .optional()
    //     .refine((val) => !val || (/^\d+$/.test(val) && val.length === 6), {
    //         message: "Pin code must be exactly 6 digits and digits only",
    //     }),
    // state: z.string().optional(),
});

// ✅ Step 2: Vehicle Basic Info
export const step2Schema = z.object({
    // vehicleName: z.string().min(1),
    vehicleType: z.string().min(1),
    vehicleNumber: z.string().min(1),
    // vehicleYear: z.string().min(1, { message: "Vehicle year is required" })
        // .refine(
        //     (val) => {
        //         const year = Number(val);
        //         return !isNaN(year) && year >= 1900 && year <= 2100;
        //     },
        //     { message: "Year must be between 1900 and 2100" }
        // ),
    fuelType: z.string().optional(),
    isActive: z.boolean().optional(),
});

// ✅ Step 3: Driver Documents
export const step3Schema = z.object({
    // driverImageUrl: z.string().url("Invalid image URL"),
    aadharImageFront: z.string().url("Required Aadhar Front image"),
    aadharImageBack: z.string().url("Required Aadhar Back image"),
    // panCardImage: z.string().url("Invalid PAN image URL"),
    licenseImageFront: z.string().url("Invalid License Front image"),
    licenseImageBack: z.string().url("Invalid License Back image"),
    // licenseValidity: z.string().refine((val) => !isNaN(Date.parse(val)), {
    //     message: "Invalid licenseValidity format",
    // }),
    documentUploaded: z.boolean().default(false),
});

// ✅ Step 4: Vehicle Documents
export const step4Schema = z.object({
    vehicleId: z.string().min(1, "Vehicle ID is required"),
    rcBookImageFront: z.string().url("Invalid RCBook Front image"),
    rcBookImageBack: z.string().url("Invalid RCBook Back image"),
    // rcExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    //     message: "Invalid RC expiry date",
    // }),
    insuranceImage: z.string().url("Invalid insurance image"),
    // insuranceExpiryDate: z.union([
    //     z.string().refine((val) => !isNaN(Date.parse(val)), {
    //         message: "Invalid insurance expiry date"
    //     }),
    //     z.date()]
    // ),
    // pollutionImage: z.string().url("Invalid pollution image"),
    // pollutionExpiryDate: z.union([
    //     z.string().refine((val) => !isNaN(Date.parse(val)), {
    //         message: "Invalid pollution expiry date"
    //     }),
    //     z.date()]
    // ),
    vehicleDocumentUploaded: z.boolean().default(false),
});


export const vehicleAddSchema = z.object({
    vehicleName: z.string().min(1),
    vehicleType: z.string().min(1),
    vehicleNumber: z.string().min(1),
    vehicleYear: z.string().min(1),
    fuelType: z.string().optional(),
    isActive: z.boolean().optional(),
    // vehicleId: z.string().min(1, "Vehicle ID is required"),
    rcBookImageFront: z.string().url("Invalid RCBook Front image"),
    rcBookImageBack: z.string().url("Invalid RCBook Back image"),
    rcExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid RC expiry date",
    }),
    insuranceImage: z.string().url("Invalid insurance image"),
    insuranceExpiryDate: z.union([
        z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid insurance expiry date"
        }),
        z.date()]
    ),
    pollutionImage: z.string().url("Invalid pollution image"),
    pollutionExpiryDate: z.union([
        z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid pollution expiry date"
        }),
        z.date()]
    ),
    vehicleDocumentUploaded: z.boolean().default(false),

});


//Used on driver/vehicleController
const isFutureDate = (date: string) => new Date(date) > new Date();
// Vehicle number regex - Format: KA01AB1234
const vehicleNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
// Base vehicle schema
export const vehicleSchema = z.object({
    vehicleName: z.string().min(2, "Vehicle name must be at least 2 characters long"),
    vehicleType: z.string().min(1, "Vehicle type is required"),
    vehicleNumber: z.string()
        .regex(vehicleNumberRegex, "Invalid vehicle number format. Format: KA01AB1234"),
    vehicleYear: z.number()
        .min(1900, "Invalid year")
        .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
    fuelType: z.enum(["Petrol", "Diesel", "Electric", "Hybrid"], {
        errorMap: () => ({ message: "Invalid fuel type" })
    }),

    // Document Images and Expiry Dates
    rcBookImageFront: z.string().url("Invalid RC Book front image URL"),
    rcBookImageBack: z.string().url("Invalid RC Book back image URL"),
    rcExpiryDate: z.string()
        .refine(isFutureDate, "RC Book has expired"),
    insuranceImage: z.string().url("Invalid insurance image URL"),
    insuranceExpiryDate: z.string()
        .refine(isFutureDate, "Insurance has expired"),
    pollutionImage: z.string().url("Invalid pollution certificate image URL"),
    pollutionExpiryDate: z.string()
        .refine(isFutureDate, "Pollution certificate has expired")
});

// Schema for initial vehicle creation (without documents)
export const vehicleCreateSchema = z.object({
    vehicleName: z.string().min(2, "Vehicle name must be at least 2 characters long"),
    vehicleType: z.string().min(1, "Vehicle type is required"),
    vehicleNumber: z.string().min(1, "Vehicle number is required"), // Relaxed regex for initial creation
    vehicleYear: z.number()
        .min(1900, "Invalid year")
        .max(new Date().getFullYear() + 1, "Year cannot be in the future")
        .optional(),
    fuelType: z.enum(["Petrol", "Diesel", "Electric", "Hybrid"], {
        errorMap: () => ({ message: "Invalid fuel type" })
    }).optional(),

    // Document Images and Expiry Dates - Optional for initial creation
    rcBookImageFront: z.string().url("Invalid RC Book front image URL").optional(),
    rcBookImageBack: z.string().url("Invalid RC Book back image URL").optional(),
    rcExpiryDate: z.string().optional(),
    insuranceImage: z.string().url("Invalid insurance image URL").optional(),
    insuranceExpiryDate: z.string().optional(),
    pollutionImage: z.string().url("Invalid pollution certificate image URL").optional(),
    pollutionExpiryDate: z.string().optional()
});

// Optional version of the schema for partial updates
export const vehicleUpdateSchema = vehicleSchema.partial();


// Verification status enum
const VerificationStatus = z.enum(["pending", "accepted", "rejected"]);

// IFSC code regex - Format: 4 letters + 0 + 6 alphanumeric
const ifscCodeRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// UPI ID regex - Format: username@provider
const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/;

// UPI number regex - 10-15 digits
const upiNumberRegex = /^\d{10,15}$/;

// Bank account number regex - 8-20 digits
const bankAccountNumberRegex = /^\d{8,20}$/;

// Main driver payment details schema
export const driverPaymentDetailsSchema = z.object({
    accountName: z.string().optional(),
    bankBookImage: z.string().url("Invalid bank book image URL").optional(),
    bankAccountNumber: z.string()
        .regex(bankAccountNumberRegex, "Invalid bank account number format. Must be 8-20 digits"),
    bankName: z.string().optional(),
    ifscCode: z.string()
        .regex(ifscCodeRegex, "Invalid IFSC code format. Format: HDFC0001234")
        .optional(),
    accountHolderName: z.string().min(2, "Account holder name must be at least 2 characters long"),
    bankDetailsVerified: VerificationStatus.optional().default("pending"),
    bankDetailsRemark: z.string().max(500, "Bank details remark must be less than 500 characters").optional(),
    upiId: z.string()
        .regex(upiIdRegex, "Invalid UPI ID format. Format: username@provider")
        .min(5, "UPI ID must be at least 5 characters")
        .max(50, "UPI ID must be less than 50 characters")
        .optional(),
    upiNumber: z.string()
        .regex(upiNumberRegex, "Invalid UPI number format. Must be 10-15 digits")
        .optional(),
    upiVerified: VerificationStatus.optional().default("pending"),
    upiRemark: z.string().max(500, "UPI remark must be less than 500 characters").optional(),
    accountDescription: z.string().max(500, "Account description must be less than 500 characters").optional(),
    isActive: z.boolean().default(true),
    isPrimary: z.boolean().default(false)
});


export const driverPaymentDetailsUpdateSchema = driverPaymentDetailsSchema.partial();


export const walletBulkRequestSchema = z.object({
    amount: z.number().min(1, "Amount must be at least 1"),
    reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters"),
    adjustmentType: z.enum(["add", "minus"], {
        errorMap: () => ({ message: "Invalid request type" })
    }),
    status: z.boolean().nullable(),
    days: z.number().optional().default(0),
});