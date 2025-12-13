import { findDistanceAndTime } from "../../../common/functions/distanceAndTime";
import {Request, Response } from "express";
import { findPrice } from "../../core/function/priceCalculator";

export const distancePriceController = async (req: Request, res: Response): Promise<void> => {

    try {
        const { tariffId, pickupLocation, dropLocation } = req.body;
        
        let from = pickupLocation;
        let to = dropLocation;
        // Find Distance 
        const result = await findDistanceAndTime(from, to);
        if (typeof result === 'string') {
            throw new Error(result);
        }  

        const { distance} = result;

        const priceResult: { price: number } | null = await findPrice(tariffId, distance);
        const price = priceResult?.price
        const cals = {distance,price}

        res.status(200).json({
            success: true,
            message: "Calculation successful",
            cals: cals
        });

    }catch (error) {
        console.error("Error in calculation:", error);
        res.status(500).json({
            success: false,
            message: "Error in calculation",
        });
    }
}