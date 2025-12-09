import { Request, Response } from "express";
import {
    handleBookingPayment, handleBookingPaymentFailure,
    handleTripCompletedPaymentFailure, handleWalletPayment,
    handleWalletPaymentFailure, tripCompletedPayment
} from "../core/function/payment/razorpay";
import env from "../../utils/env";
import crypto from "crypto";


export const razorpayWebhook = async (req: Request, res: Response) => {
    try {
        const secret = env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error("❌ RAZORPAY_WEBHOOK_SECRET not set");
            res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
            return;
        }

        // Log req.body type for debugging
        // console.log("req.body type:", typeof req.body, req.body);

        // Handle req.body based on its type
        let payload: string;
        if (typeof req.body === "string") {
            payload = req.body;
        } else if (Buffer.isBuffer(req.body)) {
            payload = req.body.toString("utf8");
        } else {
            payload = JSON.stringify(req.body);
        }

        // console.log("Razorpay webhook payload >>", payload);

        const signature = req.headers["x-razorpay-signature"] as string;
        if (!signature) {
            console.error("❌ Missing x-razorpay-signature header");
            res.status(400).json({
                success: false,
                message: "Missing signature header"
            });
            return;
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("❌ Invalid signature");
            res.status(400).json({
                success: false,
                message: "Invalid signature"
            });
            return;
        }


        const parsed = JSON.parse(payload);
        const event = parsed.event;
        console.log("Razorpay webhook event >>", event);
        const payment = parsed.payload?.payment?.entity;
        const orderId = payment?.order_id;

        // console.log("Razorpay webhook payload >>", payload);

        if (event === "payment.captured") {
            const type = payment?.notes?.type;
            const notes = payment?.notes;


            if (type === "Wallet") {
                await handleWalletPayment(payment, orderId);
            } else if (type === "Trip-Completed") {
                await tripCompletedPayment(payment, notes.orderId, notes);
            } else if (type === "Booking") {
                await handleBookingPayment(payment, orderId, notes);
            }
            else {
                console.warn("Unknown payment type, ignoring");

                res.status(200).json({
                    success: true,
                    message: "Payment processed"
                });
                return
            }

            res.status(200).json({
                success: true,
                message: `Event '${event}' ignored`
            });
            return;
        }
        if (event === "payment.failed") {
            const type = payment?.notes?.type;
            const notes = payment?.notes;

            if (type === "Wallet") {
                await handleWalletPaymentFailure(payment, orderId);
            } else if (type === "Trip-Completed") {
                await handleTripCompletedPaymentFailure(payment, notes.orderId, notes);
            }
            else if (type === "Booking") {
                await handleBookingPaymentFailure(payment, orderId, notes)
            }
            else {
                console.warn("Unknown failed payment type");
            }

            res.status(200).json({
                success: true,
                message: "Failed payment recorded"
            });
            return;
        }
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error
        });
        return;
    }
};
