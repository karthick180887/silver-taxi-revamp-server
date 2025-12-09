import nodemailer, { Transporter } from 'nodemailer';
import envConfig from '../../../utils/env';
import {
    BookingConfirmationHtml,
    EnquiryHtml,
    TripCompleteHtml,
    BookingCancelledHtml,
    DriverAssignedHtml
} from './templates/booking'

// Interface for company info
interface CompanyInfo {
    name: string;
}

interface MailResponse {
    status: number;
    msg?: string;
    error?: string;
    sentTo?: string;
    [key: string]: any; // For bookingConfirmResult, etc.
}


// Environment variables interface
interface EmailEnv {
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_SECURE: string;
    SMTP_USER: string;
    SMTP_PASS: string;
    ADMIN_MAIL_ID: string;
    COMPANY_NAME: string;
}

// Load environment variables
const emailEnv: EmailEnv = {
    SMTP_HOST: envConfig.SMTP_HOST,
    SMTP_PORT: envConfig.SMTP_PORT,
    SMTP_SECURE: envConfig.SMTP_SECURE,
    SMTP_USER: envConfig.SMTP_USER,
    SMTP_PASS: envConfig.SMTP_PASS,
    ADMIN_MAIL_ID: envConfig.ADMIN_MAIL_ID,
    COMPANY_NAME: envConfig.COMPANY_NAME,
};

const companyInfo: CompanyInfo = { name: emailEnv.COMPANY_NAME };

// Create a transporter instance
const transporter: Transporter = nodemailer.createTransport({
    host: emailEnv.SMTP_HOST,
    port: parseInt(emailEnv.SMTP_PORT),
    secure: emailEnv.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: emailEnv.SMTP_USER,
        pass: emailEnv.SMTP_PASS,
    },
});

// Verify SMTP connection configuration
transporter.verify().catch((error: Error) => console.error('SMTP Verification Error:', error));

// Function to send email
export const sendEmail = async (
    toEmails: string[],
    subject: string,
    htmlContent: string
): Promise<{ status: number; msg?: string; error?: string }> => {
    const mailOptions = {
        from: emailEnv.SMTP_USER,
        to: toEmails.join(', '),
        subject: `${subject} - ${companyInfo.name}`,
        html: htmlContent,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return { status: 200, msg: 'Email Sent' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.log('MAIL ERROR:', errorMessage);
        return { status: 500, error: errorMessage };
    }
};

export const bookingConfirm = async (data: any) => {
    try {
        if (!data.email) return { status: 400, error: 'No email provided' };

        const html = BookingConfirmationHtml(data, true);
        const result = await sendEmail([data.email], 'Your Booking Confirmation', html);

        return {
            status: 200,
            msg: 'Email sent successfully',
            sentTo: data.email,
            result,
        };
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[EMAIL ERROR] bookingConfirm:`, error);
        return { status: 500, error };
    }
};

export const emailTripCompleted = async (data: any) => {
    try {
        if (!data.email) return { status: 400, error: 'No email provided' };

        const html = TripCompleteHtml(data);
        const result = await sendEmail([data.email], 'Your Trip was Completed', html);

        return {
            status: 200,
            msg: 'Email sent successfully',
            sentTo: data.email,
            result,
        };
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[EMAIL ERROR] tripCompleted:`, error);
        return { status: 500, error };
    }
};

export const driverAssigned = async (data: any) => {
    try {
        if (!data.email) return { status: 400, error: 'No email provided' };

        const html = DriverAssignedHtml(data);
        const result = await sendEmail([data.email], 'Your Trip Driver was Assigned', html);

        return {
            status: 200,
            msg: 'Email sent successfully',
            sentTo: data.email,
            result,
        };
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[EMAIL ERROR] driverAssigned:`, error);
        return { status: 500, error };
    }
};

export const tripCancelled = async (data: any) => {
    try {
        if (!data.email) return { status: 400, error: 'No email provided' };

        const html = BookingCancelledHtml(data);
        const result = await sendEmail([data.email], 'Your Trip was Cancelled', html);

        return {
            status: 200,
            msg: 'Email sent successfully',
            sentTo: data.email,
            result,
        };
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[EMAIL ERROR] tripCancelled:`, error);
        return { status: 500, error };
    }
};

