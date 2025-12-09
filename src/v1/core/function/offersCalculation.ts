import { Offers } from "../models/offers";

interface OfferCalculationResult {
    finalPrice: number;
    discountAmount: number;
}

export const calculateOffer = async (offerId: string, price: number): Promise<OfferCalculationResult> => {
    try {
        const offer = await Offers.findOne({
            where: { offerId, status: true },
        });

        // Return original price if no valid offer is found
        if (!offer) {
            return { finalPrice: price, discountAmount: 0 };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize time for accurate comparison

        // Return original price if the offer is not valid
        if (offer.startDate > today || offer.endDate < today) {
            return { finalPrice: price, discountAmount: 0 };
        }

        // Calculate discount based on offer type
        const discountAmount = offer.type === "Percentage"
            ? (price * offer.value) / 100
            : offer.type === "Flat"
                ? offer.value
                : 0;


        const finalPrice = Math.max(0, price - discountAmount); // Ensure price never goes negative


        await offer.update({
            usedCount: offer.usedCount + 1
        })
        
        return { finalPrice, discountAmount };
    } catch (error) {
        console.error("Error calculating offer:", error);
        // Handle error appropriately, e.g., return original price
        return { finalPrice: price, discountAmount: 0 };
    }
};
