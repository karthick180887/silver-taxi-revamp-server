import { z } from 'zod';


export const tripStartedSchema = z.object({
    startOdometerImage: z.string().optional(),
    startOdometerValue: z.number().min(0, "Start odometer value must be a positive number"),
    startOtp: z.string().min(6, "Start OTP must be 6 digits"),
    accessToken: z.string().optional(),
});

export const tripEndSchema = z.object({
    endOdometerImage: z.string().optional(),
    endOdometerValue: z.number().min(0, "End odometer value must be a positive number"),
    endOtp: z.string().min(6, "End OTP must be 6 digits"),
    driverCharges: z.record(z.any()).optional(),
    accessToken: z.string().optional(),
    // GPS vs Odometer Verification
    distanceSource: z.enum(['gps', 'odometer', 'matched']).optional(),
    distanceMismatchPercent: z.number().optional(),
    distanceMismatchNotes: z.string().optional(),

    // Extra Charges
    hillCharge: z.number().optional(),
    tollCharge: z.number().optional(),
    petCharge: z.number().optional(),
    permitCharge: z.number().optional(),
    parkingCharge: z.number().optional(),
    waitingCharge: z.number().optional(),
});