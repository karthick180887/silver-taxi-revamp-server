import axios from 'axios'
import env from '../../utils/env'
import dayjs from '../../utils/dayjs'
import { getConfigKey } from '../../common/services/node-cache';
import { formatDuration } from '../../v1/core/function/dataFn';

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

// this function uses the Google Distance Matrix API to find the distance and time between two locations.
interface DistanceAndTimeResponse {
  distance: number;
  duration: string;
  origin: string;
  destination: string;
}


// google distance matrix without toll charges
export async function findDistanceAndTime(
  origin: string,
  destination: string,
): Promise<DistanceAndTimeResponse | string> {
  const apiKey = await getConfigKey("google_map_key");

  if (!apiKey) {
    console.error("Google Maps API key is missing.");
    return "Google Maps API key is missing.";
  }

  // Step 1: Get distance and time using Distance Matrix API
  const url = "https://maps.googleapis.com/maps/api/distancematrix/json";
  const params = {
    origins: origin,
    destinations: destination,
    key: apiKey,
    region: "in",
  };

  try {
    const response = await axios.get(url, { params });
    const status = response.data.status;
    const element = response.data.rows?.[0]?.elements?.[0];

    if (status !== "OK" || element?.status !== "OK") {
      console.error("Distance Matrix API error:", element?.status || status);
      return "An error occurred while fetching distance and time.";
    }

    const baseResult: DistanceAndTimeResponse = {
      distance: Math.round(element.distance.value / 1000),
      duration: element.duration.text,
      origin,
      destination,
    };

    return baseResult

  } catch (err) {
    console.error("Error fetching distance, time, or tolls:", err);
    return "An error occurred while fetching distance, time, or tolls.";
  }
}


interface MultipleStopsDistanceAndTimeResponse {
  distance: number;
  duration: string;
  origin: string;
  destination: string;
  results: DistanceAndTimeResponse[];
}

interface GetSegmentDistancesOptimizedParams {
  pickupCity: string;
  stops: string[];
  dropCity: string;
  serviceType?: "One way" | "Round trip" | "Day Packages" | "Hourly Packages";
}

export async function getSegmentDistancesOptimized({
  pickupCity,
  stops = [],
  dropCity,
  serviceType
}: GetSegmentDistancesOptimizedParams): Promise<MultipleStopsDistanceAndTimeResponse | string> {

  let allPoints: any = [pickupCity, ...stops, dropCity];

  if (stops.length > 0 && serviceType === "Round trip") {
    allPoints = [pickupCity, ...stops, dropCity, pickupCity];
  } else if (stops.length === 0 && serviceType === "Round trip") {
    allPoints = [pickupCity, ...stops, dropCity];
  }

  let totalDistance = 0;
  let totalDurationSeconds = 0;
  const results: DistanceAndTimeResponse[] = [];

  const apiKey = await getConfigKey("google_map_key");

  if (!apiKey) {
    console.error("Google Maps API key is missing.");
    return "Google Maps API key is missing.";
  }

  const url = "https://maps.googleapis.com/maps/api/distancematrix/json";

  try {
    for (let i = 0; i < allPoints.length - 1; i++) {
      const origin = allPoints[i];
      const destination = allPoints[i + 1];

      const params = {
        origins: origin,
        destinations: destination,
        key: apiKey,
        region: "in",
      };

      console.log("params-->", params)

      const response = await axios.get(url, { params });

      if (response.data.status !== "OK") {
        console.error(`API Error: ${response.data.status}`);
        return "An error occurred while fetching distance and time.";
      }

      const element = response.data.rows[0]?.elements?.[0];
      if (element?.status === "OK") {
        const distanceKm = Math.round(element.distance.value / 1000);
        const durationSeconds = element.duration.value;

        totalDistance += distanceKm;
        totalDurationSeconds += durationSeconds;

        results.push({
          origin,
          destination,
          distance: distanceKm,
          duration: element.duration.text,
        });
      } else {
        results.push({
          origin,
          destination,
          distance: 0,
          duration: "0 mins",
        });
      }
    }

    console.log("totalDurationSeconds--->", totalDurationSeconds)
    const durationTotalText = formatDuration(totalDurationSeconds);

    return {
      distance: totalDistance,
      duration: durationTotalText,
      origin: pickupCity,
      destination: dropCity,
      results,
    };
  } catch (err) {
    console.error("Error fetching segment distances:", err);
    return "An error occurred while fetching segment distances.";
  }
}

// google distance matrix with toll charges
// interface DistanceAndTimeResponse {
//     distance: number;
//     duration: string;
//     origin: string;
//     destination: string;
//     tollCost?: {
//         fastag?: { currency: string; amount: string };
//         cash?: { currency: string; amount: string };
//         explanation: string;
//     };
// }

// async function findDistanceAndTime(
//     origin: string,
//     destination: string,
//     driverHasFastag: boolean = false,
//     includeCashToll: boolean = true,
//     vehicleEmissionType: string = "GASOLINE"
// ): Promise<DistanceAndTimeResponse | string> {
//      const apiKey =await getConfigKey("google_map_key");

