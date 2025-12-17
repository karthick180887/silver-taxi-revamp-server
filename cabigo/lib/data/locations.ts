/**
 * Cabigo Location Data Model
 * Optimized for Tamil Nadu Taxi Service Authority
 */

export interface Location {
    id: string;
    name: string;
    slug: string;
    state: string;
    country: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    population: number;
    description: string;
    highlights: string[];
    landmarks: string[];
    localTips: string[];
    averageTemperature: {
        summer: string;
        winter: string;
    };
    timezone: string;
    airportCode?: string;
    railwayStation?: string;
    imageUrl: string;
    metaDescription: string;
}

export const locations: Location[] = [
    {
        id: "chennai",
        name: "Chennai",
        slug: "chennai",
        state: "Tamil Nadu",
        country: "India",
        coordinates: { lat: 13.0827, lng: 80.2707 },
        population: 11235000,
        description: "Chennai, the gateway to South India, is the hub for all major taxi routes in Tamil Nadu. From airport pickups at MAA to outstation drops along the ECR to Pondicherry or temple tours, we cover it all.",
        highlights: [
            "Marina Beach - Longest urban beach in India",
            "Kapaleeshwarar Temple - Mylapore",
            "T. Nagar - Shopping hub",
            "ECR - Scenic coastal highway start point"
        ],
        landmarks: ["Marina Beach", "Kapaleeshwarar Temple", "Chennai Central", "T. Nagar", "Phoenix Marketcity"],
        localTips: [
            "Book airport taxis in advance; demand at MAA is high during peak hours",
            "ECR usage toll is extra but worth it for the scenic drive to Mahabalipuram",
            "T. Nagar traffic is heavy on weekends; plan your drop accordingly",
            "Best place for medical tourism transport (Apollo/Gleneagles)"
        ],
        averageTemperature: { summer: "38°C", winter: "24°C" },
        timezone: "IST (UTC+5:30)",
        airportCode: "MAA",
        railwayStation: "Chennai Central (MAS)",
        imageUrl: "/images/chennai.jpg",
        metaDescription: "No.1 Taxi Service in Chennai. Lowest price drop taxi to Bangalore, Pondicherry, and Trichy. 24/7 Airport pickup at Chennai International Airport."
    },
    {
        id: "coimbatore",
        name: "Coimbatore",
        slug: "coimbatore",
        state: "Tamil Nadu",
        country: "India",
        coordinates: { lat: 11.0168, lng: 76.9558 },
        population: 2900000,
        description: "Coimbatore, the Manchester of South India, is your gateway to the Nilgiris. Our taxi services specialize in hill station drives to Ooty, Coonoor, and Valparai with experienced hill-driving experts.",
        highlights: [
            "Marudamalai Temple - Hilltop Murugan temple",
            "Adiyogi Shiva Statue - Isha Yoga Center",
            "Gateway to Ooty & Coonoor",
            "Siruvani Waterfalls"
        ],
        landmarks: ["Adiyogi Statue", "Marudamalai", "Brookefields Mall", "VOC Park", "Isha Yoga Center"],
        localTips: [
            "For Ooty trips, start early (6 AM) to enjoy the wildlife sighting chances",
            "Visit Adiyogi in the evening for the laser light show",
            "Our drivers are specially trained for the 36 hairpin bends to Ooty",
            "Best extensive medical facilities available at KMCH/GKNM"
        ],
        averageTemperature: { summer: "34°C", winter: "20°C" },
        timezone: "IST (UTC+5:30)",
        airportCode: "CJB",
        railwayStation: "Coimbatore Junction (CBE)",
        imageUrl: "/images/coimbatore.jpg",
        metaDescription: "Best Taxi in Coimbatore for Ooty trips. Drop taxi service to Chennai, Bangalore, and Kerala. Isha Yoga Center packages available."
    },
    {
        id: "madurai",
        name: "Madurai",
        slug: "madurai",
        state: "Tamil Nadu",
        country: "India",
        coordinates: { lat: 9.9252, lng: 78.1198 },
        population: 1700000,
        description: "Madurai, the Temple City, is the soul of Tamil Nadu. We offer specialized temple tour packages covering Meenakshi Amman, Rameswaram, and Kanyakumari with drivers who know the best darshan timings.",
        highlights: [
            "Meenakshi Amman Temple - Historic marvel",
            "Thirumalai Nayakkar Mahal",
            "Gandhi Memorial Museum",
            "Jigarthanda famous drink spots"
        ],
        landmarks: ["Meenakshi Temple", "Thirumalai Nayakkar Mahal", "Vandiyur Mariamman Teppakulam", "Alagar Koyil"],
        localTips: [
            "Hotels near the West Tower are best for early morning temple visits",
            "Try the famous 'Jigarthanda' drink near the temple",
            "We provide dhotis/sarees on request for temple dress code compliance",
            "Rameswaram trips can be done as a day package from here"
        ],
        averageTemperature: { summer: "39°C", winter: "24°C" },
        timezone: "IST (UTC+5:30)",
        airportCode: "IXM",
        railwayStation: "Madurai Junction (MDU)",
        imageUrl: "/images/madurai.jpg",
        metaDescription: "Madurai Call Taxi service for Temple Tours. Meenakshi Amman temple pickup. Rameswaram & Kanyakumari tour packages at best rates."
    },
    {
        id: "trichy",
        name: "Trichy",
        slug: "trichy",
        state: "Tamil Nadu",
        country: "India",
        coordinates: { lat: 10.7905, lng: 78.7047 },
        population: 1200000,
        description: "Tiruchirappalli (Trichy) is located centrally in Tamil Nadu, making it the perfect hub for reaching any district. Visit the Rockfort temple or Srirangam with our local drivers.",
        highlights: [
            "Rockfort Ucchi Pillayar Temple",
            "Srirangam Ranganathaswamy Temple (Largest functioning Hindu temple)",
            "Kallanai Dam - Ancient chola engineering",
            "Samayapuram Mariamman Temple"
        ],
        landmarks: ["Rockfort Temple", "Srirangam Temple", "Kallanai Dam", "Chatram Bus Stand"],
        localTips: [
            "Srirangam temple takes 3-4 hours to cover fully",
            "Climb Rockfort in the evening for a sunset view of the Cauvery river",
            "Central location makes it cheapest for drop taxis to any TN district",
            "Airport is small but handles many international flights to Gulf/SE Asia"
        ],
        averageTemperature: { summer: "38°C", winter: "23°C" },
        timezone: "IST (UTC+5:30)",
        airportCode: "TRZ",
        railwayStation: "Tiruchirappalli Junction (TPJ)",
        imageUrl: "/images/trichy.jpg",
        metaDescription: "Trichy Drop Taxi Service. Lowest rates to Chennai, Madurai, and Tanjore. Pickup from Trichy International Airport (TRZ)."
    },
    {
        id: "salem",
        name: "Salem",
        slug: "salem",
        state: "Tamil Nadu",
        country: "India",
        coordinates: { lat: 11.6643, lng: 78.146 },
        population: 1000000,
        description: "Salem acts as the gateway to Yercaud and a crucial junction for Bangalore-TN traffic. Our taxis provide safe highway drives and expert hill climbing for Yercaud trips.",
        highlights: [
            "Yercaud Hill Station (30km away)",
            "Mettur Dam",
            "Kottai Mariamman Temple",
            "Steel Plant"
        ],
        landmarks: ["Yercaud Foot Hills", "New Bus Stand", "Kandhashramam", "Mettur Dam"],
        localTips: [
            "Yercaud is just a 45-min drive; perfect for weekend trips",
            "Buy fresh mangoes if traveling during summer season",
            "Bangalore highway traffic is heavy here; our drivers know the bypass shortcuts",
            "Major stopover for Bangalore-Madurai travelers"
        ],
        averageTemperature: { summer: "37°C", winter: "22°C" },
        timezone: "IST (UTC+5:30)",
        airportCode: "SXV",
        railwayStation: "Salem Junction (SA)",
        imageUrl: "/images/salem.jpg",
        metaDescription: "Salem Taxi Service. Gateway to Yercaud hills. Reliable drop taxi to Bangalore and Coimbatore on NH44."
    },
    {
        id: "pondicherry",
        name: "Pondicherry",
        slug: "pondicherry",
        state: "Puducherry",
        country: "India",
        coordinates: { lat: 11.9139, lng: 79.8145 },
        population: 244000,
        description: "Experience the French Riviera of the East. Our Chennai-Pondicherry taxi packages via ECR are our most popular weekend service, offering scenic coastal views.",
        highlights: [
            "Promenade Beach & Rock Beach",
            "Auroville & Matrimandir",
            "Sri Aurobindo Ashram",
            "White Town French Quarter"
        ],
        landmarks: ["White Town", "Auroville", "Paradise Beach", "Manakula Vinayagar Temple"],
        localTips: [
            "Rent a cycle in White Town, but take a cab for Auroville (12km away)",
            "ECR route from Chennai is more scenic than the Bypass",
            "Weekend traffic is high; book your return taxi in advance",
            "Liquor permits required if carrying bottles across state border"
        ],
        averageTemperature: { summer: "36°C", winter: "24°C" },
        timezone: "IST (UTC+5:30)",
        airportCode: "PNY",
        railwayStation: "Puducherry (PDY)",
        imageUrl: "/images/pondicherry.jpg",
        metaDescription: "Chennai to Pondicherry Taxi via ECR. Weekend packages for Auroville and White Town. Safe, english-speaking drivers for tourists."
    },
    {
        id: "kanyakumari",
        name: "Kanyakumari",
        slug: "kanyakumari",
        state: "Tamil Nadu",
        country: "India",
        coordinates: { lat: 8.0883, lng: 77.5385 },
        population: 30000,
        description: "Stand at the tip of India where three oceans meet. We provide reliable sunrise/sunset view drops and Rameshwaram-Kanyakumari connecting packages.",
        highlights: [
            "Vivekananda Rock Memorial",
            "Thiruvalluvar Statue",
            "Sunset Point",
            "Padmanabhapuram Palace"
        ],
        landmarks: ["Rock Memorial", "Triveni Sangam", "Gandhi Mandapam", "Our Lady of Ransom Church"],
        localTips: [
            "Sunrise time varies; ask our driver to wake you up/pick you up on time",
            "Ferry service to Rock Memorial has long queues; go early",
            "Don't miss the Padmanabhapuram Palace on the way to Trivandrum",
            "Day trips to Trivandrum/Kovalam are very popular"
        ],
        averageTemperature: { summer: "33°C", winter: "25°C" },
        timezone: "IST (UTC+5:30)",
        airportCode: "TRV", // Trivandrum is nearest
        railwayStation: "Kanyakumari (CAPE)",
        imageUrl: "/images/kanyakumari.jpg",
        metaDescription: "Kanyakumari Taxi Service. Sunrise view drops and sightseeing packages. Connect to Trivandrum and Rameswaram easily."
    },
    {
        id: "vellore",
        name: "Vellore",
        slug: "vellore",
        state: "Tamil Nadu",
        country: "India",
        coordinates: { lat: 12.9165, lng: 79.1325 },
        population: 500000,
        description: "Home to the Golden Temple (Sripuram) and CMC Hospital. We specialize in patient transport services from Chennai Airport to CMC Vellore with sensitive, careful driving.",
        highlights: [
            "Sripuram Golden Temple - Made of 1500kg gold",
            "Vellore Fort",
            "CMC Hospital",
            "Jalakandeswarar Temple"
        ],
        landmarks: ["Golden Temple", "CMC", "Vellore Fort", "VIT University"],
        localTips: [
            "Strict dress code at Golden Temple; no shorts/sleeveless",
            "Mobile phones not allowed inside temple; leave in our secure cab",
            "We offer special waiting packages for CMC hospital visits",
            "Located perfectly between Chennai and Bangalore"
        ],
        averageTemperature: { summer: "38°C", winter: "22°C" },
        timezone: "IST (UTC+5:30)",
        airportCode: "MAA", // Chennai is nearest major
        railwayStation: "Katpadi Junction (KPD)",
        imageUrl: "/images/vellore.jpg",
        metaDescription: "Taxi to CMC Vellore. Patient-friendly cabs from Chennai Airport. Golden Temple tour packages available. Reliable drop taxi."
    }
];

export function getLocationBySlug(slug: string): Location | undefined {
    return locations.find(loc => loc.slug === slug);
}

export function getLocationById(id: string): Location | undefined {
    return locations.find(loc => loc.id === id);
}
