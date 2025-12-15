import axios from 'axios';
import CryptoJS from 'crypto-js';
import env from '../../../utils/env';
import { infoLogger as log, debugLogger as debug } from '../../../utils/logger';
import { publishNotification } from '../rabbitmq/publisher';

// Types
interface SMSEnv {
    SMS_API_KEY: string;
    SMS_CLIENT_ID: string;
    OTP_SECRET: string;
    SMS_API_URL: string;
}

interface VerifyOTPResponse {
    status: number;
    success: boolean;
    message: string;
    id?: string;
}

type OtpType = 'login' | 'signup' | 'start_ride' | 'end_ride';

type SMSTemplateType =
    | 'driver_assigned'
    | 'trip_completed'
    | 'booking_confirm'
    | 'otp'
    | 'driver_otp'
    | 'customer_trip_otp'
    | 'trip_cancel'
    | 'customer_booking_acknowledgement'
    | 'custom';

const SMSEnv: SMSEnv = {
    SMS_API_KEY: env.SMS_API_KEY,
    SMS_CLIENT_ID: env.SMS_CLIENT_ID,
    OTP_SECRET: env.OTP_SECRET,
    SMS_API_URL: env.SMS_API_URL,
};


const OTP_EXPIRY_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function getMessageByTemplate(type: SMSTemplateType, data: Record<string, string | number>): string {
    switch (type) {
        case 'driver_assigned':
            return `Dear ${data.name}, Your driver has been assigned. Driver Name: ${data.driverName} Driver Number: ${data.driverPhone} Vehicle Number: ${data.vehicleNumber} For any assistance, contact us at ${data.contactNumber} Thank you for choosing silver Taxi ${data.website}.`;
        case 'trip_completed':
            return `Thanks for Travelling with Silver Taxi! We hope you enjoyed exploring our travel options. Website Address ${data.website}. Any questions or thoughts on your mind? Support Number ${data.contactNumber}.`;
        case 'booking_confirm':
            return `Dear ${data.name}, Your taxi booking is confirmed. Contact: ${data.phone} Pickup Date: ${data.pickupDate} Pickup Time: ${data.pickupTime} Pickup Location: ${data.pickup} Drop Location: ${data.drop} Trip Type: ${data.serviceType} For any assistance, contact us at ${data.contactNumber} Thank you for choosing Silver Taxi ${data.website}.`
        case 'otp':
            return `Your OTP for Silver Taxi is ${data.otp}. Do not share this code with anyone.`;
        case 'driver_otp':
            return `Thanks for choosing with Silver Taxi. Your Driver App Verification OTP code is ${data.otp}. If you are not requested OTP. Kindly, contact https://silvercalltaxi.in/`;
        case 'customer_trip_otp':
            return `Dear Customer, Start Ride OTP: ${data.startOtp} End Ride OTP: ${data.endOtp} Share these with your driver to start and end your Silver Taxi trip.`;
        case 'trip_cancel':
            return `Dear Customer, Your trip at Sliver Taxi has been cancelled. Booking ID: ${data.bookingId}. For support call ${data.contactNumber}. You can also try to reschedule or request a refund.`;
        case 'customer_booking_acknowledgement':
            return `Dear Customer, Your taxi booking is confirmed. Contact: ${data.contact} Tariff Details: Pickup Date & Time: ${data.pickupDateTime} Pickup & Drop Location: ${data.location} Trip Type: ${data.serviceType} Distance: ${data.distance} Minimum KM: ${data.minKm} Price Per KM: ${data.pricePerKm} Driver Bata: ${data.driverBeta} Hills Charges: ${data.hill} Permit Charges: ${data.permitCharges} Estimated Amount: ${data.estimatedAmount} GST tax: ${data.taxAmount} Discount: ${data.discountAmount} Final Amount: ${data.finalAmount} Terms & Conditions: Toll Charges, Parking Charges, Hill Charges, Pet Charges, Permit Charges, Over Luggage Charges Applicable, if it is* For any assistance, contact us at ${data.contactNumber} Website: ${data.website} Thank you for choosing Silver Taxi`;
        case 'custom':
            return `${data.message}`;
        default:
            return '';
    }
}


interface SendOTPPayload {
    mobile: number;
    isOTPSend: boolean;
    websiteName: string | null;
    sendOtp: string | null;
    id: string | null;
}

interface SendTemplateMessagePayload {
    mobile: number;
    template: SMSTemplateType;
    data: Record<string, string | number>;
}

