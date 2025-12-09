import axios, { AxiosError } from 'axios';
import env from '../../../utils/env';


interface WAEnv {
    token: string;
    url: string;
}

const WAEnv: WAEnv = {
    token: env.WHATSAPP_API_TOKEN,
    url: env.WHATSAPP_API_URL,
}

interface WhatsAppTemplate {
    [key: string]: string;
}

export const whatsappTemplate: WhatsAppTemplate = {
    otp: "login_app",
    tripCancelled: "driver_trip_cancelled_sms",
    driverTripCompleted: "to_driver_trip_completed_sms",
    driverTripAccepted: "driver_trip_accepted",
    bookingConfirmedAcknowledgement: "customer_fir",
    tripCompleted: "trip_completed_sms_customer",
    tripCancellation: "trip_cancellation",
    tripOtp: "ride_otp",
    driverDetails: "driver_details",
    bookingConfirmed: "customer_booking"

}

export async function sendWhatsAppMessage(template: string, phone: string, variables: string[]) {
    try {
        // console.log("whatsapp env ---> ", WAEnv);
        console.log("\ntemplate ---> ", whatsappTemplate[template] + " \n" + "whatsapp variables ---> ", variables, "\n phone ---->" + phone);
        const data = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": {
                "name": whatsappTemplate[template],
                "language": { "code": "en" },
                "components": [
                    {
                        "type": "body",
                        "parameters": variables
                    }
                ]
            }
        }
        const url = `${WAEnv.url}/v3/776233152236069/messages`;
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'apiKey': WAEnv.token
            }
        });
        console.log("whatsapp response ---> ", response.data);
        return response.data;
    } catch (error) {
        // Handle errors
        const axiosError = error as AxiosError;
        console.error("WhatsApp Error >> ", axiosError.response?.data || axiosError.message);
        return null;
    }
}





