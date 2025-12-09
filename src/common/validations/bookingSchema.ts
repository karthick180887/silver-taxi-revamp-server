import { z } from 'zod';


export const driverAcceptedSchema = z.object({
    action: z.enum(['accept', 'reject']).describe("Action to accept or reject the booking"),
})


const bookingSchema = z.object({
    status: z.enum(["Booking Confirmed", "Started", "Completed", "Cancelled", "Not-Started", "Reassign", "Manual Completed"]), // safer than plain string
    pickupDateTime: z
        .string()
        .refine((val) => !isNaN(new Date(val).getTime()), {
            message: "Invalid pickupDateTime format",
        }),

    serviceType: z.enum(["One way", "Round trip", "Hourly Packages"]),

    dropDate: z
        .union([z.string(), z.number()])
        .optional()
        .refine(
            (val) =>
                val === undefined ||
                (!isNaN(new Date(val as any).getTime()) && Number(val) > 0),
            {
                message: "Invalid dropDate format",
            }
        ),

    distance: z.coerce.number().positive().optional(), // z.coerce auto converts string→number
    pricePerKm: z.coerce.number().positive(),
    driverBeta: z.coerce.number().min(0),
});

// ✅ Extra rules
export const validatedVendorBooking = bookingSchema
    .refine((data) => !(data.serviceType === "Round trip" && !data.dropDate), {
        message: "dropDate is required for Round trip",
        path: ["dropDate"],
    })
    .refine((data) => data.status !== "Completed", {
        message: "Cannot update a completed booking",
        path: ["status"],
    });
