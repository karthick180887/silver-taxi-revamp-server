import { Request, Response } from "express";
import axios from "axios";
import env from "../../../utils/env";
import { debugLog } from "../../../utils/logger";
import { getConfigKey } from "../../../common/services/node-cache";



export async function polylineCreate(
  origin: string,
  destination: string,
  waypoints: string[] = [],
): Promise<string | null> {
  const apiKey = await getConfigKey("google_map_key");

  if (!apiKey) {
    console.log("Google Maps API key is missing.");
    return null;
  }

  const url = "https://maps.googleapis.com/maps/api/directions/json";
  const params: any = {
    origin,
    destination,
    key: apiKey,
    region: "in",
  };

  if (waypoints.length > 0) {
    params.waypoints = waypoints.join("|");
  }

  try {
    const response = await axios.get(url, { params });
    const status = response.data.status;

    if (status !== "OK") {
      debugLog("Directions API error:", { status, error: response.data.error_message });
      return null;
    }

    const polyline = response.data.routes?.[0]?.overview_polyline?.points;
    if (!polyline) {
      debugLog("No polyline found in Directions API response");
      return null;
    }

    return polyline;
  } catch (err) {
    debugLog("Error fetching polyline from Directions API:", err);
    return null;
  }
}