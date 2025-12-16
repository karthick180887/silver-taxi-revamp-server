import { z } from "zod";

export const phoneNumberSchema = z.object({
  phoneNo: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid phone number"),
})


export const customerSignUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid phone number"),
  email: z.string().email("Invalid email").optional(),
  fcmToken: z.string().min(1, "FCM Token is required"),
  walletAmount: z.number().optional().default(0),

  otp: z.string().min(6, "OTP must be at least 6 characters long").max(6, "OTP must be exactly 6 characters long").optional(),
  smsToken: z.string().min(1, "SMS Token is required").optional(),
  referralCode: z.string().optional(),
  accessToken: z.string().optional()
})


export const estimationSchema = z.object({
  pickUp: z.string().min(1, "Pickup location is required"),
  drop: z.string().optional(),
  stops: z.array(z.string()).optional(),
  pickupDateTime: z.string().min(1, "Pickup date and time is required"),
  dropDate: z.string().optional(),
  serviceType: z.enum(["One way", "Round trip", "Hourly Packages"], {
    errorMap: () => ({ message: "Invalid service type" }),
  }),

});