import { z } from 'zod';


export const tripStartedSchema = z.object({
    startOdometerImage: z.string().optional(),
    startOdometerValue: z.number().min(0, "Start odometer value must be a positive number"),
    startOtp: z.string().min(4, "Start OTP must be at least 4 characters long"),
});

export const tripEndSchema = z.object({
    endOdometerImage: z.string().optional(),
    endOdometerValue: z.number().min(0, "Start odometer value must be a positive number"),
    endOtp: z.string().min(4, "Start OTP must be at least 4 characters long"),
    driverCharges: z.record(z.any()).optional(),
});