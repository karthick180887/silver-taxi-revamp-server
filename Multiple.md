Build an Express.js backend API endpoint for a taxi booking system.

The API should receive a POST request with the following JSON body:

api end point /customer/estimation
{
  "pickUp": "Chennai, Tamil Nadu",
  "stops": ["Vellore, Tamil Nadu", "Krishnagiri, Tamil Nadu"],
  "pickupDateTime": "2025-08-27T12:28:09.330Z",
  "dropDate": "", //If service is roundTrip,
  "drop": "Bangalore, Karnataka",
  "serviceType": "OneWay"
}

{
  "pickUp": "Chennai, Tamil Nadu",
  "stops": ["Vellore, Tamil Nadu", "Krishnagiri, Tamil Nadu"],
  "pickupDateTime": "2025-08-27T12:28:09.330Z",
  "dropDate": "025-08-29T12:28:09.330Z", //If service is roundTrip,
  "drop": "Bangalore, Karnataka",
  "serviceType": "Roundtrip"
}


Requirements:

1. Validate that all required fields are present (`startPoint`, `endPoint`) and `stops` is an array (can be empty).

2. Construct a Google Maps Directions API request:
   - origin: startPoint
   - destination: endPoint
   - waypoints: intermediate stops (joined by `|`)
   - Use your `GOOGLE_MAPS_API_KEY` stored in environment variables.
   - Use GET request to `https://maps.googleapis.com/maps/api/directions/json`

3. Parse the API response:
   - Sum all `route.legs[x].distance.value` (in meters)
   - Convert to kilometers (`/1000`) and round to 2 decimal places
   - Extract `overview_polyline.points` for optional frontend route visualization

4. Fetch vehicle and service data from the database using `vehicleTypeId` and `serviceTypeId`.
   - Vehicle should contain: `baseFare`, `pricePerKm`
   - Service should contain: `extraCharge` or similar

5. Calculate total fare using:
   baseFare + (distance * pricePerKm) + service extra charge

6. Return a response like this:

{
  "locations": [startPoint, ...stops, endPoint],//with between stops distance
  "totalDistanceKm": 385.2,
  "fareBreakdown": {
    "baseFare": 100,
    "distanceFare": 3852,
    "serviceFee": 50,
    "totalFare": 4002
  },
  "polyline": "ENCODED_POLYLINE_STRING",
  "success": true,
}

7. Handle error scenarios:
   - Return 400 if any input is missing or invalid
   - Return 500 if the Google Maps API request fails or returns no routes

Use async/await, `axios` for HTTP requests, and Sequelize or Prisma to query DB models. Do not include frontend code — only backend logic.