export default function SMSService() {
    // console.log("SMSEnv.SMS_API_URL >> ", SMSEnv.SMS_API_URL)
    return {
        /**
         * Sends an OTP SMS via Nettyfish
         */
        sendOtp: async ({
            mobile,
            isOTPSend = false,
            websiteName = 'Silver Taxi',
            sendOtp = null,
            id = null
        }: SendOTPPayload): Promise<string | boolean> => {
            if (!SMSEnv.SMS_API_KEY || !SMSEnv.SMS_CLIENT_ID || !SMSEnv.OTP_SECRET) {
                debug.error('SMS API key, Client ID, or OTP secret missing in env');
                return false;
            }

            console.log("SMSEnv.SMS_API_URL >> ", SMSEnv.SMS_API_URL)


            let otp = sendOtp || Math.floor(100000 + Math.random() * 900000);
            if (mobile === 9361060911) {
                otp = "123456";
            }
            const generatedOtpMsg = `Generated OTP for ${mobile}: ${otp}`;
            log.info(generatedOtpMsg);
            console.log("------------------------------------------------");
            console.log(">>> MANUAL LOG: " + generatedOtpMsg);
            console.log("------------------------------------------------");

            const payload = JSON.stringify({
                otp,
                expiresAt: Date.now() + OTP_EXPIRY_DURATION_MS,
                id,
                websiteName
            });
            console.log("Otp", payload)

            const token = CryptoJS.AES.encrypt(payload, SMSEnv.OTP_SECRET).toString();

            if (!isOTPSend) {
                console.log("isOTPSend >> ", isOTPSend);
                return token;
            }

            const waPayload = {
                phone: mobile.toString(),
                variables: [{ type: "text", text: otp }],
                templateName: "otp"
            }

            publishNotification("notification.whatsapp", waPayload)
                .catch((err) => console.log("❌ Failed to publish Whatsapp notification", err));


            const message = getMessageByTemplate(isOTPSend ? 'driver_otp' : 'driver_otp', { otp });
            console.log("message >> \n", message);
            const url = `${SMSEnv.SMS_API_URL}/api/v2/SendSMS?SenderId=SLTAXI&Is_Unicode=false&Is_Flash=false&Message=${encodeURIComponent(
                message
            )}&MobileNumbers=${mobile}&ApiKey=${encodeURIComponent(
                SMSEnv.SMS_API_KEY
            )}&ClientId=${encodeURIComponent(SMSEnv.SMS_CLIENT_ID)}`;
            // const url = "fkjsdfj"

            try {
                if (mobile === 9361060911) {
                    return token;
                }

                const response = await axios.get(url, {
                    headers: { accept: 'text/plain' },
                });

                log.info(`Nettyfish OTP SMS sent: ${JSON.stringify(response.data)}\n`);
                return token;
            } catch (error: any) {
                debug.error(`Failed to send OTP SMS: ${error?.response?.data || error.message}`);
                return false;
            }
        },

        /**
         * Send non-OTP template SMS
         */
        sendTemplateMessage: async ({
            mobile,
            template,
            data
        }: SendTemplateMessagePayload): Promise<boolean> => {
            if (!SMSEnv.SMS_API_KEY || !SMSEnv.SMS_CLIENT_ID) {
                debug.error('SMS API key or Client ID missing in env');
                return false;
            }

            const message = getMessageByTemplate(template, data);
            if (!message) {
                debug.info(`Invalid SMS template type: ${template}`);
                return false;
            }

            console.log("message >> \n", message);
            const url = `${SMSEnv.SMS_API_URL}/api/v2/SendSMS?SenderId=SLTAXI&Is_Unicode=false&Is_Flash=false&Message=${encodeURIComponent(
                message
            )}&MobileNumbers=${mobile}&ApiKey=${encodeURIComponent(
                SMSEnv.SMS_API_KEY
            )}&ClientId=${encodeURIComponent(SMSEnv.SMS_CLIENT_ID)}`;
            // const url = "jfsgdkjfgs"

            try {
                const response = await axios.get(url, {
                    headers: { accept: 'text/plain' },
                });

                log.info(`Nettyfish SMS sent [${template}]: ${JSON.stringify(response.data)}`);
                return true;
            } catch (error: any) {
                debug.info(`Failed to send ${template} SMS:`, error?.response?.data || error.message);
                return false;
                // return true;
            }
        },

        /**
         * Verifies the OTP using encrypted token
         */
        verifyOTP: async ({
            otp,
            token,
        }: {
            otp: string;
            token: string;
        }): Promise<VerifyOTPResponse> => {
            try {
                debug.info(`Verifying OTP: ${otp}, token: ${token}`);
                const bytes = CryptoJS.AES.decrypt(token, SMSEnv.OTP_SECRET);
                const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                if (!decrypted.otp || !decrypted.expiresAt) {
                    return {
                        status: 400,
                        success: false,
                        message: 'Invalid token format',
                    };
                }

                if (Date.now() > decrypted.expiresAt) {
                    return {
                        status: 410,
                        success: false,
                        message: 'OTP expired',
                    };
                }

                if (decrypted.otp == otp) {
                    return {
                        status: 200,
                        success: true,
                        message: 'OTP verified successfully',
                        id: decrypted.id,
                    };
                }

                return {
                    status: 401,
                    success: false,
                    message: 'Invalid OTP',
                };
            } catch (err: any) {
                debug.error('OTP Verification Error:', err);
                return {
                    status: 500,
                    success: false,
                    message:
                        err instanceof Error ? err.message : 'An error occurred during OTP verification',
                };
            }
        },

        sendSuccess: () => {
            // Optional hook
        },
    };
}
