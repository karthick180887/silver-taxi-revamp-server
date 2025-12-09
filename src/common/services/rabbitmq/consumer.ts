import { logger } from "../../../utils/logger";
import { getChannel, isConnected } from "./index";

export const consumeNotification = async (
    routingKey: string,
    handler: (msg: any, msgRoutingKey: string) => Promise<void>
) => {
    try {
        if (!isConnected()) {
            logger.error("RabbitMQ not connected");
            return;
        }

        const channel = getChannel();
        channel.prefetch(10); // Process max 10 messages concurrently

        const { queue } = await channel.assertQueue("", { exclusive: true });
        await channel.bindQueue(queue, "notification", routingKey);

        channel.consume(queue, async (msg: any) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    const msgRoutingKey = msg.fields.routingKey;
                    await handler(content, msgRoutingKey);
                    channel.ack(msg);
                } catch (err) {
                    logger.info("❌ Consumer handler failed:", err);
                    channel.nack(msg, false, false);
                }
            }
        });

        logger.info(`👂 Listening on [${routingKey}]`);
    } catch (error) {
        logger.error(`❌ Failed to consume [${routingKey}]`, error);
    }
};

export const consumeDriverWorks = async (
    routingKey: string,
    handler: (msg: any, msgRoutingKey: string) => Promise<void>
) => {
    try {
        if (!isConnected()) {
            logger.error("RabbitMQ not connected");
            return;
        }

        const channel = getChannel();
        channel.prefetch(10); // Process max 10 messages concurrently

        const { queue } = await channel.assertQueue("", { exclusive: true });
        await channel.bindQueue(queue, "driver", routingKey);

        channel.consume(queue, async (msg: any) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    const msgRoutingKey = msg.fields.routingKey;
                    await handler(content, msgRoutingKey);
                    channel.ack(msg);
                } catch (err) {
                    logger.info("❌ Driver consumer handler failed:", err);
                    channel.nack(msg, false, false);
                }
            }
        });

        logger.info(`👂 Listening on [${routingKey}]`);
    } catch (error) {
        logger.error(`❌ Failed to driver consume [${routingKey}]`, error);
    }
};

