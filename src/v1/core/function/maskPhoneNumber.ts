export const maskPhoneNumber = (phone?: string | null) => {
    if (!phone) {
        return phone ?? "";
    }

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length <= 4) {
        return phone;
    }

    const hasIndiaCode = digitsOnly.startsWith("91");
    const prefix = hasIndiaCode ? "91" : "";
    const suffixLength = Math.min(2, digitsOnly.length - prefix.length);
    const suffix = digitsOnly.slice(-suffixLength);
    const middleLength = digitsOnly.length - (hasIndiaCode ? 2 : 0) - suffixLength;
    const maskedMiddle = "*".repeat(Math.max(middleLength, 0));

    if (prefix) {
        return `${prefix} ${maskedMiddle}${suffix}`;
    }

    return `${maskedMiddle}${suffix}`;
};

export const maskBookingPhones = (bookingList: any[]) => {
    return bookingList.map((bookingInstance: any) => {
        const booking = typeof bookingInstance.toJSON === "function"
            ? bookingInstance.toJSON()
            : { ...bookingInstance };

        if (booking.phone) {
            booking.phone = maskPhoneNumber(booking.phone);
        }

        if (booking.alternatePhone) {
            booking.alternatePhone = maskPhoneNumber(booking.alternatePhone);
        }

        return booking;
    });
};