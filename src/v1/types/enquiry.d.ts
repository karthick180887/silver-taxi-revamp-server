import { date } from "zod";

interface EnquiryAttributes {
    from: string;
    to: string;
    service: string;
    serviceSubType : string;
    pickupDate :date;
    dropDate :date | null;
}

export { EnquiryAttributes };