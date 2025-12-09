import {z} from "zod";

export const walletAmountAdd = z.object({
    amount: z.number().min(0, "Amount must be a positive number"),
    remark: z.string().nullable().default(null)
})

export const walletWithdrawRequestSchema = z.object({
    amount: z.number().min(0, "Amount must be a positive number"),
    reason: z.string().min(1, "Reason is required"),
    tnxPaymentId: z.string().optional().default(""),
    paymentMethod: z.string().optional().default("UPI"),
})



