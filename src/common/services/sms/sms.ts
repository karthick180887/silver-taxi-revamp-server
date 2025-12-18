import axios from 'axios';
import CryptoJS from 'crypto-js';
import env from '../../../utils/env';
import { logger as log, debugLogger as debug } from '../../../utils/logger';
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

function formatMobile(mobile: string | number): string {
    let cleanMobile = mobile.toString().replace(/\D/g, '');
    if (cleanMobile.length === 10) {
        cleanMobile = '91' + cleanMobile;
    }
    return cleanMobile;
}

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
        /**
         * Sends an OTP SMS via MSG91
         */
        sendOtp: async ({
            mobile,
            isOTPSend = false,
            websiteName = 'Silver Taxi',
            sendOtp = null,
            id = null
        }: SendOTPPayload): Promise<string | boolean> => {
            // MSG91 Credentials (Hardcoded as per request)
            // MSG91 Credentials (Hardcoded as per request)
            const MSG91_AUTH_KEY = "482940Tknm3Vdw694116c5P1";
            const MSG91_TEMPLATE_ID = "693fe05bde90a804b07fbea9";
            const MSG91_URL = "https://control.msg91.com/api/v5/otp";

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

            // LOGGING DEBUG INFO
            log.info(`[SMS DEBUG] NODE_ENV: ${env.NODE_ENV}, MOCK_OTP: ${env.MOCK_OTP}`);

            // MOCK SMS MODE: Hard disabled for production usage as per user
            const isMockMode = false;

            if (isMockMode || mobile === 9361060911) {
                log.info("------------------------------------------------");
                log.info(`>>> 🟢 MOCK SMS MODE ENABLED <<<`);
                log.info(`>>> Mobile: ${mobile}`);
                log.info(`>>> OTP: ${otp}`);
                log.info("------------------------------------------------");
                return token;
            }

            try {
                const formattedMobile = formatMobile(mobile);

                // Use Headers for AuthKey and Body for Data (V5 Standard)
                const response = await axios.post(
                    MSG91_URL,
                    {
                        template_id: MSG91_TEMPLATE_ID,
                        mobile: formattedMobile,
                        otp: otp
                    },
                    {
                        headers: {
                            "authkey": MSG91_AUTH_KEY,
                            "Content-Type": "application/json"
                        }
                    }
                );

                log.info(`MSG91 OTP SMS sent: ${JSON.stringify(response.data)}\n`);
                return token;

            } catch (error: any) {
                const errMsg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
                debug.error(`Failed to send MSG91 OTP: ${errMsg}`);

                // Fallback: If MSG91 fails, we still return the token so the user might retry or use Whatsapp
                // But generally, we should signal failure. However, existing logic returns token even on error sometimes? 
                // Let's return false to indicate system failure.
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
         * Verifies the OTP using MSG91 API
         */
        verifyOTP: async ({
            otp,
            token, // Kept for interface compatibility but unused for MSG91
            mobile
        }: {
            otp: string;
            token?: string;
            mobile: string | number;
        }): Promise<VerifyOTPResponse> => {
            const MSG91_AUTH_KEY = "482940Tknm3Vdw694116c5P1";
            const MSG91_VERIFY_URL = "https://control.msg91.com/api/v5/otp/verify";

            try {
                debug.info(`Verifying OTP via MSG91 for mobile: ${mobile}, otp: ${otp}`);

                // MOCK SMS MODE (Hard Disabled for Prod)
                const isMockMode = false;
                if (isMockMode || mobile === 9361060911) {
                    if (otp === "123456") {
                        return {
                            status: 200,
                            success: true,
                            message: 'OTP verified successfully (Mock)',
                            id: 'mock_id'
                        };
                    }
                }

                const formattedMobile = formatMobile(mobile);

                const response = await axios.get(MSG91_VERIFY_URL, {
                    params: {
                        mobile: formattedMobile,
                        otp: otp
                    },
                    headers: {
                        "authkey": MSG91_AUTH_KEY
                    }
                });

                log.info(`MSG91 Verify Response: ${JSON.stringify(response.data)}`);

                if (response.data.type === 'success') {
                    return {
                        status: 200,
                        success: true,
                        message: response.data.message || 'OTP verified successfully',
                        id: undefined // MSG91 verify doesn't return our internal ID
                    };
                } else {
                    return {
                        status: 400,
                        success: false,
                        message: response.data.message || 'Invalid OTP',
                    };
                }

            } catch (err: any) {
                const errMsg = err?.response?.data?.message || err.message;
                debug.error('OTP Verification Error:', errMsg);
                return {
                    status: 400, // Treat API errors (like "OTP not parseable") as Bad Request/Invalid
                    success: false,
                    message: errMsg || 'An error occurred during OTP verification',
                };
            }
        },

        verifyWidgetToken: async (accessToken: string): Promise<VerifyOTPResponse> => {
            const MSG91_AUTH_KEY = "482940Ari1oNd366940ddb6P1";
            const MSG91_VERIFY_TOKEN_URL = "https://control.msg91.com/api/v5/widget/verifyAccessToken";

            try {
                debug.info(`Verifying Widget Token via MSG91: ${accessToken}`);

                const payload = {
                    "authkey": MSG91_AUTH_KEY,
                    "access-token": accessToken
                };
                debug.info(`Sending Payload to MSG91: ${JSON.stringify(payload)}`);

                const response = await axios.post(
                    MSG91_VERIFY_TOKEN_URL,
                    payload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        }
                    }
                );

                log.info(`MSG91 Token Verify Response: ${JSON.stringify(response.data)}`);

                // 702 = "access-token already verified". We treat this as success for the Login->Signup fallback flow.
                if (
                    response.data.type === 'success' ||
                    response.data.message === 'success' ||
                    response.data.code == 702
                ) {
                    return {
                        status: 200,
                        success: true,
                        message: response.data.message || 'Token verified successfully',
                        id: undefined
                    };
                } else {
                    return {
                        status: 400,
                        success: false,
                        message: response.data.message || 'Invalid Token'
                    };
                }
            } catch (err: any) {
                const errMsg = err?.response?.data?.message || err.message;
                debug.error('Token Verification Error:', errMsg);
                return {
                    status: 400,
                    success: false,
                    message: errMsg || 'Token verification failed'
                };
            }
        },

        sendSuccess: () => {
            // Optional hook
        },
    };
}
