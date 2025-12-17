/**
 * Cabigo Routes Data Model
 * Optimized for Tamil Nadu popular routes (ECR, Hill Stations, Pilgrimage)
 */

import { getLocationById } from './locations';

export interface Route {
    id: string;
    slug: string;
    originId: string;
    destinationId: string;
    distance: {
        km: number;
        miles: number;
    };
    duration: {
        hours: number;
        minutes: number;
        text: string;
    };
    pricing: {
        sedan: number;
        suv: number;
        premium: number;
    };
    highlights: string[];
    scenicNotes: string;
    roadCondition: 'Excellent' | 'Good' | 'Fair' | 'Average';
    tollInfo: {
        count: number;
        estimatedCost: number;
    };
    popularStops: string[];
    bestTimeToTravel: string;
    alternativeTransport: {
        mode: string;
        cost: number;
        duration: string;
    }[];
    metaDescription: string;
}

export const routes: Route[] = [
    {
        id: "chennai-pondicherry",
        slug: "chennai-to-pondicherry",
        originId: "chennai",
        destinationId: "pondicherry",
        distance: { km: 151, miles: 94 },
        duration: { hours: 3, minutes: 15, text: "3 hours 15 mins" },
        pricing: { sedan: 2800, suv: 3800, premium: 5500 },
        highlights: [
            "East Coast Road (ECR) - Most scenic drive in TN",
            "Mahabalipuram UNESCO Sites",
            "Salt pans and backwaters views"
        ],
        scenicNotes: "The ECR drive is legendary. You drive parallel to the Bay of Bengal for most of the journey. The ocean breeze, coconut groves, and smooth tarmac make it a favorite for road trips.",
        roadCondition: "Excellent",
        tollInfo: { count: 2, estimatedCost: 150 },
        popularStops: ["Mahabalipuram Shore Temple", "Crocodile Bank", "DakshinaChitra", "Mudaliarkuppam Boat House"],
        bestTimeToTravel: "Start by 7 AM to stop at Mahabalipuram before the sun gets too harsh",
        alternativeTransport: [
            { mode: "Bus (PRTC)", cost: 200, duration: "4h" },
            { mode: "Train", cost: 180, duration: "4h 30m" }
        ],
        metaDescription: "Chennai to Pondicherry Taxi via ECR. Scenic drive with Mahabalipuram stop. Lowest drop taxi rates. One way available."
    },
    {
        id: "coimbatore-ooty",
        slug: "coimbatore-to-ooty",
        originId: "coimbatore",
        destinationId: "ooty", // Updated
        distance: { km: 85, miles: 53 },
        duration: { hours: 3, minutes: 0, text: "3 hours" },
        pricing: { sedan: 3500, suv: 4500, premium: 6000 },
        highlights: [
            "Mettupalayam Ghat Road",
            "36 Hairpin Bends adventure",
            "Nilgiri Mountain Railway views"
        ],
        scenicNotes: "A thrilling climb up the Nilgiris. As you ascend the 36 hairpin bends, the temperature drops and tea gardens start appearing. You might spot wild elephants or bison on the way.",
        roadCondition: "Good",
        tollInfo: { count: 1, estimatedCost: 50 },
        popularStops: ["Black Thunder Theme Park", "Burliar", "Coonoor View Points", "Sim's Park"],
        bestTimeToTravel: "Start early (6 AM) to spot wildlife and avoid ghat traffic jams",
        alternativeTransport: [
            { mode: "Toy Train", cost: 300, duration: "5h" },
            { mode: "Bus", cost: 100, duration: "4h" }
        ],
        metaDescription: "Coimbatore to Ooty Taxi Service. Experienced hill drivers for 36 hairpin bends. Sightseeing packages for Ooty & Coonoor."
    },
    {
        id: "chennai-vellore",
        slug: "chennai-to-vellore",
        originId: "chennai",
        destinationId: "vellore",
        distance: { km: 137, miles: 85 },
        duration: { hours: 3, minutes: 0, text: "3 hours" },
        pricing: { sedan: 2500, suv: 3500, premium: 4500 },
        highlights: [
            "NH48 Chennai-Bangalore Highway",
            "Kanchipuram Temple City nearby",
            "Famous Arcot Biryani spots"
        ],
        scenicNotes: "A smooth drive on the 6-lane NH48. The landscape is dominated by industrial belts and rocky outcrops. A quick detour to Kanchipuram is possible for silk saree shopping.",
        roadCondition: "Excellent",
        tollInfo: { count: 3, estimatedCost: 280 },
        popularStops: ["Kanchipuram (Detour)", "Sriperumbudur (Memorial)", "A2B Highway Restaurant"],
        bestTimeToTravel: "Anytime; the highway is well-lit and safe 24/7",
        alternativeTransport: [
            { mode: "Train", cost: 150, duration: "2h 30m" },
            { mode: "Bus", cost: 200, duration: "3h 30m" }
        ],
        metaDescription: "Chennai to CMC Vellore Taxi. Patient travel specialists. Visit Sripuram Golden Temple. On-time pickup from Chennai Airport."
    },
    {
        id: "madurai-rameswaram",
        slug: "madurai-to-rameswaram",
        originId: "madurai",
        destinationId: "rameswaram", // Updated
        distance: { km: 175, miles: 109 },
        duration: { hours: 3, minutes: 30, text: "3.5 hours" },
        pricing: { sedan: 3200, suv: 4200, premium: 5800 },
        highlights: [
            "Pamban Bridge - Tech marvel over ocean",
            "Dhanushkodi Ghost Town",
            "Ramanathaswamy Temple"
        ],
        scenicNotes: "The highlight is driving on the Pamban Bridge with the ocean on both sides - a breathtaking experience. The drive to Dhanushkodi offers pristine, untouched beach views.",
        roadCondition: "Good",
        tollInfo: { count: 1, estimatedCost: 85 },
        popularStops: ["Pamban Bridge", "Dr. APJ Abdul Kalam Memorial", "Dhanushkodi Beach"],
        bestTimeToTravel: "Morning is best to reach Pamban bridge for photos",
        alternativeTransport: [
            { mode: "Train", cost: 120, duration: "4h" },
            { mode: "Bus", cost: 180, duration: "4h" }
        ],
        metaDescription: "Madurai to Rameswaram Taxi. Drive on Pamban Bridge. Dhanushkodi tour packages included. Reliable pilgrimage taxi service."
    },
    {
        id: "chennai-bangalore",
        slug: "chennai-to-bangalore",
        originId: "chennai",
        destinationId: "bangalore", // Updated
        distance: { km: 350, miles: 217 },
        duration: { hours: 6, minutes: 0, text: "6 hours" },
        pricing: { sedan: 5500, suv: 7500, premium: 9500 },
        highlights: [
            "Major Tech Corridor connect",
            "Ambur & Vaniyambadi Biryani belt",
            "Krishnagiri Dam"
        ],
        scenicNotes: "NH44/48 is one of India's best highways. You pass through the leather hubs of Ambur, rocky terrains of Krishnagiri, and enter the cooler plateau of Karnataka.",
        roadCondition: "Excellent",
        tollInfo: { count: 6, estimatedCost: 520 },
        popularStops: ["Star Biryani Ambur", "Murugan Idli Shop", "Krishnagiri Dam"],
        bestTimeToTravel: "Early morning to avoid Electronic City traffic in Bangalore",
        alternativeTransport: [
            { mode: "Train (Shatabdi)", cost: 900, duration: "5h" },
            { mode: "Flight", cost: 3000, duration: "1h" }
        ],
        metaDescription: "Chennai to Bangalore Drop Taxi. Lowest one way fare. Daily trips. Door to door pickup. Safe and sanitized cabs."
    },
    {
        id: "trichy-thanjavur",
        slug: "trichy-to-thanjavur",
        originId: "trichy",
        destinationId: "thanjavur", // Updated
        distance: { km: 60, miles: 37 },
        duration: { hours: 1, minutes: 15, text: "1.25 hours" },
        pricing: { sedan: 1800, suv: 2500, premium: 3500 },
        highlights: [
            "Brihadeeswarar Temple (Big Temple)",
            "Rice bowl of Tamil Nadu views",
            "Maratha Palace"
        ],
        scenicNotes: "A short, pleasant drive through the Kaveri delta region. Lush green paddy fields line the road, giving a true feel of rural Tamil Nadu's abundance.",
        roadCondition: "Good",
        tollInfo: { count: 1, estimatedCost: 45 },
        popularStops: ["Kallanai Dam (Detour)", "Saraswathi Mahal Library"],
        bestTimeToTravel: "Evening is best to visit the Big Temple when it's illuminated",
        alternativeTransport: [
            { mode: "Bus", cost: 50, duration: "1.5h" }
        ],
        metaDescription: "Trichy to Tanjore Taxi. Visit Big Temple UNESCO site. Affordable round trip packages. Local drivers who know history."
    },
    {
        id: "salem-yercaud",
        slug: "salem-to-yercaud",
        originId: "salem",
        destinationId: "yercaud", // Updated
        distance: { km: 30, miles: 19 },
        duration: { hours: 1, minutes: 0, text: "1 hour" },
        pricing: { sedan: 2000, suv: 3000, premium: 4000 },
        highlights: [
            "20 Hairpin Bends",
            "Coffee plantations",
            "Panoramic view of Salem city at night"
        ],
        scenicNotes: "A quick getaway from the heat. The road winds up quickly with 20 hairpin bends, offering spectacular views of Salem city below, especially dazzling at night.",
        roadCondition: "Good",
        tollInfo: { count: 0, estimatedCost: 0 },
        popularStops: ["Double Decker Viewpoint", "Emerald Lake", "Lady's Seat"],
        bestTimeToTravel: "Daytime for views, Night for city lights view",
        alternativeTransport: [
            { mode: "Bus", cost: 30, duration: "1.5h" }
        ],
        metaDescription: "Salem to Yercaud Taxi. Quick hill station taxi. Experienced drivers for ghat road. Weekend packages available."
    },
    {
        id: "coimbatore-isha",
        slug: "coimbatore-to-isha-yoga",
        originId: "coimbatore",
        destinationId: "isha-yoga", // Updated
        distance: { km: 30, miles: 19 },
        duration: { hours: 1, minutes: 0, text: "1 hour" },
        pricing: { sedan: 1500, suv: 2200, premium: 3000 },
        highlights: [
            "Adiyogi Statue - Largest Bust Sculpture",
            "Velliangiri Hills backdrop",
            "Serene drive through nature"
        ],
        scenicNotes: "The drive towards Velliangiri hills is spiritual and serene. The massive Adiyogi statue becomes visible from kilometers away, set against the misty mountains.",
        roadCondition: "Average",
        tollInfo: { count: 0, estimatedCost: 0 },
        popularStops: ["Dhyanalinga", "Adiyogi", "Surya Kund"],
        bestTimeToTravel: "Afternoon to stay for the evening light show",
        alternativeTransport: [
            { mode: "Bus", cost: 40, duration: "1.5h" }
        ],
        metaDescription: "Taxi to Isha Yoga Center Coimbatore. Adiyogi visit packages. Waiting options available for Dhyanalinga meditation."
    },
    {
        id: "madurai-kodaikanal",
        slug: "madurai-to-kodaikanal",
        originId: "madurai",
        destinationId: "kodaikanal",
        distance: { km: 115, miles: 71 },
        duration: { hours: 3, minutes: 30, text: "3.5 hours" },
        pricing: { sedan: 3500, suv: 4500, premium: 6000 },
        highlights: [
            "Silver Cascade Falls",
            "Pine Forests",
            "Kodaikanal Lake"
        ],
        scenicNotes: "One of the most beautiful ghat roads. The temperature drops as you ascend, with misty clouds often covering the road. Lush greenery and waterfalls greet you.",
        roadCondition: "Good",
        tollInfo: { count: 1, estimatedCost: 60 },
        popularStops: ["Dum Dum Rock", "Silver Cascade Falls", "Perumal Malai"],
        bestTimeToTravel: "Start early to check in by noon and enjoy the lake boating",
        alternativeTransport: [
            { mode: "Bus", cost: 150, duration: "4h" }
        ],
        metaDescription: "Madurai to Kodaikanal Taxi. Princess of Hill Stations. Safe ghat driving expert drivers. 24/7 service."
    },
    {
        id: "chennai-tirupati",
        slug: "chennai-to-tirupati",
        originId: "chennai",
        destinationId: "tirupati",
        distance: { km: 135, miles: 84 },
        duration: { hours: 3, minutes: 30, text: "3.5 hours" },
        pricing: { sedan: 3000, suv: 4200, premium: 5500 },
        highlights: [
            "Tirumala Venkateswara Temple",
            "Kapila Theertham",
            "Silathoranam"
        ],
        scenicNotes: "A spiritual journey crossing from TN to Andhra. The Seshachalam hills offer a distinct red-soil landscape with dense forests.",
        roadCondition: "Excellent",
        tollInfo: { count: 2, estimatedCost: 120 },
        popularStops: ["Tiruthani (Temple)", "Kaigal Waterfalls (Detour)"],
        bestTimeToTravel: "Early morning to reach for Darshan",
        alternativeTransport: [
            { mode: "Train", cost: 160, duration: "3h" },
            { mode: "Bus", cost: 200, duration: "4h" }
        ],
        metaDescription: "Chennai to Tirupati Drop Taxi. Balaji Darshan packages. Two way trips with waiting option. Andhra permit included."
    },
    {
        id: "trichy-velankanni",
        slug: "trichy-to-velankanni",
        originId: "trichy",
        destinationId: "velankanni",
        distance: { km: 150, miles: 93 },
        duration: { hours: 3, minutes: 15, text: "3.25 hours" },
        pricing: { sedan: 2800, suv: 3800, premium: 4800 },
        highlights: [
            "Basilica of Our Lady of Good Health",
            "Velankanni Beach",
            "Nagore Dargah nearby"
        ],
        scenicNotes: "Drive through the fertile Cauvery delta. You pass through Tiruvarur and Nagapattinam, witnessing lush paddy fields and coastal villages.",
        roadCondition: "Average",
        tollInfo: { count: 1, estimatedCost: 55 },
        popularStops: ["Tiruvarur Temple", "Sikkal Singaravelan Temple"],
        bestTimeToTravel: "Fridays/Weekends are crowded; choose weekdays for peace",
        alternativeTransport: [
            { mode: "Bus", cost: 180, duration: "4h" }
        ],
        metaDescription: "Trichy to Velankanni Taxi. Pilgrimage special packages. Visit Nagore and Velankanni in one trip. Reliable service."
    },
    {
        id: "coimbatore-munnar",
        slug: "coimbatore-to-munnar",
        originId: "coimbatore",
        destinationId: "munnar",
        distance: { km: 160, miles: 99 },
        duration: { hours: 4, minutes: 30, text: "4.5 hours" },
        pricing: { sedan: 4500, suv: 5500, premium: 7000 },
        highlights: [
            "Tea Gardens as far as eye can see",
            "Chinnar Wildlife Sanctuary",
            "Lakkam Waterfalls"
        ],
        scenicNotes: "An enchanting drive through the Western Ghats passing through Udumalpet and Chinnar. You cross into Kerala and are greeted by rolling tea estates.",
        roadCondition: "Fair",
        tollInfo: { count: 1, estimatedCost: 40 },
        popularStops: ["Aliyar Dam", "Chinnar Wildlife Sanctuary", "Marayoor Sandalwood Forests"],
        bestTimeToTravel: "Start early to enjoy the wildlife sanctuary crossing",
        alternativeTransport: [
            { mode: "Bus", cost: 200, duration: "6h" }
        ],
        metaDescription: "Coimbatore to Munnar Taxi. Inter-state permit included. Tea garden tours. Experienced ghat drivers for safety."
    }
];