//     if (!apiKey) {
//         console.error("Google Maps API key is missing.");
//         return "Google Maps API key is missing.";
//     }

//     // Step 1: Get distance and time using Distance Matrix API
//     const url = "https://maps.googleapis.com/maps/api/distancematrix/json";
//     const params = {
//         origins: origin,
//         destinations: destination,
//         key: apiKey,
//         region: "in",
//     };

//     try {
//         const response = await axios.get(url, { params });
//         const status = response.data.status;
//         const element = response.data.rows?.[0]?.elements?.[0];

//         if (status !== "OK" || element?.status !== "OK") {
//             console.error("Distance Matrix API error:", element?.status || status);
//             return "An error occurred while fetching distance and time.";
//         }

//         const baseResult: DistanceAndTimeResponse = {
//             distance: Math.round(element.distance.value / 1000),
//             duration: element.duration.text,
//             origin,
//             destination,
//         };

//         const routesUrl = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
//         let fastagAmount = 0;
//         let cashAmount = 0;
//         let tollCost: DistanceAndTimeResponse["tollCost"] = { explanation: "" };

//         // 1. Try FASTag Toll
//         const fastagPayload = {
//             origins: [{
//                 waypoint: { address: origin },
//                 routeModifiers: {
//                     vehicleInfo: { emissionType: vehicleEmissionType },
//                     tollPasses: ["IN_FASTAG"],
//                 },
//             }],
//             destinations: [{ waypoint: { address: destination } }],
//             travelMode: "DRIVE",
//             extraComputations: ["TOLLS"],
//             regionCode: "IN",
//         };

//         const fastagResponse = await axios.post(routesUrl, fastagPayload, {
//             headers: {
//                 "Content-Type": "application/json",
//                 "X-Goog-Api-Key": apiKey,
//                 "X-Goog-FieldMask": "travel_advisory.tollInfo",
//             },
//         });

//         const fastagElement = fastagResponse.data?.[0];
//         const tollInfo = fastagElement?.travelAdvisory?.tollInfo;
//         const estimatedPrice = tollInfo?.estimatedPrice?.[0];

//         let fastagAvailable = false;
//         if (tollInfo && estimatedPrice && estimatedPrice.units) {
//             const nanos = estimatedPrice.nanos || 0;
//             fastagAmount = parseInt(estimatedPrice.units) + nanos / 1e9;
//             tollCost.fastag = {
//                 currency: estimatedPrice.currencyCode,
//                 amount: fastagAmount.toFixed(0),
//             };
//             fastagAvailable = true;
//         } else {
//             console.warn("No FASTag toll information available");
//         }

//         // 2. If FASTag info not found, try Cash Toll
//         if (!fastagAvailable && (includeCashToll || !driverHasFastag)) {
//             const cashPayload = {
//                 ...fastagPayload,
//                 origins: [{
//                     waypoint: { address: origin },
//                     routeModifiers: {
//                         vehicleInfo: { emissionType: vehicleEmissionType },
//                         tollPasses: [],
//                     },
//                 }],
//             };

//             const cashResponse = await axios.post(routesUrl, cashPayload, {
//                 headers: {
//                     "Content-Type": "application/json",
//                     "X-Goog-Api-Key": apiKey,
//                     "X-Goog-FieldMask": "travel_advisory.tollInfo",
//                 },
//             });

//             const cashElement = cashResponse.data?.[0];
//             const cashTollInfo = cashElement?.travelAdvisory?.tollInfo;
//             const cashEstimatedPrice = cashTollInfo?.estimatedPrice?.[0];

//             if (cashTollInfo && cashEstimatedPrice && cashEstimatedPrice.units) {
//                 const nanos = cashEstimatedPrice.nanos || 0;
//                 cashAmount = parseInt(cashEstimatedPrice.units) + nanos / 1e9;
//                 tollCost.cash = {
//                     currency: cashEstimatedPrice.currencyCode,
//                     amount: cashAmount.toFixed(0),
//                 };
//             } else {
//                 console.warn("No cash toll information available.");
//             }
//         }

//         // 3. Build explanation
//         if (fastagAvailable) {
//             if (cashAmount > fastagAmount && (includeCashToll || !driverHasFastag)) {
//                 const savings = (cashAmount - fastagAmount).toFixed(2);
//                 tollCost.explanation = `Driver uses FASTag, saving ₹${savings} compared to cash and reducing toll booth delays.`;
//             } else {
//                 tollCost.explanation = `Driver uses FASTag for faster toll payments and convenience.`;
//             }
//         } else if (cashAmount > 0) {
//             tollCost.explanation = `Driver does not use FASTag, so cash toll prices apply.`;
//         } else {
//             tollCost.explanation = `No tolls on this route or toll data unavailable.`;
//             baseResult.tollCost = tollCost;
//             return baseResult;
//         }

//         // 4. Attach toll info and return
//         baseResult.tollCost = tollCost;
//         return baseResult;

//     } catch (err) {
//         console.error("Error fetching distance, time, or tolls:", err);
//         return "An error occurred while fetching distance, time, or tolls.";
//     }


// }
