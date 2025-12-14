// workers/fcmWorker.ts
import { consumeNotification } from "../consumer";
import {
    handleDriverNotification,
    handleCustomerNotification,
    handleVendorNotification,
    handleWhatsappNotification,
    handleBatchDriverNotification
} from "../../../../v1/core/function/queue/handleQueueMsgs";

export const registerFcmWorker = async () => {

    await consumeNotification("notification.fcm.*", async (msg, msgRoutingKey) => {
        console.log(`📲 FCM Message received`, { msgRoutingKey });
        const routingParts = msgRoutingKey.split(".");
        const target = routingParts[2];

        try {

            // Handle individual notifications
            if ((!msg.fcmToken && !msg.fcmTokens) || !msg.payload) {
                // console.log("❌ Missing required FCM fields", { target });
                return;
            }

            // Route to appropriate handler based on target
            switch (target) {
                case "driver":
                    await handleDriverNotification(msg, target);
                    break;

                case "batch":
                    await handleBatchDriverNotification(msg, target);
                    break;

                case "customer":
                    await handleCustomerNotification(msg, target);
                    break;

                case "vendor":
                    await handleVendorNotification(msg, target);
                    break;

                default:
                    console.log(`⚠️ Unknown target: ${target}`, { msg, target });
            }
        } catch (error) {
            console.log("❌ FCM worker error", { error, msg, target });
        }
    });
};

export const registerWhatsappWorker = async () => {

    await consumeNotification("notification.whatsapp", async (msg, msgRoutingKey) => {
        console.log(`📲 Whatsapp Message received`, { msgRoutingKey });
        const target = msgRoutingKey.split(".")[2];

        try {
            if (!msg.phone || !msg.variables || !msg.templateName) {
                console.log("❌ Missing required Whatsapp fields", { msg });
                return;
            }

            // Handle Whatsapp message (implementation not shown)
            console.log("✅ Whatsapp message processed", { msg });
            handleWhatsappNotification(msg);

        } catch (error) {
            console.log("❌ Whatsapp worker error", { error, msg });
        }
    });
}