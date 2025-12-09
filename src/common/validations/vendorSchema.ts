import { z } from "zod";

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
export const vendorPaymentDetailsSchema = z.object({
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