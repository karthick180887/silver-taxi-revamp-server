import axios, { AxiosError } from 'axios'
import env from '../../utils/env'
import { getConfigKey } from '../../common/services/node-cache';

// interface DistanceAndTimeResponse {
//     distance: number;
//     duration: string;
//     origin: string;
//     destination: string;
// }

// This function uses the taxi-engine Distance Matrix API to find the distance and time between two locations.

/* const findDistanceAndTime = async (origin: string, destination: string): Promise<DistanceAndTimeResponse | string> => {
    try {
        const response = await axios.get(`https://maps.thereciprocalsolutions.com/distance-matrix?origin=${origin}&destination=${destination}`);

        const data = response.data.trip

        return {
            distance: data?.distance || 0,
            duration: data?.duration || 0,
            origin,
            destination
        };
    } catch (err) {
        console.error("Error fetching distance and time:", err);
        return "An error occurred while fetching distance and time.";
    }
}; */

interface TollCost {
    currency?: string;
    amount?: string;
    explanation?: string;
    fastag?: { currency: string; amount: string };
    cash?: { currency: string; amount: string };
}

interface DistanceAndTimeResponse {
    distance: number; // in kilometers
    duration: string;
    origin: string;
    destination: string;
    tollCost?: TollCost;
}

export async function findDistanceAndTime(
    origin: string,
    destination: string,
    driverHasFastag: boolean = false,
    includeCashToll: boolean = true
): Promise<DistanceAndTimeResponse | string> {
     const googleApiKey = await getConfigKey("google_map_key");
    const tollGuruKey = "";

    if (!googleApiKey || !tollGuruKey) {
        return "API key(s) missing.";
    }

    // Step 1: Get distance and duration using Google Distance Matrix
    const googleParams = {
        origins: origin,
        destinations: destination,
        key: googleApiKey,
        region: "in",
    };

    let baseResult: DistanceAndTimeResponse;

    try {
        const googleResponse = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
            params: googleParams,
        });

        const element = googleResponse.data.rows?.[0]?.elements?.[0];
        if (googleResponse.data.status !== "OK" || element?.status !== "OK") {
            console.error("Google Maps error:", element?.status);
            return "Failed to fetch distance/time from Google.";
        }

        baseResult = {
            distance: Math.round(element.distance.value / 1000),
            duration: element.duration.text,
            origin,
            destination,
        };
    } catch (error) {
        console.error("Google Distance Matrix API error:", error);
        return "An error occurred while fetching distance and time.";
    }

    // Step 2: Try to get FASTag toll from TollGuru
    let fastagAmount = 0;
    let cashAmount = 0;
    const tollCost: TollCost = { explanation: "" };

    const getToll = async (useFastag: boolean) => {
        // Validate inputs
        if (!origin || !destination) {
            console.error("Error: Origin or destination is empty or undefined", { origin, destination });
            return null;
        }

        const payload = {
            from: { address: origin },
            to: { address: destination },
            vehicle: { type: "2AxlesAuto" }
        };

        try {
            const response = await axios.post(
                "https://apis.tollguru.com/v2/origin-destination-waypoints",
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": tollGuruKey,
                    },
                }
            );

            console.log("TollGuru cost cash >> ", response.data?.routes[0]?.costs.cash);
            console.log("TollGuru cost tag >>  ", response.data?.routes[0]?.costs.tag);

            const tollData = useFastag ?
                response.data?.routes[0]?.costs.tag
                : response.data?.routes[0]?.costs.cash;

            const cost = tollData || 0;
            const currency = "INR";

            return { cost, currency };
        } catch (err) {
            const error = err as AxiosError;
            console.error(`TollGuru ${useFastag ? "FASTag" : "Cash"} error:`, error?.response?.data || error.message);
            return null;
        }
    };
    // Try FASTag toll first
    const fastagResult = await getToll(true);
    let fastagAvailable = false;

    console.log("fastagResult >> ", fastagResult);

    if (fastagResult && fastagResult.cost > 0) {
        fastagAmount = fastagResult.cost;
        tollCost.fastag = {
            amount: fastagAmount.toFixed(0),
            currency: fastagResult.currency,
        };
        fastagAvailable = true;
    }

    // If FASTag unavailable, try cash toll
    if (!fastagAvailable && (includeCashToll || !driverHasFastag)) {
        const cashResult = await getToll(false);
        if (cashResult && cashResult.cost > 0) {
            cashAmount = cashResult.cost;
            tollCost.cash = {
                amount: cashAmount.toFixed(0),
                currency: cashResult.currency,
            };
        }
    }

    // Step 3: Build explanation
    if (fastagAvailable) {
        if (cashAmount > fastagAmount && (includeCashToll || !driverHasFastag)) {
            const savings = (cashAmount - fastagAmount).toFixed(2);
            tollCost.explanation = `Driver uses FASTag, saving ₹${savings} compared to cash and reducing toll booth delays.`;
        } else {
            tollCost.explanation = `Driver uses FASTag for faster toll payments and convenience.`;
        }
    } else if (cashAmount > 0) {
        tollCost.explanation = `Driver does not use FASTag, so cash toll prices apply.`;
    } else {
        tollCost.explanation = `No tolls on this route or toll data unavailable.`;
    }

    baseResult.tollCost = tollCost;
    return baseResult;
}