export function getRouteBySlug(slug: string): Route | undefined {
    const route = routes.find(route => route.slug === slug);
    return route;
}

export function getRouteById(id: string): Route | undefined {
    return routes.find(route => route.id === id);
}

export function getRoutesFromCity(cityId: string): Route[] {
    return routes.filter(route => route.originId === cityId);
}

export function getRoutesToCity(cityId: string): Route[] {
    return routes.filter(route => route.destinationId === cityId);
}

export interface EnrichedRoute extends Route {
    origin: ReturnType<typeof getLocationById>;
    destination: ReturnType<typeof getLocationById> | { name: string };
}

export function getEnrichedRouteBySlug(slug: string): EnrichedRoute | undefined {
    const route = getRouteBySlug(slug);
    if (!route) return undefined;

    const origin = getLocationById(route.originId);
    const dest = getLocationById(route.destinationId);

    // Excursion logic
    let destinationObject = dest;
    if (!dest) {
        if (route.destinationId === "ooty" || route.slug.includes("ooty")) destinationObject = { ...origin!, name: "Ooty" };
        else if (route.destinationId === "rameswaram" || route.slug.includes("rameswaram")) destinationObject = { ...origin!, name: "Rameswaram" };
        else if (route.destinationId === "thanjavur" || route.slug.includes("thanjavur")) destinationObject = { ...origin!, name: "Thanjavur" };
        else if (route.destinationId === "yercaud" || route.slug.includes("yercaud")) destinationObject = { ...origin!, name: "Yercaud" };
        else if (route.destinationId === "isha-yoga" || route.slug.includes("isha")) destinationObject = { ...origin!, name: "Isha Yoga Center" };
        else if (route.destinationId === "bangalore" || route.slug.includes("bangalore")) destinationObject = { ...origin!, name: "Bangalore" };

        // New Additions
        else if (route.destinationId === "kodaikanal" || route.slug.includes("kodaikanal")) destinationObject = { ...origin!, name: "Kodaikanal" };
        else if (route.destinationId === "tirupati" || route.slug.includes("tirupati")) destinationObject = { ...origin!, name: "Tirupati" };
        else if (route.destinationId === "velankanni" || route.slug.includes("velankanni")) destinationObject = { ...origin!, name: "Velankanni" };
        else if (route.destinationId === "munnar" || route.slug.includes("munnar")) destinationObject = { ...origin!, name: "Munnar" };

        else destinationObject = { ...origin!, name: "Destination" };
    }

    return {
        ...route,
        origin: origin,
        destination: destinationObject
    };
}
