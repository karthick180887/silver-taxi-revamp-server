import { getChannel, isConnected, } from "./index";
import { logger } from "../../../utils/logger";

export const publishNotification = async (routingKey: string, payload: any) => {
    try {
        if (!isConnected()) {
            logger.error("RabbitMQ not connected");
            return;
        }

        const channel = getChannel();

        channel.publish(
            "notification",
            routingKey,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true }
        );

        logger.info(`📤 Published to [${routingKey}]`, payload);
    } catch (error) {
        logger.error("❌ Failed to publish message:", error);
    }
};


export const publishDriverWork = async (routingKey: string, payload: any) => {
    try {
        if (!isConnected()) {
            logger.error("RabbitMQ not connected");
            return;
        }

        const channel = getChannel();

        channel.publish(
            "driver",
            routingKey,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true }
        );

        logger.info(`📤 Published to [${routingKey}]`, payload);
    } catch (error) {
        logger.error("❌ Failed to publish message:", error);
    }
};
