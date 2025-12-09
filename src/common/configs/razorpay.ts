import Razorpay from "razorpay";
import { getConfigKey } from "../../common/services/node-cache";

let razorpayInstance: Razorpay | null = null;

const initRazorpay = async () => {

    const keyId = await getConfigKey("razorpay_key");
    const keySecret = await getConfigKey("razorpay_key_secret");

    if (!keyId || !keySecret) {
        console.error("Missing Razorpay credentials");
        throw new Error("Missing Razorpay credentials");
    }

    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    return razorpayInstance;
}

export const refreshRazorpayKeys = async () => {
    razorpayInstance = null; // force re-init
    return await initRazorpay();
};


export default initRazorpay;
