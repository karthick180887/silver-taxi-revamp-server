import { connectRabbitMQ } from "./index";
import { registerDriverWalletWorker } from "./workers/driverWorker";
import { registerFcmWorker, registerWhatsappWorker } from "./workers/notificationWorker";


export const startWorker = async () => {
    await connectRabbitMQ();

    await registerFcmWorker();
    await registerWhatsappWorker();
    await registerDriverWalletWorker();
    console.log("✅ RabbitMQ worker started successfully");
};

