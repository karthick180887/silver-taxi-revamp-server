
import { vehicles, Vehicle } from './vehicles';

export interface TouristPlace {
    name: string;
    type: 'Temple' | 'Hill Station' | 'Beach' | 'Nature' | 'City' | 'Heritage' | 'Hospital' | 'Shopping';
    distance: string;
    bestFor: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

export interface District {
    id: string;
    slug: string; // e.g., chennai
    name: string; // e.g., Chennai
    seoTitle: string;
    metaDescription: string;
    h1: string;
    keywords: string[];

    // Content Sections
    about?: string;
    oneWayContent: string;
    roundTripContent: string;

    // Data Mapping
    touristPlaces: TouristPlace[];
    nearbyDistricts: string[]; // IDs of nearby districts for linking

    // Vehicle suitability override (optional)
    recommendedVehicles: string[]; // IDs from vehicles.ts

    faqs: FAQ[];
}

export const districts: District[] = [
    {
        id: "chennai",
        slug: "chennai",
        name: "Chennai",
        seoTitle: "Best Taxi Service in Chennai | One Way & Round Trip Cabs",
        metaDescription: "Book top-rated taxi service in Chennai. 24/7 Drop taxi to Pondicherry, Bangalore, Trichy. Sedan, Etios, Innova Crysta available. Lowest per km rates.",
        h1: "Premium Taxi Service in Chennai",
        keywords: [
            "Chennai to Pondicherry one way taxi",
            "Chennai airport taxi booking",
            "Drop taxi Chennai to Bangalore",
            "Outstation cab services Chennai",
            "Innova Crysta rental Chennai",
            "Chennai to Tirupati round trip cab",
            "Local taxi tariff Chennai",
            "One way call taxi Chennai",
            "Chennai to Madurai drop taxi",
            "Tourist taxi packages from Chennai"
        ],
        oneWayContent: "Looking for a **One Way Taxi in Chennai**? Why pay for return when you only need a drop? Cabigo specializes in one-way intercity drops. Whether you are heading to **Pondicherry** for a weekend or **Bangalore** for a meeting, our dedicated fleet of Sedans (Etios, Dzire) and SUVs ensures you pay only for the distance traveled. We cover all major routes including ECR, GST Road, and the Bangalore Highway.",
        roundTripContent: "Planning a family vacation or a pilgrimage? Our **Round Trip Taxi Packages from Chennai** are designed for peace of mind. Rent an **Innova Crysta** for a comfortable trip to **Tirupati** or a **Tempo Traveller** for a family reunion in **Mahabalipuram**. Our drivers stay with you, guiding you to the best local spots, restaurants, and hidden gems.",
        touristPlaces: [
            { name: "Marina Beach", type: "Beach", distance: "5 km", bestFor: "Evening walks, Sunrise" },
            { name: "Mahabalipuram", type: "Heritage", distance: "55 km", bestFor: "Architecture, Photography" },
            { name: "Tirupati", type: "Temple", distance: "133 km", bestFor: "Pilgrimage" },
            { name: "Pondicherry", type: "Beach", distance: "150 km", bestFor: "Weekend Getaway" },
            { name: "Kanchipuram", type: "Temple", distance: "75 km", bestFor: "Temples, Silk Shopping" }
        ],
        nearbyDistricts: ["kanchipuram", "tiruvallur", "chengalpattu", "vellore"],
        recommendedVehicles: ["sedan", "etios", "innova-crysta", "suv"],
        faqs: [
            {
                question: "Do you provide one-way drop taxi from Chennai Airport?",
                answer: "Yes, we provide 24/7 **one-way drop taxi** services from Chennai International Airport (MAA) to any district in Tamil Nadu, Pondicherry, and Bangalore. Pre-book to avoid waiting."
            },
            {
                question: "Is driver bata included in the round trip fare?",
                answer: "For most round-trip packages, driver bata is quoted separately to ensure transparency. It covers the driver's food and stay expenses during overnight trips."
            },
            {
                question: "Which vehicle is best for a Tirupati trip from Chennai?",
                answer: "For Tirupati trips, we highly recommend the **Etios** or **Innova**. The Ghat road drive is comfortable in these vehicles, and they have ample boot space for luggage."
            },
            {
                question: "Can I book an Innova Crysta for a wedding in Chennai?",
                answer: "Absolutely. We offer **Innova Crysta** rentals for weddings, corporate events, and VIP guests. You can book on a hourly package basis (8Hr/80km, 12Hr/120km)."
            },
            {
                question: "Do you cover ECR route to Pondicherry?",
                answer: "Yes, the ECR (East Coast Road) route is our specialty. Our drivers are experienced on this scenic highway and can stop at attractions like **DakshinaChitra** and **Crocodile Bank** on request."
            }
        ]
    },
    {
        id: "coimbatore",
        slug: "coimbatore",
        name: "Coimbatore",
        seoTitle: "Coimbatore Taxi Service | Ooty & Valparai Tourist Cabs",
        metaDescription: "Best taxi service in Coimbatore for Ooty, Coonoor, Valparai trips. Expert hill drivers. 24/7 Drop taxi to Chennai, Bangalore, Kerala. Book Etios/Innova.",
        h1: "Reliable Taxi Service in Coimbatore",
        keywords: [
            "Coimbatore to Ooty taxi fare",
            "Coimbatore to Munnar cab booking",
            "One way taxi Coimbatore to Chennai",
            "Coimbatore airport prepaid taxi",
            "Valparai tourist taxi packages",
            "Innova rental Coimbatore",
            "Coimbatore to Isha Yoga center cab",
            "Drop taxi Coimbatore to Bangalore",
            "Local cab service in Coimbatore",
            "Pollachi tourist cabs"
        ],
        oneWayContent: "Coimbatore is the industrial hub of the West. Our **One Way Taxi Services in Coimbatore** connect you to business centers like **Tirupur, Salem, and Erode**. We also offer frequent drop taxis to **Bangalore** and **Chennai** for IT professionals. With our fleet of **Sedans and SUVs**, travel comfortably across the Kongu region without paying return charges.",
        roundTripContent: "Gateway to the Nilgiris! Our **Round Trip Taxi Packages** are famous for hill station tours. Whether it's the steep 36 hairpin bends to **Ooty**, the tea expanses of **Valparai**, or the mist of **Munnar**, our drivers are *Hill Driving Experts*. Safety is paramount on ghat roads, and our **Innova** and **Etios** fleet is maintained perfectly for these climbs.",
        touristPlaces: [
            { name: "Ooty", type: "Hill Station", distance: "85 km", bestFor: "Nature, Boating, Gardens" },
            { name: "Isha Yoga Center", type: "Temple", distance: "30 km", bestFor: "Spirituality, Meditation" },
            { name: "Valparai", type: "Hill Station", distance: "105 km", bestFor: "Tea Estates, Wildlife" },
            { name: "Munnar", type: "Hill Station", distance: "160 km", bestFor: "Kerala Trip, Hills" },
            { name: "Palani", type: "Temple", distance: "110 km", bestFor: "Pilgrimage" }
        ],
        nearbyDistricts: ["tirupur", "nilgiris", "erode", "dindigul"],
        recommendedVehicles: ["etios", "suv", "innova", "innova-crysta"],
        faqs: [
            {
                question: "Are your drivers experienced in driving on Ooty ghat roads?",
                answer: "Yes, 100%. We only assign specific **hill-driving certified drivers** for Ooty, Valparai, and Kodaikanal trips. They are experts in navigating hairpin bends safely."
            },
            {
                question: "What is the specialized vehicle for a family trip to Munnar?",
                answer: "For Munnar's long winding roads, the **Toyota Innova** or **Innova Crysta** (Captain Seats) is the best choice. It prevents motion sickness and offers great views."
            },
            {
                question: "Do you offer pickup from Coimbatore Airport to Isha Yoga?",
                answer: "Yes, we have a dedicated **Airport to Isha** package. Our driver will pick you up from CJB Airport and drop you at the Dhyanalinga/Adiyogi statue entrance."
            },
            {
                question: "Can I book a drop taxi from Coimbatore to Bangalore Airport?",
                answer: "Yes, we provide direct drops to **Bangalore International Airport (KIAL)**. It's a 6-7 hour drive, and a one-way cab is much more convenient than bus+shuttle."
            },
            {
                question: "Is night driving available for outstation drops?",
                answer: "Yes, our services are 24/7. However, for hill stations like Ooty, we recommend day travel to enjoy the views and for safety reasons (fog/animals)."
            }
        ]
    },
    {
        id: "madurai",
        slug: "madurai",
        name: "Madurai",
        seoTitle: "Madurai Taxi Service | Rameshwaram & Kanyakumari Tour Cabs",
        metaDescription: "Top Madurai taxi service for Temple Tours. Meenakshi Amman, Rameswaram, Kanyakumari packages. Low cost one way drop taxi to Chennai, Trichy.",
        h1: "Temple City Taxi Service in Madurai",
        keywords: [
            "Madurai to Rameswaram taxi fare",
            "Madurai to Kanyakumari tour package",
            "One way taxi Madurai to Chennai",
            "Madurai airport cab booking",
            "Meenakshi Amman temple taxi",
            "Rameshwaram Kanyakumari tour from Madurai",
            "Drop taxi Madurai to Trichy",
            "Innova car rental Madurai",
            "Madurai local sightseeing taxi",
            "Kodaikanal taxi from Madurai"
        ],
        oneWayContent: "Connect to the southern districts with ease. Our **One Way Taxi** from Madurai serves **Virudhunagar, Theni, Dindigul, and Tirunelveli**. We also have daily fleets running to **Chennai** and **Trichy**. If you are landing at **Madurai Airport (IXM)**, skip the expensive airport counters and book a **Cabigo Drop Taxi** for the best rates.",
        roundTripContent: "Madurai is the starting point for the famous **Rameswaram - Kanyakumari Pilgrimage Loop**. Our **Round Trip Packages** cover these spiritual circuits comprehensively. An **Etios** or **Innova** is perfect for this 3-4 day trip. Our drivers are locals who know the temple timings, the best places for 'Kadal Snanam' (Holy Dip), and authentic Chettinad food spots.",
        touristPlaces: [
            { name: "Meenakshi Amman Temple", type: "Temple", distance: "City Center", bestFor: "History, Spirituality" },
            { name: "Rameswaram", type: "Temple", distance: "175 km", bestFor: "Pilgrimage, Pamban Bridge" },
            { name: "Kanyakumari", type: "Beach", distance: "245 km", bestFor: "Sunset, Vivekananda Rock" },
            { name: "Kodaikanal", type: "Hill Station", distance: "115 km", bestFor: "Cool Climate, Boating" },
            { name: "Chettinad (Karaikudi)", type: "Heritage", distance: "90 km", bestFor: "Cuisine, Mansions" }
        ],
        nearbyDistricts: ["virudhunagar", "dindigul", "sivaganga", "theni"],
        recommendedVehicles: ["etios", "innova", "suv", "mini"],
        faqs: [
            {
                question: "How many days are needed for a Madurai-Rameswaram-Kanyakumari trip?",
                answer: "We recommend a **3 Days / 4 Nights** package to cover Madurai temples, Rameswaram rituals, and Kanyakumari sunrise comfortably without rushing."
            },
            {
                question: "Do you offer One Way Drop to Kodaikanal?",
                answer: "Yes, we provide **One Way Drops to Kodaikanal**. It's a beautiful 3-4 hour drive via the Batlagundu route."
            },
            {
                question: "Are there AC taxis available for local temple visits?",
                answer: "Yes, all our vehicles (Mini, Sedan, SUV) are fully air-conditioned. We also have **hourly rental packages** (e.g. 10 hours / 100 km) for local temple hopping."
            },
            {
                question: "What is the taxi fare from Madurai to Rameswaram?",
                answer: "Fares depend on the vehicle. A Sedan typically costs around ₹3000-₹3500 for a drop. Round trips are calculated on a per km basis (starting ₹11/km)."
            },
            {
                question: "Can the driver speak Hindi/English?",
                answer: "Most of our drivers speak **Tamil**. We also have drivers who speak basic **English and Hindi** to assist tourists from North India and abroad. Please request this during booking."
            }
        ]
    },
    {
        id: "trichy",
        slug: "trichy",
        name: "Trichy",
        seoTitle: "Trichy Taxi Service | Airport & Navagraha Temple Tours",
        metaDescription: "Reliable Trichy taxi service. Specialists in Navagraha Temple Tours. Drop taxi to Thanjavur, Kumbakonam, Chennai. Pickup from Trichy Airport (TRZ).",
        h1: "Trichy's Trusted Taxi Partner",
        keywords: [
            "Trichy to Thanjavur taxi",
            "Navagraha temple tour package price",
            "Trichy airport taxi service",
            "One way taxi Trichy to Chennai",
            "Drop taxi Trichy to Madurai",
            "Kumbakonam temple taxi",
            "Trichy local cab tariff",
            "Srirangam temple taxi booking",
            "Innova Crysta Trichy",
            "Outstation cabs from Trichy"
        ],
        oneWayContent: "Located at the geometric center of Tamil Nadu, Trichy is the perfect hub. Our **One Way Taxis** connect you to **Thanjavur, Kumbakonam, Pudukkottai, and Dindigul** in under 2 hours. We are the preferred choice for passengers landing at **Trichy International Airport (TRZ)** needing a drop to their hometowns in the Cauvery Delta region.",
        roundTripContent: "Trichy is the base for the **Navagraha Temple Tour**. This circuit covers 9 temples around Kumbakonam/Thanjavur. It requires a dedicated vehicle for 2-3 days. Our **Innova** and **SUV** fleet is ideal for families undertaking this spiritual journey. Drivers are well-versed with the specific order (sequencing) in which these temples are usually visited.",
        touristPlaces: [
            { name: "Srirangam Temple", type: "Temple", distance: "12 km", bestFor: "Largest Hindu Temple" },
            { name: "Rockfort Temple", type: "Temple", distance: "City Center", bestFor: "Views, History" },
            { name: "Thanjavur Big Temple", type: "Temple", distance: "55 km", bestFor: "UNESCO Heritage" },
            { name: "Kumbakonam", type: "Temple", distance: "90 km", bestFor: "Navagraha Temples" },
            { name: "Velankanni", type: "Temple", distance: "160 km", bestFor: "Church Pilgrimage" }
        ],
        nearbyDistricts: ["thanjavur", "pudukkottai", "perambalur", "karur"],
        recommendedVehicles: ["etios", "innova", "suv", "sedan"],
        faqs: [
            {
                question: "What is the best vehicle for a Navagraha Tour?",
                answer: "Since the tour involves frequent getting in and out of the car at 9 different temples, an **Innova** or **SUV** is best for elderly family members due to easier ingress/egress and comfort."
            },
            {
                question: "Do you provide drop taxi to Velankanni Church?",
                answer: "Yes, **Trichy to Velankanni** is a very popular route. We offer direct one-way drops as well as round-trip waiting packages."
            },
            {
                question: "How far is Thanjavur Big Temple from Trichy?",
                answer: "It is about **55-60 km**. A one-way taxi takes about 1 hour 15 minutes. It's perfect for a half-day trip."
            },
            {
                question: "Is there a waiting charge for airport pickup?",
                answer: "We offer **zero waiting charges** for up to 60 minutes after flight landing. We track flight status real-time."
            },
            {
                question: "Can I book a cab from Trichy to Chennai drop?",
                answer: "Yes, daily services available. The 330km drive takes about 5-6 hours on the NH45 GST road."
            }
        ]
    },
    {
        id: "salem",
        slug: "salem",
        name: "Salem",
        seoTitle: "Salem Taxi Service | Yercaud Hills & Outstation Cabs",
        metaDescription: "Best taxi service in Salem. Gateway to Yercaud. One way drop taxi to Bangalore, Coimbatore, Chennai. Steel Plant/Business visits. Book Etios/Innova.",
        h1: "Professional Taxi Service in Salem",
        keywords: [
            "Salem to Yercaud taxi fare",
            "One way taxi Salem to Bangalore",
            "Drop taxi Salem to Chennai",
            "Salem to Coimbatore cab",
            "Yercaud sightseeing packages",
            "Salem railway station taxi",
            "Outstation taxi Salem",
            "Innova rental Salem",
            "Dharmapuri to Salem taxi",
            "Kolli Hills taxi service"
        ],
        oneWayContent: "Salem is a crucial junction on NH44. Our **One Way Taxis** are heavily booked for **Bangalore** (just 4 hours away) and **Coimbatore** (3 hours away). Whether you are a student traveling to colleges in Coimbatore or a techie heading to Bangalore, our **Sedan and Etios** cabs offer the most economical connectivity.",
        roundTripContent: "Looking for a cool escape? **Yercaud** is just 45 minutes away. Our **Round Trip Packages** for Yercaud include sightseeing at the Lake, Lady's Seat, and Loop Road. For the adventurous, we also offer trips to **Kolli Hills** (famous for 70 hairpin bends). Our cars have powerful engines and excellent braking systems maintained for these terrains.",
        touristPlaces: [
            { name: "Yercaud", type: "Hill Station", distance: "30 km", bestFor: "Quick Getaway" },
            { name: "Mettur Dam", type: "Nature", distance: "50 km", bestFor: "Park, Water View" },
            { name: "Kolli Hills", type: "Hill Station", distance: "85 km", bestFor: "Adventure Drive" },
            { name: "Hogenakkal Falls", type: "Nature", distance: "90 km", bestFor: "Waterfalls, Coracle Ride" },
            { name: "1008 Lingam Temple", type: "Temple", distance: "10 km", bestFor: "Spirituality" }
        ],
        nearbyDistricts: ["dharmapuri", "namakkal", "erode", "krishnagiri"],
        recommendedVehicles: ["etios", "suv", "innova", "mini"],
        faqs: [
            {
                question: "How long does it take to climb Yercaud hills by taxi?",
                answer: "The Ghat road trip from Salem city to Yercaud top takes about **45 minutes to 1 hour**. It has 20 hairpin bends."
            },
            {
                question: "Is Salem to Bangalore a one-way service?",
                answer: "Yes, **Salem to Bangalore** is one of our busiest one-way routes. We have cabs leaving almost every hour. Book in advance for best rates."
            },
            {
                question: "Can I take a Mini taxi to Kolli Hills?",
                answer: "For Kolli Hills (70 hairpin bends), we strictly recommend a **Sedan (Etios) or SUV**. Mini cars may struggle with the steep gradient when fully loaded."
            },
            {
                question: "Do you provide pickup from Salem Junction Railway Station?",
                answer: "Yes, we offer **station pickup**. Our driver will wait at the main exit."
            },
            {
                question: "What is special about the Salem-Coimbatore route?",
                answer: "It is a 6-lane express highway. Our cabs cover this 160km distance in just **2.5 hours**, making it faster than many trains."
            }
        ]
    },
    {
        id: "tirunelveli",
        slug: "tirunelveli",
        name: "Tirunelveli",
        seoTitle: "Tirunelveli Taxi Service | Courtallam & Tiruchendur Drop",
        metaDescription: "Reliable Tirunelveli taxi booking. Drop taxi to Chennai, Madurai, Trivandrum. Courtallam falls season packages. Innova, Etios, Sedan available.",
        h1: "Nellai's Favorite Taxi Service",
        keywords: [
            "Tirunelveli to Chennai drop taxi",
            "Courtallam taxi packages",
            "Tirunelveli local cab booking",
            "Tiruchendur temple taxi",
            "Drop taxi Tirunelveli to Trivandrum",
            "Papanasam dam taxi",
            "Manimuthar falls cab",
            "Innova rental Tirunelveli",
            "Nellai to Madurai taxi",
            "One way cab Tirunelveli"
        ],
        oneWayContent: "Visiting Tirunelveli for a wedding or business? Our **One Way Taxi Services** provide hassle-free drops to **Madurai Airport (IXM)** and **Trivandrum Airport (TRV)**. We heavily serve the **Chennai-Tirunelveli** route (600+ km) with our long-distance specialized **Innova Crysta** and **Etios** fleet, ensuring a fatigue-free journey.",
        roundTripContent: "Tirunelveli is nature's paradise. During the season (June-Aug), our **Round Trip Packages to Courtallam** are in high demand. We also cover the **Nava Tirupati** temple circuit and **Tiruchendur Murugan Temple**. For families visiting the falls, our **SUVs** with carriers are perfect for carrying extra clothes and luggage.",
        touristPlaces: [
            { name: "Nellaiappar Temple", type: "Temple", distance: "City Center", bestFor: "Architecture" },
            { name: "Courtallam", type: "Nature", distance: "60 km", bestFor: "Waterfalls (Spa of South)" },
            { name: "Tiruchendur", type: "Temple", distance: "60 km", bestFor: "Sea-shore Temple" },
            { name: "Manimuthar Falls", type: "Nature", distance: "45 km", bestFor: "Scenic Drive" },
            { name: "Papanasam", type: "Nature", distance: "50 km", bestFor: "River Bath, Dam" }
        ],
        nearbyDistricts: ["thoothukudi", "tenkasi", "kanyakumari", "virudhunagar"],
        recommendedVehicles: ["suv", "innova-crysta", "etios", "sedan"],
        faqs: [
            {
                question: "When is the best time for a Courtallam taxi trip?",
                answer: "The 'Season' is typically from **June to August** when the Southwest monsoon brings water to all the falls (Main, Five, Old)."
            },
            {
                question: "Do you offer drop taxis to Trivandrum Airport from Tirunelveli?",
                answer: "Yes, it is a 3-3.5 hour drive. Many NRIs prefer our **Trivandrum Airport Drop** service for international flights."
            },
            {
                question: "Is Innova Crysta available for long Chennai trips?",
                answer: "Yes, for the 10-hour drive to Chennai, an **Innova Crysta** is highly recommended for its superior suspension and comfort."
            },
            {
                question: "Can we visit Manimuthar and Papanasam in one day?",
                answer: "Yes, both are in the same direction. Our **Ambasamudram Loop Package** covers Papanasam, Agasthiyar Falls, and Manimuthar Dam in a single day trip."
            },
            {
                question: "Are there tolls on the Tirunelveli-Madurai route?",
                answer: "Yes, it is a proper National Highway (NH44). Toll charges are extra or included in the package depending on your booking type."
            }
        ]
    },
    {
        id: "vellore",
        slug: "vellore",
        name: "Vellore",
        seoTitle: "Vellore Taxi Service | CMC Hospital & Golden Temple Cabs",
        metaDescription: "Patient-friendly taxi service in Vellore. Pickup/Drop for CMC Hospital. Golden Temple Sripuram tour packages. Cheap drop taxi to Chennai Airport.",
        h1: "Vellore's Most Trusted Cab Service",
        keywords: [
            "Vellore CMC taxi service",
            "Chennai airport to Vellore taxi",
            "Golden Temple Sripuram cab",
            "Vellore to Bangalore drop taxi",
            "One way taxi Vellore to Chennai",
            "Vellore local sightseeing taxi",
            "Yelagiri hills taxi from Vellore",
            "Innova taxi Vellore",
            "Katpadi railway station cab",
            "Amirthi zoological park taxi"
        ],
        oneWayContent: "Vellore is a major medical and educational hub. We specialize in **Patient Transfer Taxis** from **CMC Hospital** to **Chennai Airport** or **Bangalore**. Our drivers are trained to drive smoothly for patients. Students from **VIT** also frequently use our one-way group packages to Chennai for weekends.",
        roundTripContent: "Visiting the **Sripuram Golden Temple**? Our **Round Trip Cab** can pick you up from Katpadi station, take you for Darshan, and drop you back. For a weekend getaway, we offer packages to **Yelagiri Hills** (just 1.5 hours away). An **Etios** or **Sedan** is sufficient and economical for these short trips.",
        touristPlaces: [
            { name: "Golden Temple (Sripuram)", type: "Temple", distance: "8 km", bestFor: "Spiritual, Night View" },
            { name: "Vellore Fort", type: "Heritage", distance: "City Center", bestFor: "History, Museum" },
            { name: "CMC Hospital", type: "Hospital", distance: "City Center", bestFor: "Medical Care" },
            { name: "Yelagiri Hills", type: "Hill Station", distance: "90 km", bestFor: "Boating, Trekking" },
            { name: "Amirthi Zoo", type: "Nature", distance: "25 km", bestFor: "Waterfalls, Zoo" }
        ],
        nearbyDistricts: ["ranipet", "tirupathur", "tiruvannamalai", "kanchipuram"],
        recommendedVehicles: ["sedan", "sedan-non-cng", "etios", "innova"],
        faqs: [
            {
                question: "Do you provide taxi service for patients visiting CMC?",
                answer: "Yes, we prioritize **CMC patient pickups**. Please simulate 'Patient on Board' request so our driver arrives with a spacious vehicle (Etios) for comfort."
            },
            {
                question: "How much is the taxi fare from Chennai Airport to Vellore?",
                answer: "It is roughly 130 km. One-way sedan fares usually start around **₹2500 - ₹2800**. It takes about 2.5 to 3 hours."
            },
            {
                question: "Can we cover Golden Temple and Vallimalai in one day?",
                answer: "Yes, easily. Start with the Fort in the morning, Vallimalai in the afternoon, and Golden Temple in the evening for the lighting view."
            },
            {
                question: "Is Yelagiri ghat road safe for small cars?",
                answer: "Yelagiri has 14 hairpin bends but the road is wide. A **Mini** or **Sedan** can easily climb it. It's a beginner-friendly hill station."
            },
            {
                question: "Do you offer pickups from Katpadi Junction?",
                answer: "Yes, Katpadi (KPD) is the main railhead. Our drivers will wait at the main entrance parking area."
            }
        ]
    },
    {
        id: "erode",
        slug: "erode",
        name: "Erode",
        seoTitle: "Erode Taxi Service | Outstation Cabs & Textile Hub Drop",
        metaDescription: "Best taxi service in Erode. Drop taxi to Coimbatore, Tirupur, Salem. Bhavani Sangameshwarar temple trips. Safe & clean cabs for family.",
        h1: "Premier Taxi Service in Erode",
        keywords: [
            "Erode to Coimbatore taxi",
            "One way taxi Erode to Chennai",
            "Bhavani Sangameshwarar temple cab",
            "Erode railway station taxi",
            "Drop taxi Erode to Salem",
            "Kodiveri dam taxi",
            "Chennimalai temple cab",
            "Erode local cab booking",
            "Outstation taxi from Erode",
            "Innova rental Erode"
        ],
        oneWayContent: "Erode, the Turmeric City, is a major logistic hub. We provide frequent **One Way Taxis** to **Coimbatore Airport (CJB)** and **Salem**. Business travelers from the textile industry rely on our **Etios** fleet for day trips to **Tirupur** and **Karur**. We maintain strict punctuality for these business corridors.",
        roundTripContent: "Spiritual seekers visit Erode for the **Bhavani Sangameshwarar Temple** (Triveni Sangam of South). Our **Round Trip Packages** cover Bhavani, **Chennimalai Murugan Temple**, and **Kodiveri Dam**. For a family picnic at Kodiveri falls, book our **SUV** to carry picnic baskets and extra clothes comfortably.",
        touristPlaces: [
            { name: "Bhavani Sangameshwarar", type: "Temple", distance: "15 km", bestFor: "Pilgrimage, River" },
            { name: "Chennimalai", type: "Temple", distance: "30 km", bestFor: "Hill Temple" },
            { name: "Kodiveri Dam", type: "Nature", distance: "45 km", bestFor: "Waterfalls, Picnic" },
            { name: "Bannari Amman", type: "Temple", distance: "60 km", bestFor: "Pilgrimage" },
            { name: "Vellode Bird Sanctuary", type: "Nature", distance: "15 km", bestFor: "Bird Watching" }
        ],
        nearbyDistricts: ["salem", "namakkal", "tirupur", "coimbatore"],
        recommendedVehicles: ["etios", "mini", "sedan", "suv"],
        faqs: [
            {
                question: "How far is Kodiveri Dam from Erode?",
                answer: "It is about **45 km**. A one-hour drive through scenic paddy fields. Great for a half-day trip."
            },
            {
                question: "Do you maintain daily trips to Coimbatore?",
                answer: "Yes, Erode to Coimbatore is a very high-frequency route. We offer shared and dedicated cab options."
            },
            {
                question: "Can I get a taxi from Erode to Chennai at night?",
                answer: "Yes, our **Night Service** drivers are available. The drive takes about 6-7 hours. We recommend an updated Sedan for night safety."
            },
            {
                question: "Is there a drop taxi to Palani from Erode?",
                answer: "Yes, lakhs of devotees travel from Erode to Palani. We have special **Pada Yatra Support** vehicles as well as regular drop taxis."
            },
            {
                question: "What is the best vehicle for textile sample shopping?",
                answer: "If you are visiting for textile sourcing with huge sample bags, we recommend an **Innova** or **SUV** with the last row folded for cargo space."
            }
        ]
    },
    {
        id: "tiruppur",
        slug: "tiruppur",
        name: "Tiruppur",
        seoTitle: "Tiruppur Taxi Service | Knitwear Hub & Airport Drop",
        metaDescription: "Top taxi service in Tiruppur. Pickups for international buyers. Drop taxi to Coimbatore Airport & Chennai. Avinashi temple trips.",
        h1: "Tiruppur's Business Class Taxi",
        keywords: [
            "Tiruppur to Coimbatore airport taxi",
            "Tiruppur export company cab",
            "One way taxi Tiruppur to Chennai",
            "Avinashi temple taxi",
            "Tiruppur to Bangalore drop taxi",
            "Local cab service Tiruppur",
            "Amaravathi dam taxi",
            "Innova Crysta Tiruppur",
            "Outstation cabs Tiruppur",
            "Tiruppur railway station pickup"
        ],
        oneWayContent: "As the Knitwear Capital, Tiruppur sees global movement. Our **Airport Transfer Service** to **Coimbatore Airport** is reliable for international buyers. We also run daily **One Way Drops to Chennai** for export cargo managing teams. Our **Innova Crysta** fleet is popular among corporate guests visiting factory outlets.",
        roundTripContent: " Need a break from the factory grind? Take a **Round Trip Taxi** to **Amaravathi Dam** or **Thirumoorthy Hills**. These scenic spots are just an hour away. The **Avinishiappar Temple** represents the soul of the district – perfect for a quick evening spiritual drive.",
        touristPlaces: [
            { name: "Avinashi Temple", type: "Temple", distance: "15 km", bestFor: "Architecture" },
            { name: "Thirumoorthy Hills", type: "Nature", distance: "50 km", bestFor: "Dam, Temple, Falls" },
            { name: "Amaravathi Dam", type: "Nature", distance: "60 km", bestFor: "Crocodile Park" },
            { name: "Grass Hills", type: "Nature", distance: "Limit", bestFor: "Restricted Forest View" },
            { name: "Noyyal River", type: "Nature", distance: "City", bestFor: "River View" }
        ],
        nearbyDistricts: ["coimbatore", "erode", "dindigul", "karur"],
        recommendedVehicles: ["innova-crysta", "sedan", "suv", "etios"],
        faqs: [
            {
                question: "Do you offer monthly cab contracts for export companies?",
                answer: "Yes, we provide **Corporate Employee Transportation** and monthly rental cabs for export houses in Tiruppur."
            },
            {
                question: "Distance from Tiruppur to Coimbatore Airport?",
                answer: "It is roughly **45-50 km**. It takes about 1 hour 15 minutes depending on traffic."
            },
            {
                question: "Can we visit Thirumoorthy Falls in a Sedan?",
                answer: "Yes, the road is good. The falls require a small walk from the parking area. A **Sedan** is perfectly suitable."
            },
            {
                question: "Is there a drop taxi to Bangalore from Tiruppur?",
                answer: "Yes, we have a daily **Tiruppur-Bangalore** service via Salem. Travel time is around 5 hours."
            },
            {
                question: "Do you accept foreign cards for payment?",
                answer: "We accept UPI and Cash. For international clients, we can arrange online payment links (credit cards) on prior request."
            }
        ]
    },
    {
        id: "thanjavur",
        slug: "thanjavur",
        name: "Thanjavur",
        seoTitle: "Thanjavur Taxi Service | Big Temple & Delta Tours",
        metaDescription: "Official Thanjavur taxi service. Visit Brihadeeswarar Temple (Big Temple). Drop taxi to Trichy Airport, Kumbakonam, Velankanni.",
        h1: "Thanjavur Cultural Taxi Service",
        keywords: [
            "Thanjavur Big Temple taxi",
            "Thanjavur to Trichy airport taxi",
            "Kumbakonam Navagraha taxi from Thanjavur",
            "Thanjavur local sightseeing cab",
            "One way taxi Thanjavur to Chennai",
            "Drop taxi Thanjavur to Madurai",
            "Velankanni trip from Thanjavur",
            "Innova rental Thanjavur",
            "Poondi Madha church taxi",
            "Thanjavur railway station cab"
        ],
        oneWayContent: "Thanjavur is the heart of Tamil culture. Visitors often need **One Way Drops to Trichy Airport** (just 1 hour away). We also connect Thanjavur to **Velankanni** and **Rameswaram** for pilgrims. Our drivers are locals who can guide you to the best **Tanjore Painting** and **Dancing Doll** shops without tourist traps.",
        roundTripContent: "Explore the Great Living Chola Temples. Our **UNESCO Heritage Package** covers **Big Temple**, **Gangaikonda Cholapuram**, and **Darasuram** in a single day. For Catholics, a round trip to **Poondi Madha Basilica** is a popular choice. We recommend an **AC Sedan** as the Delta region can get quite humid.",
        touristPlaces: [
            { name: "Brihadeeswarar Temple", type: "Heritage", distance: "City Center", bestFor: "UNESCO Site" },
            { name: "Thanjavur Palace", type: "Heritage", distance: "2 km", bestFor: "Museum, Art" },
            { name: "Gangaikonda Cholapuram", type: "Heritage", distance: "70 km", bestFor: "Architecture" },
            { name: "Poondi Madha Basilica", type: "Temple", distance: "35 km", bestFor: "Pilgrimage" },
            { name: "Manora Fort", type: "Heritage", distance: "65 km", bestFor: "Sea View Fort" }
        ],
        nearbyDistricts: ["trichy", "tiruvarur", "pudukkottai", "ariyalur"],
        recommendedVehicles: ["sedan", "suv", "etios", "mini"],
        faqs: [
            {
                question: "How much time is needed for the Big Temple visit?",
                answer: "We recommend at least **2-3 hours**. The temple complex is huge, and you shouldn't miss the inscriptions and the Nandi statue."
            },
            {
                question: "Taxi fare from Thanjavur to Trichy Airport?",
                answer: "It is a short 55km drive. One-way fare is very affordable, typically around **₹1200 - ₹1500** for a sedan."
            },
            {
                question: "Can you arrange a guide for the temple tour?",
                answer: "While we don't employ guides, our drivers can introduce you to government-authorized guides at the temple entrance."
            },
            {
                question: "Is there a direct drop to Velankanni?",
                answer: "Yes, Thanjavur to Velankanni is about 90km. It takes 2 hours. Many devotees take a **One Way Drop** to stay there."
            },
            {
                question: "Do you cover the Navagraha temples from Thanjavur?",
                answer: "Yes, Thanjavur is a great base for the tour. Kumbakonam is just 40km away. We have **2 Day / 3 Day Navagraha Packages**."
            }
        ]
    },
    {
        id: "kanyakumari",
        slug: "kanyakumari",
        name: "Kanyakumari",
        seoTitle: "Kanyakumari Taxi Service | Sunrise Point & Trivandrum Drop",
        metaDescription: "Best taxi service in Kanyakumari. Visit Vivekananda Rock, Thiruvalluvar Statue. Drop taxi to Trivandrum Airport & Madurai. Nagercoil local cabs.",
        h1: "Kanyakumari's Premier Taxi Service",
        keywords: [
            "Kanyakumari to Trivandrum airport taxi",
            "Nagercoil taxi service",
            "Kanyakumari local sightseeing cab",
            "Vivekananda Rock drop taxi",
            "One way taxi Kanyakumari to Chennai",
            "Suchindram temple taxi",
            "Kanyakumari to Rameswaram cab",
            "Muttom beach taxi",
            "Kanyakumari tour packages",
            "Innova rental Kanyakumari"
        ],
        oneWayContent: "Kanyakumari (Cape Comorin) is the southern tip of India. We specialize in **Trivandrum Airport Drops** (just 3 hours away) for tourists and NRIs. Our **One Way Taxis** to **Madurai** and **Chennai** are popular for those ending their South India tour. We serve the entire district including **Nagercoil** and **Marthandam**.",
        roundTripContent: "Witness the sunrise where three seas meet. Our **Round Trip Packages** cover the **Vivekananda Rock Memorial**, **Thiruvalluvar Statue**, and **Bhagavathi Amman Temple**. We also offer excursions to **Padmanabhapuram Palace** (the largest wooden palace in Asia) and the pristine **Muttom Beach**. Our AC cars provide relief from the coastal humidity.",
        touristPlaces: [
            { name: "Vivekananda Rock", type: "Nature", distance: "Ferry Point", bestFor: "Meditation, Ocean View" },
            { name: "Thiruvalluvar Statue", type: "Heritage", distance: "Ferry Point", bestFor: "Iconic Landmark" },
            { name: "Bhagavathi Amman Temple", type: "Temple", distance: "City Center", bestFor: "Pilgrimage" },
            { name: "Padmanabhapuram Palace", type: "Heritage", distance: "35 km", bestFor: "Architecture" },
            { name: "Muttom Beach", type: "Beach", distance: "30 km", bestFor: "Sunset, Rocks" }
        ],
        nearbyDistricts: ["tirunelveli", "thoothukudi", "trivandrum"],
        recommendedVehicles: ["etios", "innova", "mini", "suv"],
        faqs: [
            {
                question: "Taxi fare from Kanyakumari to Trivandrum Airport?",
                answer: "It is approximately 90-100 km. A one-way drop in a Sedan costs around **₹2500 - ₹2800**. Travel time is 3 hours."
            },
            {
                question: "Do you arrange ferry tickets for Vivekananda Rock?",
                answer: "We drop you at the ferry point ticket counter. Ferry tickets must be purchased in person or online via the official tourism site."
            },
            {
                question: "Is there a direct taxi to Rameswaram?",
                answer: "Yes, the **Kanyakumari to Rameswaram** coastal drive (via ECR) is scenic. It is a 310 km drive and takes about 6 hours."
            },
            {
                question: "Can we cover Suchindram Temple on the way to Nagercoil?",
                answer: "Absolutely. Suchindram Thanumalayan Temple is on the main route. We can stop there for Darshan (allow 1 hour)."
            },
            {
                question: "Best time to view Sunrise?",
                answer: "Sunrise is usually between 6:00 AM - 6:30 AM. We can arrange an early morning pickup from your hotel to the view point."
            }
        ]
    },
    {
        id: "ramanathapuram",
        slug: "ramanathapuram",
        name: "Ramanathapuram",
        seoTitle: "Rameswaram Taxi Service | Pamban Bridge & Dhanushkodi Jeep",
        metaDescription: "Trusted Ramanathapuram & Rameswaram taxi. Madurai airport pickups. Dhanushkodi ghost town tours. Pamban bridge view. AC Cabs for pilgrimage.",
        h1: "Rameswaram & Ramnad Taxi Service",
        keywords: [
            "Rameswaram taxi service",
            "Madurai to Rameswaram taxi fare",
            "Dhanushkodi jeep taxi booking",
            "Pamban bridge taxi view",
            "Ramanathapuram to Chennai drop taxi",
            "Rameswaram local sightseeing",
            "Dr Abdul Kalam memorial taxi",
            "Agni Theertham cab",
            "Erwadi dargah taxi",
            "Rameswaram railway station cab"
        ],
        oneWayContent: "Ramanathapuram is the gateway to the holy island of **Rameswaram**. Most pilgrims arrive at **Madurai Airport** and book our **One Way Taxi** for the 3-hour drive to Rameswaram. We also connect **Ramnad** town to **Trichy** and **Chennai** for local business travelers.",
        roundTripContent: "The **Kashi Yatra** is incomplete without Rameswaram. Our **Pilgrimage Packages** cover the **Ramanathaswamy Temple** (22 Wells bath), **Agni Theertham**, and **Pamban Bridge**. We can also arrange the special 4x4 Jeep or Van required to enter the **Dhanushkodi Ghost Town** (Arichal Munai), where the road ends in the ocean.",
        touristPlaces: [
            { name: "Ramanathaswamy Temple", type: "Temple", distance: "Rameswaram", bestFor: "Jyotirlinga, 22 Wells" },
            { name: "Dhanushkodi", type: "Nature", distance: "20 km", bestFor: "Ghost Town, Land's End" },
            { name: "Pamban Bridge", type: "City", distance: "12 km", bestFor: "Sea Bridge View" },
            { name: "Abdul Kalam Memorial", type: "Heritage", distance: "5 km", bestFor: "Museum" },
            { name: "Erwadi Dargah", type: "Temple", distance: "25 km (from Ramnad)", bestFor: "Pilgrimage" }
        ],
        nearbyDistricts: ["sivaganga", "madurai", "tuticorin", "virudhunagar"],
        recommendedVehicles: ["innova", "suv", "tempo", "etios"],
        faqs: [
            {
                question: "Do taxis go up to Dhanushkodi point?",
                answer: "Regular taxis can go up to the checkpost. For the final stretch to Arichal Munai (Land's End), you may need to board the government shuttle or authorized vans depending on current regulations."
            },
            {
                question: "How long is the drive from Madurai to Rameswaram?",
                answer: "It is about **175 km** and takes 3 to 3.5 hours on the NH87. It's a smooth 4-lane road for most parts."
            },
            {
                question: "Is there a dress code for the temple taxi?",
                answer: "Our taxis have no dress code, but the Temple strictly prohibits jeans/leggings. Men must wear Dhoti/Pyjama and Women must wear Saree/Chudidhar."
            },
            {
                question: "Can we stop on Pamban Bridge for photos?",
                answer: "Stopping vehicles on the bridge is restricted for safety. However, we can drive slowly so you can enjoy the view and take photos from inside."
            },
            {
                question: "Do you have large vehicles for joint families?",
                answer: "Yes, Rameswaram trips often involve large groups. We have **Innova (7 Seater)** and **Tempo Travellers (12+ Seater)** available."
            }
        ]
    },
    {
        id: "nagapattinam",
        slug: "nagapattinam",
        name: "Nagapattinam",
        seoTitle: "Nagapattinam Taxi | Velankanni Church & Nagore Dargah Drop",
        metaDescription: "Reliable Nagapattinam cab service. Velankanni Church pickup & drop. Nagore Dargah trips. One way taxi to Chennai, Trichy. Safe family cars.",
        h1: "Velankanni & Nagapattinam Taxi Service",
        keywords: [
            "Velankanni church taxi booking",
            "Chennai to Velankanni drop taxi",
            "Nagore Dargah taxi service",
            "Nagapattinam to Trichy airport taxi",
            "Velankanni to Bangalore cabs",
            "Karaikal drop taxi",
            "Sikkal Singaravelan temple cab",
            "Poompuhar beach taxi",
            "One way cab Nagapattinam",
            "Velankanni railway station pickup"
        ],
        oneWayContent: "Nagapattinam is the land of religious harmony. We operate heavily on the **Chennai to Velankanni** route (300+ km) for pilgrims visiting the Basilica. We also provide **One Way Drops to Trichy Airport** for international devotees visiting **Nagore Dargah**. Our drivers are respectful of all religious customs.",
        roundTripContent: "Planning a spiritual weekend? Our **Unity Package** covers **Velankanni Basilica**, **Nagore Dargah**, and **Sikkal Singaravelan Temple** in one trip. We also offer rides to the historic **Poompuhar Beach** and **Tranquebar (Tharangambadi)** Danish Fort. Our **Innova** cars are preferred for these long coastal drives.",
        touristPlaces: [
            { name: "Velankanni Basilica", type: "Temple", distance: "12 km", bestFor: "Catholic Pilgrimage" },
            { name: "Nagore Dargah", type: "Temple", distance: "5 km", bestFor: "Sufi Shrine" },
            { name: "Sikkal Singaravelan", type: "Temple", distance: "6 km", bestFor: "Murugan Temple" },
            { name: "Poompuhar", type: "Heritage", distance: "45 km", bestFor: "Chola History, Beach" },
            { name: "Kodikkarai", type: "Nature", distance: "50 km", bestFor: "Wildlife Sanctuary" }
        ],
        nearbyDistricts: ["tiruvarur", "thanjavur", "karaikal", "mayiladuthurai"],
        recommendedVehicles: ["innova", "suv", "etios", "sedan"],
        faqs: [
            {
                question: "Distance from Chennai to Velankanni by taxi?",
                answer: "It is about **310-320 km** via ECR or NH45. It takes 6-7 hours. Our driver can take the route you prefer."
            },
            {
                question: "Do you offer hotel pickup in Velankanni?",
                answer: "Yes, we can pick you up from any lodge or hotel near the Church Morning Star / Main Shrine area."
            },
            {
                question: "Is there a direct cab to Bangalore from Velankanni?",
                answer: "Yes, it is a long drive (450+ km). We recommend an **Innova** or **Crysta** for comfort. The journey takes about 9-10 hours."
            },
            {
                question: "Can we visit Thirunallar (Saneeswara) temple from here?",
                answer: "Yes, Thirunallar (Karaikal) is just 30 km away. We can easily include it in your round trip package."
            },
            {
                question: "Taxi fare for Nagapattinam to Trichy drop?",
                answer: "It is around 145 km. A Sedan drop typically costs between **₹2800 - ₹3200** depending on the season."
            }
        ]
    },
    {
        id: "cuddalore",
        slug: "cuddalore",
        name: "Cuddalore",
        seoTitle: "Cuddalore Taxi Service | Chidambaram Natarajar & Pichavaram",
        metaDescription: "Top Cuddalore taxi service. Chidambaram Natarajar temple tours. Pichavaram mangrove boat rides. Drop taxi to Pondicherry, Chennai, Neyveli.",
        h1: "Cuddalore District Taxi Service",
        keywords: [
            "Chidambaram Natarajar temple taxi",
            "Pichavaram mangrove forest cab",
            "Cuddalore to Chennai drop taxi",
            "Neyveli township taxi service",
            "Pondicherry to Chidambaram cab",
            "Vadalur Vallalar temple taxi",
            "Silver beach Cuddalore cab",
            "Cuddalore port taxi",
            "Annamalai University cab",
            "One way taxi Cuddalore to Bangalore"
        ],
        oneWayContent: "Cuddalore extends from the port town to the temple town of Chidambaram. We serve the **Neyveli Lignite Corporation (NLC)** township with **One Way Apps to Chennai**. Tourists in Pondicherry often book our **Day Trip Cabs** to visit the **Pichavaram Mangrove Forest** and **Chidambaram**. We maintain clean vehicles suitable for international tourists.",
        roundTripContent: "Unlock the secrets of the Cosmic Dancer! Our **Chidambaram Package** takes you to the **Thillai Natarajar Temple**. Afterward, enjoy a boat ride in the world's second-largest mangrove forest at **Pichavaram**. We also cover **Vadalur Satya Gnana Sabha** for spiritual seekers. Our drivers know the best vegetarian mess (eateries) in Chidambaram.",
        touristPlaces: [
            { name: "Natarajar Temple", type: "Temple", distance: "Chidambaram", bestFor: "Cosmic Dance, Architecture" },
            { name: "Pichavaram", type: "Nature", distance: "15 km (from Chidambaram)", bestFor: "Mangrove Boating" },
            { name: "Silver Beach", type: "Beach", distance: "Cuddalore", bestFor: "Relaxation" },
            { name: "Vadalur", type: "Temple", distance: "35 km", bestFor: "Vallalar Shrine" },
            { name: "Neyveli", type: "City", distance: "40 km", bestFor: "Industrial Town" }
        ],
        nearbyDistricts: ["pondicherry", "villupuram", "nagapattinam", "ariyalur"],
        recommendedVehicles: ["etios", "sedan", "mini", "innova"],
        faqs: [
            {
                question: "Best time to visit Pichavaram Mangroves?",
                answer: "Morning 9 AM to 4 PM is the boating time. We recommend reaching by 10 AM to avoid the noon sun."
            },
            {
                question: "Taxi fare from Pondicherry to Chidambaram?",
                answer: "It is about 65 km. A round trip (drop and return after sightseeing) is very economical, usually costing around **₹2500** for a full day."
            },
            {
                question: "Do you service Annamalai University students?",
                answer: "Yes, we provide student-friendly group packages for Annamalai University students traveling to Chennai/Bangalore during holidays."
            },
            {
                question: "Is Neyveli a restricted area?",
                answer: "The township is open, but the Mines/Plant require permission. We can drop you at the Township Main Gate or Guest Houses."
            },
            {
                question: "Distance from Cuddalore to Chennai Airport?",
                answer: "It is about 180 km via ECR. The drive takes 3.5 to 4 hours."
            }
        ]
    },
    {
        id: "thoothukudi",
        slug: "thoothukudi",
        name: "Thoothukudi",
        seoTitle: "Thoothukudi Taxi Service | Pearl City & Airport Drop",
        metaDescription: "Best taxi in Thoothukudi (Tuticorin). Airport pickup & drop. Tiruchendur temple trips. One way taxi to Tirunelveli, Madurai, Chennai.",
        h1: "Pearl City Taxi Service",
        keywords: [
            "Thoothukudi airport taxi",
            "Tuticorin to Tiruchendur taxi",
            "One way taxi Thoothukudi to Chennai",
            "Hare Island taxi drop",
            "Drop taxi Tuticorin to Madurai",
            "Panchalankurichi fort cab",
            "Manapad beach taxi",
            "Thoothukudi local cabs",
            "Our Lady of Snows basilica taxi",
            "Tuticorin port cab service"
        ],
        oneWayContent: "Thoothukudi (Tuticorin) is an emerging industrial and energy hub. We provide 24/7 **Airport Taxis** for connectivity to **TCR Airport**. Business executives use our **Sedan** fleet for factory visits. We also run daily **One Way Drops to Madurai** and **Tirunelveli**, ensuring timely connections for trains and flights.",
        roundTripContent: "Explore the coastal heritage! Our **Pearl City Tour** covers **Our Lady of Snows Basilica** (Panimaya Matha) and the scenic **Hare Island**. Devotees can book a round trip to **Tiruchendur Murugan Temple** (just 40 km away). For history buffs, a drive to **Panchalankurichi** (Kattabomman Fort) is a must.",
        touristPlaces: [
            { name: "Tiruchendur Temple", type: "Temple", distance: "40 km", bestFor: "Seashore Murugan" },
            { name: "Our Lady of Snows", type: "Temple", distance: "City Center", bestFor: "Basilica" },
            { name: "Hare Island", type: "Beach", distance: "9 km", bestFor: "Picnic, Sea View" },
            { name: "Panchalankurichi", type: "Heritage", distance: "25 km", bestFor: "Fort, History" },
            { name: "Manapad", type: "Beach", distance: "55 km", bestFor: "Surfing, Church" }
        ],
        nearbyDistricts: ["tirunelveli", "virudhunagar", "ramanathapuram"],
        recommendedVehicles: ["etios", "sedan", "suv", "innova"],
        faqs: [
            {
                question: "How far is Tiruchendur from Thoothukudi Airport?",
                answer: "It is about **40 km**. We can pick you up from TCR Airport and drop you directly at the Tiruchendur temple/hotel."
            },
            {
                question: "Do you provide cabs for Manapad surfing festival?",
                answer: "Yes, Manapad is growing popular for surfing. We can arrange drop and pickup. Note that it is a coastal village."
            },
            {
                question: "Taxi fare for Thoothukudi to Madurai drop?",
                answer: "It is roughly 150 km. A one-way drop typically costs around **₹2800 - ₹3000** on the new highway."
            },
            {
                question: "Is Uber/Ola available in Tuticorin?",
                answer: "Availability can be sparse. It is safer to pre-book a **Cabigo Taxi** for reliable timing, especially for early morning flights."
            },
            {
                question: "Can we visit Kattabomman Fort on the way to Madurai?",
                answer: "Yes, Panchalankurichi is slightly off the highway but easily coverable with a small detour."
            }
        ]
    },
    {
        id: "tiruvannamalai",
        slug: "tiruvannamalai",
        name: "Tiruvannamalai",
        seoTitle: "Tiruvannamalai Taxi Service | Girivalam & Arunachalam Cabs",
        metaDescription: "No.1 Tiruvannamalai taxi service. Girivalam special cabs. Drop taxi to Bangalore, Chennai, Pondicherry. Sathanur Dam trips.",
        h1: "Arunachala Taxi Service",
        keywords: [
            "Tiruvannamalai girivalam taxi",
            "Tiruvannamalai to Bangalore one way taxi",
            "Chennai to Tiruvannamalai cab fare",
            "Arunachaleswarar temple taxi",
            "Ramana Ashram cab booking",
            "Sathanur dam taxi service",
            "Drop taxi Tiruvannamalai to Pondicherry",
            "Gingee fort tour taxi",
            "Tiruvannamalai railway station cab",
            "Innova rental for Girivalam"
        ],
        oneWayContent: "Tiruvannamalai is a global spiritual destination. We are experts in **Chennai to Tiruvannamalai** and **Bangalore to Tiruvannamalai** drops. During **Pournami (Full Moon)**, we deploy extra fleets to handle the rush. Our drivers are experienced in navigating the city traffic during festival days.",
        roundTripContent: "Experience the divinity of Arunachala. Our **Girivalam Package** drops you near the path and waits. We also cover **Ramana Ashram** and **Virupaksha Cave**. For a nature break, take a trip to **Sathanur Dam** (film shooting spot) or the historic **Gingee Fort** (Troy of the East).",
        touristPlaces: [
            { name: "Arunachaleswarar Temple", type: "Temple", distance: "City Center", bestFor: "Shiva Temple" },
            { name: "Sathanur Dam", type: "Nature", distance: "35 km", bestFor: "Park, Crocodiles" },
            { name: "Gingee Fort", type: "Heritage", distance: "40 km", bestFor: "Trekking, History" },
            { name: "Ramana Ashram", type: "Temple", distance: "3 km", bestFor: "Meditation" },
            { name: "Parvathamalai", type: "Hill Station", distance: "50 km", bestFor: "Trekking Pilgrimage" }
        ],
        nearbyDistricts: ["vellore", "villupuram", "krishnagiri", "dharmapuri"],
        recommendedVehicles: ["etios", "suv", "mini", "innova"],
        faqs: [
            {
                question: "Is taxi allowed for Girivalam path?",
                answer: "Vehicles are generally **not allowed** on the Girivalam path during Pournami (Full Moon) due to the crowd. We can drop you at the starting point."
            },
            {
                question: "Distance from Bangalore to Tiruvannamalai?",
                answer: "It is about **200 km**. It takes 4 to 5 hours. We have daily one-way shuttles on this route."
            },
            {
                question: "Can we trek Gingee Fort in one day?",
                answer: "Yes, it takes 2-3 hours to climb. It is best to go early morning (8 AM) to avoid the heat. We can wait at the base."
            },
            {
                question: "Do you have service from Chennai Airport?",
                answer: "Yes, many devotees land in Chennai and take our cab directly to the Ashram. It is a 4-hour drive."
            },
            {
                question: "Is Sathanur Dam open for tourists?",
                answer: "Yes, the park and dam view are open. The crocodile bank is a highlight for kids."
            }
        ]
    },
    {
        id: "nilgiris",
        slug: "nilgiris",
        name: "Nilgiris (Ooty)",
        seoTitle: "Ooty Taxi Service | Nilgiris Sightseeing & Resort Drop",
        metaDescription: "Safe taxi for Ooty & Coonoor. Expert hill drivers for 36 hairpin bends. Pickup from Coimbatore, Bangalore, Mysore. Innova Crysta for comfort.",
        h1: "Ooty & Nilgiris Taxi Service",
        keywords: [
            "Ooty sightseeing taxi rates",
            "Coimbatore to Ooty taxi fare",
            "Coonoor toy train station cab",
            "Ooty to Bangalore drop taxi",
            "Pykara boat house taxi",
            "Avalanche lake safari jeep",
            "Kotagiri drop taxi",
            "Mettupalayam to Ooty taxi",
            "Ooty honeymoon cab packages",
            "Resort drop taxi Ooty"
        ],
        oneWayContent: "The Queen of Hill Stations requires expert driving. Our **Hill-Specialist Drivers** ensure a safe climb through the **36 Hairpin Bends** (Kallaran route) or the scenic Kotagiri route. We provide dedicated **One Way Drops** to resorts in **Ooty, Coonoor, and Kotagiri** from Coimbatore Airport or Railway Station.",
        roundTripContent: "Experience the Blue Mountains stress-free. Our **Ooty Sightseeing Packages** cover **Botanical Gardens**, **Rose Garden**, **Doddabetta Peak**, and **Pykara Lake**. Unlike local autos, our **Private Cab** stays with you for the full 2-3 days, allowing you to explore hidden gems like **Avalanche** and the tea museums at your own pace.",
        touristPlaces: [
            { name: "Ooty Lake", type: "Nature", distance: "City Center", bestFor: "Boating" },
            { name: "Doddabetta Peak", type: "Hill Station", distance: "10 km", bestFor: "View Point" },
            { name: "Pykara Falls", type: "Nature", distance: "20 km", bestFor: "Waterfalls, Boating" },
            { name: "Sim's Park (Coonoor)", type: "Nature", distance: "20 km", bestFor: "Rare Trees" },
            { name: "Dolphin's Nose", type: "Hill Station", distance: "30 km", bestFor: "View Point" }
        ],
        nearbyDistricts: ["coimbatore", "erode", "mysore", "wayanad"],
        recommendedVehicles: ["innova", "innova-crysta", "suv", "etios"],
        faqs: [
            {
                question: "Do you have drivers experienced in hill driving?",
                answer: "Yes, this is our priority. We only assign drivers with **minimum 5 years of hill driving experience** for Ooty trips to ensure safety on hairpin bends."
            },
            {
                question: "Is AC switched off during the hill climb?",
                answer: "In smaller vehicles, AC might be turned off briefly on very steep inclines to prevent engine overheating. However, our **Innova** and **Crysta** fleet handles climbs with AC comfortably."
            },
            {
                question: "Taxi fare from Mettupalayam to Ooty?",
                answer: "It is a 50 km climb. A drop typically costs **₹1800 - ₹2200** depending on the vehicle. Time taken is 2.5 hours."
            },
            {
                question: "Can we visit Masinagudi/Mudumalai?",
                answer: "Yes, the Ooty-Mysore road via Masinagudi is a wildlife zone. We can drop you at resorts there, but night driving is banned in the forest."
            },
            {
                question: "Do you pick up from Coimbatore Airport?",
                answer: "Yes, we are the preferred choice for tourists landing in CJB. We track your flight and wait at the arrivals."
            }
        ]
    },
    {
        id: "dindigul",
        slug: "dindigul",
        name: "Dindigul",
        seoTitle: "Kodaikanal & Palani Taxi Service | Dindigul Cabs",
        metaDescription: "Best taxi for Kodaikanal trip & Palani temple. Pickup from Dindigul station. Drop taxi to Madurai, Trichy, Bangalore. Hill expert drivers.",
        h1: "Kodaikanal & Dindigul Taxi Service",
        keywords: [
            "Kodaikanal taxi service",
            "Palani temple taxi booking",
            "Dindigul to Kodaikanal cab fare",
            "Kodai road station to Kodaikanal taxi",
            "Berijam lake permission taxi",
            "One way taxi Dindigul to Chennai",
            "Sirumalai hills cab",
            "Palani to Madurai drop taxi",
            "Mannavanur lake tour cab",
            "Innova rental for Kodaikanal"
        ],
        oneWayContent: "Dindigul district houses the 'Princess of Hill Stations'. We operate hundreds of trips from **Kodai Road Station** and **Dindigul Junction** to **Kodaikanal**. Pilgrims also use our services for **Palani Murugan Temple**, arriving from all over Tamil Nadu. We offer affordable **One Way Drops** to nearby airports like **Madurai** and **Trichy**.",
        roundTripContent: "Escape to the misty hills! Our **Kodaikanal Package** covers **Coaker's Walk**, **Pillar Rocks**, and the serene **Berijam Lake** (forest permission required). For a spiritual detour, include **Palani** in your itinerary. Our drivers are well-versed with the forest check-post timings and safe driving practices in fog.",
        touristPlaces: [
            { name: "Kodaikanal Lake", type: "Hill Station", distance: "90 km (from Dindigul)", bestFor: "Boating, Cycling" },
            { name: "Palani Temple", type: "Temple", distance: "60 km", bestFor: "Murugan Pilgrimage" },
            { name: "Pillar Rocks", type: "Nature", distance: "Kodai", bestFor: "View Point" },
            { name: "Sirumalai", type: "Hill Station", distance: "25 km", bestFor: "Offbeat Hill" },
            { name: "Thalaiyar Falls", type: "Nature", distance: "View from Dum Dum Rock", bestFor: "Highest Waterfall" }
        ],
        nearbyDistricts: ["madurai", "theni", "tiruppur", "trichy"],
        recommendedVehicles: ["innova", "suv", "etios", "tempo"],
        faqs: [
            {
                question: "Taxi fare from Kodai Road station to Kodaikanal?",
                answer: "It is about 80 km (2-3 hours). A Sedan drop typically costs **₹2000 - ₹2500**."
            },
            {
                question: "Can we go to Berijam Lake in private taxi?",
                answer: "Yes, but it requires a **Forest Permit**. We can assist in obtaining this if you inform us early morning (limited slots)."
            },
            {
                question: "Is Palani temple winch station accessible by car?",
                answer: "Cars can go up to the Adivaram (base) car parking. The Winch/Rope car station is a short walk from there."
            },
            {
                question: "Do you have carriers for luggage?",
                answer: "Yes, all our **SUVs (Innova/Xylo)** come with roof carriers. Essential for tourists carrying warm clothes and shopping."
            },
            {
                question: "Route from Kodaikanal to Munnar?",
                answer: "The direct escape road is often closed. The standard route is via Theni/Bodi. It takes 5-6 hours. It is a beautiful drive."
            }
        ]
    },
    {
        id: "kanchipuram",
        slug: "kanchipuram",
        name: "Kanchipuram",
        seoTitle: "Kanchipuram Taxi Service | Temple Tour & Silk Shopping",
        metaDescription: "Top Kanchipuram taxi service. Visit Kamakshi Amman, Varadharaja Perumal. Silk saree shopping trips from Chennai. One way drop to Vellore, Tirupati.",
        h1: "Kanchipuram Temple City Taxi",
        keywords: [
            "Kanchipuram temple tour taxi",
            "Chennai to Kanchipuram cab",
            "Silk saree shopping taxi Kanchipuram",
            "Kamakshi Amman temple cab",
            "Kanchipuram to Tirupati drop taxi",
            "Varadharaja Perumal temple taxi",
            "Kailasanathar temple cab",
            "One way taxi Kanchipuram to Bangalore",
            "Mahabalipuram to Kanchipuram taxi",
            "Kanchipuram local cab booking"
        ],
        oneWayContent: "Kanchipuram is the Golden City of Temples. We see high demand for **Chennai to Kanchipuram** day trips for both worship and wedding shopping. We also provide direct **One Way Drops to Tirupati** (3 hours away) for pilgrims continuing their spiritual journey.",
        roundTripContent: "Explore the architectural wonders of the Pallavas. Our **Divya Desam Package** covers **Varadharaja Perumal**, **Ulagalantha Perumal**, and others. Shopping for a wedding? Book our cab for a **Full Day Shopping Trip**. Our drivers know the reputed silk cooperative societies and can wait patiently while you shop.",
        touristPlaces: [
            { name: "Kamakshi Amman", type: "Temple", distance: "City Center", bestFor: "Shakti Peetham" },
            { name: "Ekambareswarar", type: "Temple", distance: "City Center", bestFor: "Pancha Bhoota Sthalam (Earth)" },
            { name: "Varadharaja Perumal", type: "Temple", distance: "4 km", bestFor: "Vishnu Temple" },
            { name: "Kailasanathar", type: "Heritage", distance: "2 km", bestFor: "Oldest Stone Temple" },
            { name: "Vedanthangal", type: "Nature", distance: "45 km", bestFor: "Bird Sanctuary" }
        ],
        nearbyDistricts: ["chennai", "tiruvallur", "chengalpattu", "vellore"],
        recommendedVehicles: ["sedan", "etios", "innova", "mini"],
        faqs: [
            {
                question: "Can we cover all major temples in one day?",
                answer: "Yes, Kanchipuram temples are close by. With our cab, you can cover the Top 5 temples easily from 7 AM to 12 PM and 4 PM to 8 PM."
            },
            {
                question: "Do drivers know good Silk Saree shops?",
                answer: "Yes, our drivers can take you to government-approved **Co-optex** or weaver societies if you wish to avoid private touts."
            },
            {
                question: "Taxi fare from Kanchipuram to Tirupati?",
                answer: "It is about 110 km. A one-way drop costs around **₹2500**. It is a very popular route."
            },
            {
                question: "Is there a train from Kanchipuram to Chennai?",
                answer: "Trains are limited. A **Taxi Drop** is much faster (1.5 - 2 hours via NH48) and more comfortable."
            },
            {
                question: "Best time to visit Vedanthangal?",
                answer: "November to February is the nesting season. It is a 1-hour drive from Kanchipuram."
            }
        ]
    },
    {
        id: "theni",
        slug: "theni",
        name: "Theni",
        seoTitle: "Theni Taxi Service | Megamalai & Thekkady Drop",
        metaDescription: "Reliable Theni taxi service. Drop taxi to Thekkady, Munnar, Madurai. Megamalai hills tour packages. Kumbakarai falls trips. Bodimettu cabs.",
        h1: "Theni District Taxi Service",
        keywords: [
            "Theni to Thekkady taxi fare",
            "Megamalai jeep taxi booking",
            "Theni to Madurai drop taxi",
            "Bodi mettu taxi service",
            "Kumbakarai falls cab",
            "Veerapandi Gowmariamman temple taxi",
            "Suruli falls taxi",
            "Chinna Suruli falls cab",
            "Theni local cab booking",
            "Cumbum grapes garden taxi"
        ],
        oneWayContent: "Theni is the nature lover's paradise and a gateway to Kerala. We operate frequent drops to **Thekkady (Kumily)** and **Munnar**. Our **One Way Taxis** to **Madurai** are used daily by traders and locals. The scenic route through **Bodimettu** requires skilled drivers which we guarantee.",
        roundTripContent: "Discover the hidden gems! Our **Megamalai Package** takes you to the 'High Wavy Mountains' (note: requires SUVs). Visit the majestic **Suruli Falls** and the **Cumbum Grapes Garden** (one of the few places in India growing grapes year-round). A drive to the **Vaigai Dam** is perfect for a relaxing evening.",
        touristPlaces: [
            { name: "Megamalai", type: "Hill Station", distance: "50 km", bestFor: "Tea Estates, Views" },
            { name: "Suruli Falls", type: "Nature", distance: "45 km", bestFor: "Waterfalls" },
            { name: "Vaigai Dam", type: "Nature", distance: "20 km", bestFor: "Park, Dam View" },
            { name: "Kumbakarai Falls", type: "Nature", distance: "25 km", bestFor: "Waterfalls" },
            { name: "Thekkady (Kumily)", type: "Nature", distance: "60 km", bestFor: "Wildlife, Kerala Border" }
        ],
        nearbyDistricts: ["madurai", "dindigul", "virudhunagar", "idukki (kerala)"],
        recommendedVehicles: ["suv", "innova", "etios", "sedan"],
        faqs: [
            {
                question: "Is the road to Megamalai good?",
                answer: "The road has improved but is still narrow and winding. We strictly utilize **high-ground clearance vehicles** for Megamalai trips."
            },
            {
                question: "Distance from Theni to Thekkady?",
                answer: "It is about **60 km** (1.5 hours). The drive uphill from Cumbum Metzu is very scenic."
            },
            {
                question: "Do you offer drops to Munnar from Theni?",
                answer: "Yes, Theni to Munnar via Bodi Mettu is a popular route (approx 3 hours). It is much faster than going via Udumalpet."
            },
            {
                question: "Can we visit the Grapes Garden?",
                answer: "Yes, Cumbum valley is famous for it. You can stop, take photos, and buy fresh grapes."
            },
            {
                question: "Taxi fare for Theni to Madurai?",
                answer: "It is 75 km. A drop costs around **₹1800 - ₹2000**. Frequent buses are available, but a taxi is best for luggage."
            }
        ]
    },
    {
        id: "dharmapuri",
        slug: "dharmapuri",
        name: "Dharmapuri",
        seoTitle: "Dharmapuri Taxi Service | Hogenakkal Falls Weekend Trip",
        metaDescription: "Best taxi in Dharmapuri. Weekend trips to Hogenakkal Falls. One way drop to Bangalore, Salem, Chennai. Adhiyaman Kottam tours.",
        h1: "Dharmapuri & Hogenakkal Taxi",
        keywords: [
            "Hogenakkal falls taxi fare",
            "Dharmapuri to Bangalore drop taxi",
            "One way taxi Dharmapuri to Chennai",
            "Hogenakkal oil massage taxi",
            "Dharmapuri local cab service",
            "Adhiyaman Kottam temple taxi",
            "Theerthamalai temple cab",
            "Outstation taxi from Dharmapuri",
            "Bangalore to Hogenakkal taxi package",
            "Innova rental Dharmapuri"
        ],
        oneWayContent: "Dharmapuri is strategically located near Bangalore. Our **Bangalore Drop Taxi** service is highly utilized by daily commuters and IT professionals returning home. We also provide **One Way Cabs** to **Salem** and **Chennai** at competitive per-km rates.",
        roundTripContent: "The 'Niagara of India' calls! Our **Hogenakkal Weekend Package** is a bestseller. We pick you up, drive you to the falls (45 km away), wait while you enjoy the coracle ride and famous oil massage, and drop you back. We also cover the ancient **Theerthamalai Temple** for pilgrims.",
        touristPlaces: [
            { name: "Hogenakkal Falls", type: "Nature", distance: "45 km", bestFor: "Coracle Ride, Massage" },
            { name: "Theerthamalai", type: "Temple", distance: "60 km", bestFor: "Hill Temple" },
            { name: "Adhiyaman Kottam", type: "Heritage", distance: "10 km", bestFor: "Fort Ruins" },
            { name: "Subramanya Siva Memorial", type: "Heritage", distance: "20 km", bestFor: "History" },
            { name: "Thoppur", type: "Nature", distance: "30 km", bestFor: "Ghat Road Drive" }
        ],
        nearbyDistricts: ["krishnagiri", "salem", "tiruvannamalai", "bangalore"],
        recommendedVehicles: ["suv", "innova", "etios", "mini"],
        faqs: [
            {
                question: "Best time to visit Hogenakkal?",
                answer: "Post-monsoon (August to May) is best. During heavy floods, coracle rides are banned. We will update you on status before booking."
            },
            {
                question: "Is it safe to drive to Hogenakkal?",
                answer: "Yes, the Pennagaram road is decent. The ghat section is small but scenic."
            },
            {
                question: "Taxi fare for Dharmapuri to Bangalore?",
                answer: "It is about 140 km. A drop costs around **₹2500 - ₹2800**. It takes roughly 3 hours."
            },
            {
                question: "Do you offer packages from Bangalore to Hogenakkal?",
                answer: "Yes, this is our most popular package. Pickup from Bangalore @ 6 AM, full day Hogenakkal, return by 9 PM."
            },
            {
                question: "Can we visit Theerthamalai and Hogenakkal in one day?",
                answer: "It is tight as they are in different directions. We recommend 2 days or choosing one."
            }
        ]
    },
    {
        id: "krishnagiri",
        slug: "krishnagiri",
        name: "Krishnagiri",
        seoTitle: "Krishnagiri Taxi Service | Hosur & Bangalore Airport Drop",
        metaDescription: "Top taxi service in Krishnagiri & Hosur. Drop taxi to Bangalore Airport (KIAL). Krishnagiri Dam trips. Industrial visits. Safe highway cabs.",
        h1: "Krishnagiri & Hosur Taxi Service",
        keywords: [
            "Hosur to Bangalore airport taxi",
            "Krishnagiri dam taxi",
            "One way taxi Krishnagiri to Chennai",
            "Hosur industrial visit cab",
            "Drop taxi Krishnagiri to Salem",
            "Rayakottai fort trekking taxi",
            "Thally Little England cab",
            "Krishnagiri to Bangalore drop",
            "Hosur railway station taxi",
            "Innova Crysta rental Hosur"
        ],
        oneWayContent: "As the gateway to Tamil Nadu, Krishnagiri (and Hosur) sees massive interstate traffic. We specialize in **Hosur to Bangalore Airport (KIAL)** drops. Our drivers are experts in navigating the traffic at the Attibele border. We also provide frequent **One Way Taxis** to **Chennai** and **Salem**.",
        roundTripContent: "Krishnagiri is the 'Mango Capital'. Leisure travelers often book our cabs for **Krishnagiri Dam** picnics. Adventure seekers visit **Rayakottai Fort** for trekking. For a cool climate experience, visit **Thally** (Little England), just an hour from Hosur, perfect for a day drive.",
        touristPlaces: [
            { name: "Krishnagiri Dam", type: "Nature", distance: "10 km", bestFor: "Park, Boating" },
            { name: "Rayakottai Fort", type: "Heritage", distance: "30 km", bestFor: "Trekking" },
            { name: "Thally", type: "Hill Station", distance: "60 km", bestFor: "Little England, Climate" },
            { name: "Hosur", type: "City", distance: "50 km", bestFor: "Industrial Hub, Flowers" },
            { name: "Chandramoodeshwarar", type: "Temple", distance: "Hosur", bestFor: "Hill Temple" }
        ],
        nearbyDistricts: ["dharmapuri", "tiruvannamalai", "bangalore", "chittoor"],
        recommendedVehicles: ["etios", "sedan", "innova", "suv"],
        faqs: [
            {
                question: "Taxi fare from Hosur to Bangalore Airport?",
                answer: "It is about 75-80 km via ELEVATED tollway. Drop costs around **₹2000 - ₹2400** including tolls."
            },
            {
                question: "Do I need an e-pass to enter Bangalore?",
                answer: "Currently, no. But we stay updated on interstate rules. Our cars have All-India Permits."
            },
            {
                question: "Is Krishnagiri Dam park open everyday?",
                answer: "Yes, it is a popular picnic spot. Best to visit in evenings."
            },
            {
                question: "Distance from Krishnagiri to Chennai?",
                answer: "It is about 260 km (4-5 hours) on the customized NH48. It is a very smooth drive."
            },
            {
                question: "Can we get a cab for factory visits in Hosur/SIPCOT?",
                answer: "Yes, we offer **Hourly Rental Packages** (8Hr/80km) specifically for corporate executives visiting SIPCOT units."
            }
        ]
    },
    {
        id: "mayiladuthurai",
        slug: "mayiladuthurai",
        name: "Mayiladuthurai",
        seoTitle: "Mayiladuthurai Taxi Service | Navagraha Temple Tour Cabs",
        metaDescription: "Best taxi service in Mayiladuthurai (Mayavaram). Navagraha temple tour packages (Vaitheeswaran Koil, Thirunallar). Drop taxi to Chennai, Trichy.",
        h1: "Mayiladuthurai Navagraha Taxi",
        keywords: [
            "Mayiladuthurai to Vaitheeswaran Koil taxi",
            "Navagraha tour taxi price",
            "Thirukadaiyur 60th marriage cab booking",
            "Mayiladuthurai to Chennai drop taxi",
            "Poompuhar college taxi service",
            "Mayavaram local cab booking",
            "Vaitheeswaran Koil Nadi astrology taxi",
            "Sirkazhi temple taxi",
            "Thiruvengadu Bodhisattva cab",
            "Mayiladuthurai to Thirunallar taxi"
        ],
        oneWayContent: "Mayiladuthurai is the central axis for the **Navagraha Temples**. We provide reliable **One Way Drops to Chennai** (via ECR/GST) for devotees returning home. We also serve pilgrims arriving at **Chidambaram Railway Station** with instant pickup services.",
        roundTripContent: "Embark on the divine journey! Our **Navagraha Package** covers key temples like **Vaitheeswaran Koil** (Mars), **Thiruvengadu** (Mercury), and **Keezhperumpallam** (Ketu) which are within a 20 km radius. We also specialize in trips to **Thirukadaiyur** for 'Sashtiapthapoorthi' (60th Birthday) celebrations, providing large vehicles for family groups.",
        touristPlaces: [
            { name: "Vaitheeswaran Koil", type: "Temple", distance: "15 km", bestFor: "Mars (Sevvai) Temple" },
            { name: "Thirukadaiyur", type: "Temple", distance: "20 km", bestFor: "Longevity Rituals" },
            { name: "Sirkazhi", type: "Temple", distance: "20 km", bestFor: "Shiva Temple" },
            { name: "Poompuhar", type: "Heritage", distance: "25 km", bestFor: "Beach, History" },
            { name: "Thirunallar", type: "Temple", distance: "30 km", bestFor: "Saturn (Sani) Temple" }
        ],
        nearbyDistricts: ["thanjavur", "nagapattinam", "cuddalore", "karaikal"],
        recommendedVehicles: ["innova", "suv", "etios", "tempo"],
        faqs: [
            {
                question: "How many Navagraha temples are near Mayiladuthurai?",
                answer: "Most of them (7 out of 9) are within a 40 km radius. Mayiladuthurai is the best base to stay."
            },
            {
                question: "Do you provide cabs for Thirukadaiyur marriage functions?",
                answer: "Yes, we have **Luxury Innova Crysta** and **Tempo Travellers** for wedding guests attending functions at Abirami Amman Temple."
            },
            {
                question: "Is there a drop taxi to Chennai?",
                answer: "Yes, daily services available. The route via Chidambaram-Cuddalore-ECR is very scenic."
            },
            {
                question: "Can we visit Nadi Astrologers in Vaitheeswaran Koil?",
                answer: "Yes, our drivers know the locations of reputed Nadi Joshiyam centers. We can wait while you consult."
            },
            {
                question: "Taxi fare from Mayiladuthurai to Trichy Airport?",
                answer: "It is about 130 km. A sedan drop costs roughly **₹2500 - ₹2800**."
            }
        ]
    },
    {
        id: "tiruvarur",
        slug: "tiruvarur",
        name: "Tiruvarur",
        seoTitle: "Tiruvarur Taxi Service | Thyagaraja Temple & Alangudi Drop",
        metaDescription: "Top Tiruvarur taxi service. Trip to Thyagaraja Swamy Temple. Alangudi Guru temple taxi. Drop taxi to Thanjavur, Trichy airport. Reliable drivers.",
        h1: "Tiruvarur District Taxi Service",
        keywords: [
            "Tiruvarur Thyagaraja temple taxi",
            "Alangudi Guru temple cab booking",
            "Tiruvarur central university taxi",
            "One way taxi Tiruvarur to Chennai",
            "Muthupet mangrove forest taxi",
            "Tiruvarur to Thanjavur cab",
            "Koothanur Saraswathi temple taxi",
            "Mannargudi Rajagopalaswamy temple cab",
            "Tiruvarur railway station taxi",
            "Innova rental Tiruvarur"
        ],
        oneWayContent: "Tiruvarur is a land of massive temples and heritage. Our **One Way Taxi Service** connects students of the **Central University of Tamil Nadu** to **Trichy Airport** and **Thanjavur**. We also run regular drops to **Chennai** for locals.",
        roundTripContent: "Visit the temple with the largest chariot in Asia! Our **Tiruvarur Temple Package** covers the **Thyagaraja Swamy Temple**, **Mannargudi Rajagopalaswamy Temple**, and the famous **Alangudi Guru (Jupiter) Temple**. Nature lovers can book a trip to the **Muthupet Mangrove Forest** for a boat ride.",
        touristPlaces: [
            { name: "Thyagaraja Temple", type: "Heritage", distance: "City Center", bestFor: "Largest Temple Tank" },
            { name: "Alangudi", type: "Temple", distance: "17 km", bestFor: "Guru (Jupiter) Sthalam" },
            { name: "Mannargudi", type: "Temple", distance: "28 km", bestFor: "Rajagopalaswamy Temple" },
            { name: "Muthupet Mangrove", type: "Nature", distance: "45 km", bestFor: "Boating, Lagoon" },
            { name: "Koothanur", type: "Temple", distance: "20 km", bestFor: "Saraswathi Temple" }
        ],
        nearbyDistricts: ["thanjavur", "nagapattinam", "mayiladuthurai", "pudukkottai"],
        recommendedVehicles: ["etios", "sedan", "suv", "mini"],
        faqs: [
            {
                question: "Best time to visit Tiruvarur Chariot festival?",
                answer: "The 'Aazhi Ther' festival usually happens in **March/April**. It is a massive event, so book cabs weeks in advance."
            },
            {
                question: "Is Alangudi temple crowded?",
                answer: "Yes, especially on **Thursdays** (Guru's day). We recommend starting early (6 AM) to complete darshan quickly."
            },
            {
                question: "Distance from Tiruvarur to Trichy Airport?",
                answer: "It is about 110 km. The drive takes 2.5 hours via Thanjavur."
            },
            {
                question: "Do you service The Central University (CUTN)?",
                answer: "Yes, we provide student pickups and drops from CUTN campus to nearby railway stations and airports."
            },
            {
                question: "Can we visit Muthupet Mangroves year-round?",
                answer: "Yes, but boating is best during high tide. The lagoon is beautiful and calm."
            }
        ]
    },
    {
        id: "karur",
        slug: "karur",
        name: "Karur",
        seoTitle: "Karur Taxi Service | Textile Business & Pasupathieswarar Cabs",
        metaDescription: "Premium Karur taxi service for textile business visits. Drop taxi to Coimbatore, Trichy, Tirupur. Mayanur barrage sightseeing. Safe & clean cars.",
        h1: "Karur Business Taxi Service",
        keywords: [
            "Karur to Coimbatore taxi fare",
            "Karur textile market cab",
            "Pasupathieswarar temple taxi",
            "Mayanur barrage park cab",
            "One way taxi Karur to Chennai",
            "Karur to Trichy airport drop",
            "Kalyana Venkataramana Swamy temple taxi",
            "Karur railway station pickup",
            "Outstation cabs Karur",
            "Innova rental Karur"
        ],
        oneWayContent: "Karur is the textile export hub. We understand the needs of business travelers. Our **Karur to Coimbatore** and **Karur to Trichy** airport drops are punctual and comfortable. We offer **Corporate Billing** for frequent travelers visiting textile units.",
        roundTripContent: "Beyond business, Karur has charm. Our **Leisure Package** covers the **Pasupathieswarar Temple** and a relaxing evening at **Mayanur Barrage** (Cauvery river view). Devotees also visit the **Thanthoni Malai** (Kalyana Venkataramana Swamy) temple, known as South Tirupati.",
        touristPlaces: [
            { name: "Pasupathieswarar", type: "Temple", distance: "City Center", bestFor: "Sculptures" },
            { name: "Mayanur Barrage", type: "Nature", distance: "20 km", bestFor: "River View, Park" },
            { name: "Thanthoni Malai", type: "Temple", distance: "5 km", bestFor: "South Tirupati" },
            { name: "Amaravathi River", type: "Nature", distance: "City", bestFor: "River Bed" },
            { name: "Pugalur", type: "Heritage", distance: "15 km", bestFor: "Paper Mills" }
        ],
        nearbyDistricts: ["trichy", "namakkal", "dindigul", "erode"],
        recommendedVehicles: ["sedan", "etios", "innova-crysta", "suv"],
        faqs: [
            {
                question: "Taxi fare Karur to Coimbatore Airport?",
                answer: "It is roughly 125 km. A drop costs around **₹2400 - ₹2600**. It takes 2.5 hours."
            },
            {
                question: "Do you have waiting taxis for factory visits?",
                answer: "Yes, our **8Hr / 80km package** is perfect for buyers visiting multiple textile export units in a day."
            },
            {
                question: "Is Mayanur Barrage safe for kids?",
                answer: "Yes, there is a dedicated park and walking area. Bathing in the river should be done only in designated safe zones."
            },
            {
                question: "Distance from Karur to Trichy?",
                answer: "Just 80 km. It is a quick 1.5-hour drive on the NH."
            },
            {
                question: "Can I book a cab for a wedding anywhere in the district?",
                answer: "Yes, we cover all taluks including Aravakurichi, Kulithalai, and Krishnarayapuram."
            }
        ]
    },
    {
        id: "namakkal",
        slug: "namakkal",
        name: "Namakkal",
        seoTitle: "Namakkal Taxi Service | Anjaneyar Temple & Transport City",
        metaDescription: "Trusted Namakkal taxi service. Anjaneyar temple visits. Kolli Hills road trip. Drop taxi to Salem, Bangalore, Trichy. Reliable outstation cabs.",
        h1: "Namakkal Transport City Taxi",
        keywords: [
            "Namakkal Anjaneyar temple taxi",
            "Kolli hills taxi from Namakkal",
            "Namakkal to Salem drop taxi",
            "One way taxi Namakkal to Chennai",
            "Namakkal truck body building visit cab",
            "Narasimha swamy temple taxi",
            "Tiruchengode Ardhanareeswarar cab",
            "Namakkal railway station taxi",
            "Agaya Gangai falls taxi",
            "Innova rental Namakkal"
        ],
        oneWayContent: "Namakkal is the Egg & Transport City. We serve the heavy business traffic to **Salem** and **Bangalore**. Our fleet is impeccably maintained, reflecting the city's transport standards. We also provide **One Way Drops to Trichy Airport** for business owners.",
        roundTripContent: "Seek blessings at the famous **Namakkal Anjaneyar Temple** (18-foot idol). For adventure, book our **Kolli Hills Package** – we drive you through the 70 hairpin bends to the top. Visit the **Agaya Gangai Waterfalls** and the botanical garden. We also cover **Tiruchengode Ardhanareeswarar Temple**.",
        touristPlaces: [
            { name: "Anjaneyar Temple", type: "Temple", distance: "City Center", bestFor: "Hanuman Idol" },
            { name: "Kolli Hills", type: "Hill Station", distance: "55 km", bestFor: "70 Hairpin Bends" },
            { name: "Namakkal Fort", type: "Heritage", distance: "City Center", bestFor: "View, History" },
            { name: "Tiruchengode", type: "Temple", distance: "35 km", bestFor: "Ardhanareeswarar" },
            { name: "Agaya Gangai", type: "Nature", distance: "Kolli Hills", bestFor: "Waterfalls" }
        ],
        nearbyDistricts: ["salem", "karur", "erode", "trichy"],
        recommendedVehicles: ["suv", "innova", "etios", "sedan"],
        faqs: [
            {
                question: "Is it safe to drive to Kolli Hills?",
                answer: "The 70 hairpin bends require skill. Our drivers are **Kolli Hills Specialists**. We recommend SUVs for the climb."
            },
            {
                question: "Best time to visit Kolli Hills?",
                answer: "Throughout the year, but the weather is most pleasant from **September to March**."
            },
            {
                question: "Taxi fare Namakkal to Bangalore?",
                answer: "It is about 250 km. A drop costs around **₹3800 - ₹4200**. It takes 4.5 hours."
            },
            {
                question: "How far is Tiruchengode from Namakkal?",
                answer: "It is 35 km. The hill temple has steps and a road. Our taxi can drop you right at the top."
            },
            {
                question: "Do you provide cabs for students of Namakkal colleges?",
                answer: "Yes, we handle bulk bookings for students traveling home to Chennai/Coimbatore during semester holidays."
            }
        ]
    },
    {
        id: "pudukkottai",
        slug: "pudukkottai",
        name: "Pudukkottai",
        seoTitle: "Pudukkottai Taxi Service | Sittanavasal & Avudaiyarkoil",
        metaDescription: "Best taxi in Pudukkottai. Visit Sittanavasal caves. Drop taxi to Trichy Airport, Madurai, Thanjavur. Avudaiyarkoil tour packages.",
        h1: "Pudukkottai & Heritage Taxi",
        keywords: [
            "Pudukkottai to Trichy airport taxi",
            "Sittanavasal cave paintings taxi",
            "Avudaiyarkoil taxi service",
            "One way taxi Pudukkottai to Chennai",
            "Thirumayam fort cab",
            "Viralimalai Murugan temple taxi",
            "Pudukkottai palace visit cab",
            "Kudumiyanmalai temple taxi",
            "Drop taxi Pudukkottai to Madurai",
            "Pudukkottai local cab booking"
        ],
        oneWayContent: "Pudukkottai is the princely heritage hub. Locals rely on our **Airport Taxi** to **Trichy International Airport** (just 45 mins away). We also provide **One Way Drops to Chennai** and **Madurai**. Our cars are clean and punctual for all your travel needs.",
        roundTripContent: "Step back in time! Our **Heritage Package** covers the Jain cave paintings at **Sittanavasal**, the rock-cut **Thirumayam Fort**, and the architectural marvel **Avudaiyarkoil**. Devotees also flock to the **Viralimalai Murugan Temple**. Our drivers can narrate the local history and guide you to hidden spots.",
        touristPlaces: [
            { name: "Sittanavasal", type: "Heritage", distance: "15 km", bestFor: "Cave Paintings" },
            { name: "Avudaiyarkoil", type: "Temple", distance: "45 km", bestFor: "Architecture" },
            { name: "Thirumayam Fort", type: "Heritage", distance: "20 km", bestFor: "Fort, History" },
            { name: "Viralimalai", type: "Temple", distance: "30 km", bestFor: "Murugan Temple" },
            { name: "Pudukkottai Palace", type: "Heritage", distance: "City Center", bestFor: "Architecture" }
        ],
        nearbyDistricts: ["trichy", "thanjavur", "sivaganga", "madurai"],
        recommendedVehicles: ["etios", "sedan", "mini", "innova"],
        faqs: [
            {
                question: "How close is Trichy Airport?",
                answer: "Very close! Just **50 km**. It takes less than an hour. Pudukkottai is practically a satellite town of Trichy."
            },
            {
                question: "Is Sittanavasal worth visiting?",
                answer: "Absolutely. It has ancient Jain beds and 2nd-century paintings. It is a serene rock-cut wonder."
            },
            {
                question: "Do you offer packages to Chettinad from here?",
                answer: "Yes, Chettinad (Karaikudi) is just 30 mins away from Thirumayam. We combine both in a single day trip."
            },
            {
                question: "Is there a drop taxi to Chennai?",
                answer: "Yes, via Trichy-Perambalur highway. It is about 380 km. We offer competitive one-way rates."
            },
            {
                question: "Can we visit Viralimalai Peacocks?",
                answer: "Yes, the temple hill is famous for its wild peacocks. It is a great spot for photography."
            }
        ]
    },
    {
        id: "sivaganga",
        slug: "sivaganga",
        name: "Sivaganga (Chettinad)",
        seoTitle: "Sivaganga & Karaikudi Taxi | Chettinad Heritage Tour",
        metaDescription: "Official Sivaganga taxi service. Karaikudi Chettinad mansion tours. Pillayarpatti temple trips. Drop taxi to Madurai, Trichy. Experience heritage.",
        h1: "Chettinad & Sivaganga Taxi",
        keywords: [
            "Karaikudi Chettinad palace taxi",
            "Pillayarpatti Karpaga Vinayagar cab",
            "Sivaganga to Madurai airport taxi",
            "Athangudi tile factory visit cab",
            "Kundrakudi Murugan temple taxi",
            "One way taxi Karaikudi to Chennai",
            "Chettinad mansion tour booking",
            "Vettangudi bird sanctuary taxi",
            "Thirukoshtiyur temple cab",
            "Innova rental Karaikudi"
        ],
        oneWayContent: "Sivaganga district is synonymous with **Chettinad**. We provide premium **Taxi Services in Karaikudi** for tourists visiting heritage mansions. We also connect **Pillayarpatti** pilgrims to **Madurai** and **Trichy** airports with our fleet of comfortable Sedans and SUVs.",
        roundTripContent: "Live like a Nattukottai Chettiar! Our **Chettinad Heritage Tour** takes you to the **Chettinad Palace**, **Athangudi Tile Factories**, and antique streets. Spiritual seekers use our cabs for the famous **Pillayarpatti Karpaga Vinayagar Temple** and **Kundrakudi**. Experience the authentic cuisine with our drivers guiding you to the best messes.",
        touristPlaces: [
            { name: "Pillayarpatti", type: "Temple", distance: "15 km (Karaikudi)", bestFor: "Vinayagar Temple" },
            { name: "Chettinad Palace", type: "Heritage", distance: "Karaikudi", bestFor: "Architecture" },
            { name: "Athangudi", type: "Heritage", distance: "12 km", bestFor: "Tile Factory" },
            { name: "Kundrakudi", type: "Temple", distance: "10 km", bestFor: "Hill Temple" },
            { name: "Thirukoshtiyur", type: "Temple", distance: "25 km", bestFor: "Vishnu Temple" }
        ],
        nearbyDistricts: ["madurai", "pudukkottai", "ramanathapuram", "virudhunagar"],
        recommendedVehicles: ["innova", "suv", "sedan", "etios"],
        faqs: [
            {
                question: "Can we visit Athangudi Tile Factory inside?",
                answer: "Yes, many artisans allow tourists to watch the handmade tile process. It's a unique experience."
            },
            {
                question: "Distance from Karaikudi to Madurai Airport?",
                answer: "It is about **90 km**. Takes roughly 1.5 to 2 hours. We offer prompt airport drops."
            },
            {
                question: "Best time to visit Pillayarpatti?",
                answer: "Vinayaka Chathurthi is huge here (10-day festival). On regular days, early morning is peaceful."
            },
            {
                question: "Do you have AC cabs for heritage tours?",
                answer: "Yes, Chettinad can be hot. All our Sedans and Innovas have powerful ACs for your comfort."
            },
            {
                question: "Is there a drop taxi to Rameswaram?",
                answer: "Yes, Rameswaram is quite close (140 km). Many tourists combine Chettinad and Rameswaram in one trip."
            }
        ]
    },
    {
        id: "virudhunagar",
        slug: "virudhunagar",
        name: "Virudhunagar",
        seoTitle: "Virudhunagar Taxi Service | Business & Temple Cabs",
        metaDescription: "Reliable Virudhunagar taxi service. Drop taxi to Madurai, Sivakasi, Rajapalayam. Srivilliputhur Andal temple trips. Safe & punctual cabs.",
        h1: "Virudhunagar District Taxi",
        keywords: [
            "Virudhunagar to Madurai taxi",
            "Srivilliputhur Andal temple cab",
            "Sivakasi crackers shopping taxi",
            "Rajapalayam Ayyanar falls cab",
            "One way taxi Virudhunagar to Chennai",
            "Irukkankudi Mariamman temple taxi",
            "Virudhunagar local cab booking",
            "Outstation taxi from Virudhunagar",
            "Sattur cab service",
            "Innova rental Virudhunagar"
        ],
        oneWayContent: "Virudhunagar is a bustling business district. We provide frequent **One Way Drops to Madurai Airport** (just 45 mins away) for merchants from **Sivakasi** and **Sattur**. We represent the fiery spirit of the district with prompt service to **Chennai** and **Bangalore**.",
        roundTripContent: "Heritage and Nature blend here. Visit the **Srivilliputhur Andal Temple** (its tower is the TN govt emblem). Nature lovers can head to **Rajapalayam Ayyanar Falls** (trek required). Millions flock to the **Irukkankudi Mariamman Temple**. Our drivers ensure you reach these spots comfortably.",
        touristPlaces: [
            { name: "Srivilliputhur", type: "Temple", distance: "45 km", bestFor: "Andal Temple" },
            { name: "Ayyanar Falls", type: "Nature", distance: "Rajapalayam", bestFor: "Waterfalls, Trek" },
            { name: "Irukkankudi", type: "Temple", distance: "30 km", bestFor: "Mariamman Temple" },
            { name: "Pilavakkal Dam", type: "Nature", distance: "Watrap", bestFor: "Dam View" },
            { name: "Sivakasi", type: "City", distance: "25 km", bestFor: "Printing, Crackers" }
        ],
        nearbyDistricts: ["madurai", "theni", "tenkasi", "tuticorin"],
        recommendedVehicles: ["etios", "sedan", "suv", "mini"],
        faqs: [
            {
                question: "How far is Srivilliputhur from Madurai?",
                answer: "It is about 75 km. A one-way taxi takes 1.5 hours. It serves as a great half-day trip."
            },
            {
                question: "Is Ayyanar Falls accessible by car?",
                answer: "Cars can go up to the forest checkpost. After that, it is a small trek/walk to the falls."
            },
            {
                question: "Do you provide cabs for Sivakasi cracker purchase?",
                answer: "Yes, we can take you to reputed factory outlets. Please note: Carrying crackers in the boot requires safety precautions."
            },
            {
                question: "Taxi fare Virudhunagar to Chennai?",
                answer: "It is about 500 km. A long drive. We recommend our **Innova Crysta** for a fatigue-free journey."
            },
            {
                question: "Can we visit Irukkankudi on the way to Tirunelveli?",
                answer: "Yes, it is slightly off the NH44 highway but easily coverable."
            }
        ]
    },
    {
        id: "tenkasi",
        slug: "tenkasi",
        name: "Tenkasi",
        seoTitle: "Tenkasi Taxi Service | Courtallam & Kasi Viswanathar",
        metaDescription: "Best taxi in Tenkasi & Courtallam. Enjoy waterfalls season. Drop taxi to Tirunelveli, Madurai, Kerala. Kasi Viswanathar temple trips. Large cabs.",
        h1: "Tenkasi & Courtallam Taxi",
        keywords: [
            "Courtallam falls season taxi",
            "Tenkasi Kasi Viswanathar temple cab",
            "Tenkasi to Trivandrum airport taxi",
            "Gundaru dam taxi service",
            "Shenbaga devi falls trek cab",
            "One way taxi Tenkasi to Chennai",
            "Drop taxi Tenkasi to Madurai",
            "Old Courtallam falls taxi",
            "Tenkasi railway station cab",
            "Innova rental Courtallam"
        ],
        oneWayContent: "Tenkasi is known for the 'Spa of South India'. We provide extensive service during the **Courtallam Season** (June-Aug). We also offer **Transfer Taxis** to **Trivandrum Airport** and **Madurai**. Our fleet is ready to handle the heavy monsoon rush.",
        roundTripContent: "It's all about water! Our **Courtallam Package** covers Main Falls, Five Falls, and Old Falls. Visit the grand **Kasi Viswanathar Temple** (South Kasi). Nature lovers can visit **Gundaru Dam** and **Adavi Nainar Dam**. We recommend **SUVs** as you will likely have wet clothes and need space!",
        touristPlaces: [
            { name: "Main Falls", type: "Nature", distance: "Courtallam", bestFor: "Bathing" },
            { name: "Five Falls", type: "Nature", distance: "4 km", bestFor: "Bathing" },
            { name: "Kasi Viswanathar", type: "Temple", distance: "City Center", bestFor: "Temple Gopuram" },
            { name: "Gundaru Dam", type: "Nature", distance: "15 km", bestFor: "Scenic Dam" },
            { name: "Old Falls", type: "Nature", distance: "8 km", bestFor: "Family Bathing" }
        ],
        nearbyDistricts: ["tirunelveli", "virudhunagar", "kerala (kollam)"],
        recommendedVehicles: ["suv", "innova", "etios", "tempo"],
        faqs: [
            {
                question: "When is the best season for Courtallam?",
                answer: "The Southwest Monsoon (**June to August**) is the peak season. The falls are full and the climate is cool."
            },
            {
                question: "Is it safe to bathe in the falls?",
                answer: "Yes, police and safety rails are present. But always listen to warnings during flash floods. Safety first."
            },
            {
                question: "Do you have Kerala permits?",
                answer: "Tenkasi borders Kerala (Sengottai). Our cars have **All India Permits** to enter Kerala for trips to Thenmala/Palaruvi."
            },
            {
                question: "Taxi fare Tenkasi to Madurai?",
                answer: "It is about 160 km. A drop costs around **₹3000 - ₹3200**. It takes 3 hours."
            },
            {
                question: "Can we track to Shenbaga Devi falls?",
                answer: "Shenbaga Devi falls is inside the reserved forest. Entry is often restricted. Check with forest officials."
            }
        ]
    },
    {
        id: "tiruvallur",
        slug: "tiruvallur",
        name: "Tiruvallur",
        seoTitle: "Tiruvallur Taxi Service | Industrial Hub & Tiruttani Drop",
        metaDescription: "Reliable Tiruvallur taxi service. Drop taxi to Chennai Airport, Sri City, Tirupati. Tiruttani temple tour packages. Industrial visit cabs.",
        h1: "Tiruvallur Industrial City Taxi",
        keywords: [
            "Tiruvallur to Chennai airport taxi",
            "Tiruttani Murugan temple cab",
            "Sri City AP drop taxi",
            "One way taxi Tiruvallur to Bangalore",
            "Poondi reservoir taxi service",
            "Tiruvallur Veeraraghava Perumal temple cab",
            "Pattabiram taxi service",
            "Avadi local cab booking",
            "Innova rental Tiruvallur",
            "Industrial estate taxi service"
        ],
        oneWayContent: "Tiruvallur is the industrial neighbor of Chennai. We specialize in **Employee Transportation** and **Industrial Visit Cabs** for the factories in Tiruvallur, Sri City, and Gummidipoondi. We also provide frequent **Airport Drops** to Chennai MAA for business executives.",
        roundTripContent: "Spiritual weekends start here! Our **Arupadaivuodu Package** covers **Tiruttani Murugan Temple** (One of the six abodes). Devotees also flock to the **Veeraraghava Perumal Temple** (Divya Desam). Nature lovers can drive to **Poondi Reservoir** for a peaceful evening.",
        touristPlaces: [
            { name: "Tiruttani", type: "Temple", distance: "40 km", bestFor: "Murugan Temple" },
            { name: "Veeraraghava Perumal", type: "Temple", distance: "City Center", bestFor: "Divya Desam" },
            { name: "Poondi Reservoir", type: "Nature", distance: "15 km", bestFor: "Dam View" },
            { name: "Pulicat Lake", type: "Nature", distance: "50 km", bestFor: "Bird Sanctuary" },
            { name: "Sri City (AP)", type: "City", distance: "45 km", bestFor: "Business" }
        ],
        nearbyDistricts: ["chennai", "kanchipuram", "vellore", "chittoor"],
        recommendedVehicles: ["sedan", "sedan-non-cng", "etios", "innova-crysta"],
        faqs: [
            {
                question: "Do you maintain cabs for Sri City business visits?",
                answer: "Yes, we have permits to enter Andhra Pradesh (Sri City). Our **Corporate Package** is popular for factory visits."
            },
            {
                question: "Taxi fare Tiruvallur to Chennai Airport?",
                answer: "It is about 50 km. A Sedan drop costs around **₹1500 - ₹1800**. Takes 1.5 hours."
            },
            {
                question: "Is there a direct cab to Tirupati?",
                answer: "Yes, Tiruvallur is on the way to Tirupati. It is just 90 km (2.5 hours). Many prefer starting from here to avoid Chennai traffic."
            },
            {
                question: "Best time to visit Pulicat?",
                answer: "December to January is the Flamingo season. We can arrange a drop to the boating point."
            },
            {
                question: "Do you have monthly cab services for companies?",
                answer: "Yes, we provide monthly contract vehicles for staff pickup and drop in the industrial estates."
            }
        ]
    },
    {
        id: "chengalpattu",
        slug: "chengalpattu",
        name: "Chengalpattu",
        seoTitle: "Chengalpattu Taxi Service | Mahabalipuram & Tambaram Cabs",
        metaDescription: "Top Chengalpattu taxi service. Mahabalipuram sightseeing taxi. Drop taxi to Chennai Airport, Vedanthangal. Tambaram to Chengalpattu cabs.",
        h1: "Chengalpattu & Mahabs Taxi",
        keywords: [
            "Chengalpattu conveyance taxi",
            "Mahabalipuram sightseeing tour cab",
            "Chengalpattu to Chennai airport drop",
            "Vedanthangal bird sanctuary taxi",
            "One way taxi Chengalpattu to Pondicherry",
            "Tambaram taxi service",
            "Vandalur zoo taxi booking",
            "Thirukazhukundram temple cab",
            "Mahindra World City taxi",
            "Innova rental Chengalpattu"
        ],
        oneWayContent: "Chengalpattu is the southern gateway to Chennai. We serve the **Mahindra World City** IT executives with **Airport Drops**. Tourists landing in Chennai often book our **One Way Taxi to Mahabalipuram** (just 30 mins away) to start their coastal tour.",
        roundTripContent: "Explore the UNESCO heritage! Our **Mahabalipuram Package** covers the **Shore Temple**, **Arjuna's Penance**, and **Five Rathas**. Educational tours to **Vandalur Zoo** (Arignar Anna Zoological Park) and **Crocodile Bank** are a hit with families. We recommend **AC SUVs** for these coastal trips.",
        touristPlaces: [
            { name: "Mahabalipuram", type: "Heritage", distance: "30 km", bestFor: "UNESCO Site" },
            { name: "Vandalur Zoo", type: "Nature", distance: "20 km", bestFor: "Largest Zoo" },
            { name: "Vedanthangal", type: "Nature", distance: "35 km", bestFor: "Birds" },
            { name: "Thirukazhukundram", type: "Temple", distance: "15 km", bestFor: "Eagle Temple" },
            { name: "Muttukadu", type: "Nature", distance: "30 km", bestFor: "Boating" }
        ],
        nearbyDistricts: ["chennai", "kanchipuram", "villupuram", "tiruvannamalai"],
        recommendedVehicles: ["innova", "suv", "sedan", "mini"],
        faqs: [
            {
                question: "How far is Mahabalipuram from Chengalpattu?",
                answer: "It is very close, about **28-30 km**. A 45-minute drive through scenic village roads."
            },
            {
                question: "Do you have cabs for Vandalur Zoo safari?",
                answer: "We drop you at the Zoo entrance. Safari tickets must be bought inside. We can wait for you (usually a 4-5 hour process)."
            },
            {
                question: "Taxi fare Chengalpattu to Pondicherry?",
                answer: "It is about 100 km via ECR. A scenic drive. One-way drop is around **₹2000 - ₹2200**."
            },
            {
                question: "Is Mahindra World City pickup available?",
                answer: "Yes, we serve the IT Special Economic Zone (SEZ) with reliable OT/Late night drops."
            },
            {
                question: "Can we visit Vedanthangal in the evening?",
                answer: "Birds are best seen early morning or late evening (before sunset). The sanctuary closes by 6 PM."
            }
        ]
    },
    {
        id: "ranipet",
        slug: "ranipet",
        name: "Ranipet",
        seoTitle: "Ranipet Taxi Service | Industrial Drops & Vellore Cabs",
        metaDescription: "Ranipet taxi service for leather industry visits. Drop taxi to Chennai, Vellore, Bangalore. Walajapet temple trips. Reliable business cabs.",
        h1: "Ranipet Industrial Taxi",
        keywords: [
            "Ranipet industrial estate taxi",
            "Walajapet Dhanvantri temple cab",
            "Ranipet to Chennai airport taxi",
            "Arcot biryani food tour cab",
            "One way taxi Ranipet to Bangalore",
            "Drop taxi Ranipet to Vellore",
            "Sholingur Narasimha swamy temple taxi",
            "Ranipet railway station cab",
            "Melvisharam taxi service",
            "Innova rental Ranipet"
        ],
        oneWayContent: "Ranipet is the Leather Hub of South India. We provide punctual **Business Cabs** for executives visiting the SIDCO industrial estates. Our **One Way Drops to Chennai Airport** are booked daily. We also connect **Walajapet** and **Arcot** to major cities.",
        roundTripContent: "Spiritual and Foodie delight! Visit the famous **Walajapet Dhanvantri Temple** (God of Medicine) or climb the steps of **Sholingur Narasimha Swamy Temple**. Don't forget to stop at **Arcot** to taste the legendary 'Arcot Makkan Peda'. Our drivers know the best sweet stalls!",
        touristPlaces: [
            { name: "Dhanvantri Temple", type: "Temple", distance: "Walajapet", bestFor: "Health Prayers" },
            { name: "Sholingur", type: "Temple", distance: "30 km", bestFor: "Hill Temple" },
            { name: "Ratnagiri", type: "Temple", distance: "15 km", bestFor: "Murugan Temple" },
            { name: "Delhi Gate", type: "Heritage", distance: "Arcot", bestFor: "History" },
            { name: "Mahendravadi", type: "Heritage", distance: "25 km", bestFor: "Cave Temple" }
        ],
        nearbyDistricts: ["vellore", "kanchipuram", "tiruvannamalai", "chittoor"],
        recommendedVehicles: ["sedan", "etios", "suv", "innova"],
        faqs: [
            {
                question: "Is Sholingur temple difficult to climb?",
                answer: "Yes, it has 1305 steps. There is a rope car facility now available for elderly pilgrims. We can drop you at the base."
            },
            {
                question: "Distance from Ranipet to Chennai?",
                answer: "It is about 115 km. A fast 2-hour drive on the Bangalore-Chennai highway."
            },
            {
                question: "Do you know good leather wholesale shops?",
                answer: "Ranipet is famous for leather exports. Our drivers can point you to factory outlets in Ambur/Ranipet area."
            },
            {
                question: "Can we visit Vellore Golden Temple from here?",
                answer: "Yes, Sripuram Golden Temple is just 30 km away. It is perfect for an evening trip."
            },
            {
                question: "Is there a pickup from Walajah Road Station?",
                answer: "Yes, WJR is the nearest major railhead. We provide station pickups."
            }
        ]
    },
    {
        id: "tirupathur",
        slug: "tirupathur",
        name: "Tirupathur",
        seoTitle: "Tirupathur Taxi Service | Yelagiri Hills & Jolarpettai Drop",
        metaDescription: "Best taxi in Tirupathur. Yelagiri hills weekend packages. Jolarpettai railway station pickup taxi. Vainu Bappu Observatory trips.",
        h1: "Tirupathur & Yelagiri Taxi",
        keywords: [
            "Tirupathur to Yelagiri taxi fare",
            "Jolarpettai station to Yelagiri cab",
            "Vainu Bappu Observatory taxi",
            "One way taxi Tirupathur to Bangalore",
            "Ambur biryani food taxi",
            "Jalgamparai falls cab",
            "Drop taxi Tirupathur to Chennai",
            "Tirupathur local cab booking",
            "Outstation taxi from Tirupathur",
            "Innova rental Yelagiri"
        ],
        oneWayContent: "Tirupathur is the gateway to Yelagiri. We operate the most trusted **Jolarpettai Station Pickup** service for tourists arriving by train. We also provide **One Way Drops to Bangalore** and **Chennai** for locals. Foodies visiting **Ambur** for Biryani often use our hourly packages.",
        roundTripContent: "Escape to the hills! Our **Yelagiri Weekend Package** includes pickup from Jolarpettai, hotel transfer, and sightseeing at **Punganoor Lake** and **Nature Park**. Science buffs can visit the **Vainu Bappu Observatory** (Kavalur), one of Asia's largest telescopes. We recommend **Sedans** for the comfortable drive.",
        touristPlaces: [
            { name: "Yelagiri Hills", type: "Hill Station", distance: "30 km", bestFor: "Boating, Trekking" },
            { name: "Jalgamparai Falls", type: "Nature", distance: "15 km", bestFor: "Waterfalls" },
            { name: "Vainu Bappu Observatory", type: "Heritage", distance: "35 km", bestFor: "Stargazing" },
            { name: "Punganoor Lake", type: "Nature", distance: "Yelagiri", bestFor: "Boating" },
            { name: "Ambur", type: "City", distance: "35 km", bestFor: "Biryani, Leather" }
        ],
        nearbyDistricts: ["vellore", "krishnagiri", "dharmapuri", "tiruvannamalai"],
        recommendedVehicles: ["sedan", "mini", "etios", "suv"],
        faqs: [
            {
                question: "Taxi fare from Jolarpettai to Yelagiri?",
                answer: "It is about 20 km uphill. A drop typically costs **₹800 - ₹1000**. It takes 45 minutes."
            },
            {
                question: "Can we visit the Observatory?",
                answer: "Yes, but it is open to public only on Saturdays (evenings). Please check official timings before booking."
            },
            {
                question: "Is Yelagiri suitable for a 1-day trip?",
                answer: "Yes, perfectly. You can finish the Lake, Park, and Murugan Temple in 5-6 hours."
            },
            {
                question: "Do you stop at Ambur for Biryani?",
                answer: "Of course! Ambur Star Biryani is a landmark. We can stop for lunch on the way to/from Chennai."
            },
            {
                question: "Distance to Bangalore?",
                answer: "Bangalore is about 150 km. A 3-hour drive. We have daily shuttles."
            }
        ]
    },
    {
        id: "villupuram",
        slug: "villupuram",
        name: "Villupuram",
        seoTitle: "Villupuram Taxi Service | Gingee Fort & Pondicherry Drop",
        metaDescription: "Villupuram taxi service. Pickup from Villupuram Junction (VM). Drop taxi to Pondicherry, Chennai, Tiruvannamalai. Gingee Fort tour cabs.",
        h1: "Villupuram Junction Taxi",
        keywords: [
            "Villupuram railway station taxi",
            "Villupuram to Pondicherry drop taxi",
            "Gingee fort sightseeing cab",
            "Melmalayanur Angalamman temple taxi",
            "One way taxi Villupuram to Chennai",
            "Thirukoilur Ulagalantha Perumal cab",
            "Auroville taxi from Villupuram",
            "Villupuram local cab booking",
            "Outstation taxi Villupuram",
            "Innova rental Villupuram"
        ],
        oneWayContent: "Villupuram is the major railway junction of the south. Thousands deboard here for **Pondicherry** and **Tiruvannamalai**. We provide instant **Station Pickups** and **Drop Taxis** to these destinations. Our **Villupuram to Chennai** one-way service is strictly metered/fixed rate.",
        roundTripContent: "Explore the 'Troy of the East'! Our **Gingee Fort Package** gives you a full day to trek the Rajagiri and Krishnagiri forts. Devotees visit the powerful **Melmalayanur Angalamman Temple** (Amavasai special). We also verify trips to **Auroville** and **Pondicherry** beaches.",
        touristPlaces: [
            { name: "Gingee Fort", type: "Heritage", distance: "25 km", bestFor: "Trekking, History" },
            { name: "Melmalayanur", type: "Temple", distance: "40 km", bestFor: "Angalamman Temple" },
            { name: "Thirukoilur", type: "Temple", distance: "35 km", bestFor: "Divya Desam" },
            { name: "Auroville", type: "City", distance: "35 km", bestFor: "Global Township" },
            { name: "Thiruvakkarai", type: "Heritage", distance: "25 km", bestFor: "Wood Fossil Park" }
        ],
        nearbyDistricts: ["pondicherry", "cuddalore", "tiruvannamalai", "kallakurichi"],
        recommendedVehicles: ["etios", "sedan", "suv", "mini"],
        faqs: [
            {
                question: "Taxi fare from Villupuram Station to Pondicherry?",
                answer: "It is about 40 km. A one-way drop costs **₹900 - ₹1200**. Takes 1 hour."
            },
            {
                question: "Is it safe to trek Gingee Fort?",
                answer: "Yes, but it is steep. Carry water. Best to start early (8 AM). We wait at the parking lot."
            },
            {
                question: "Do you go to Melmalayanur on Amavasai?",
                answer: "Yes, Amavasai nights are crowded. We have special packages. Booking in advance is mandatory."
            },
            {
                question: "Can we visit the Fossil Park?",
                answer: "Yes, the National Fossil Wood Park in Thiruvakkarai is unique (20 million years old). Great for kids."
            },
            {
                question: "Distance to Chennai?",
                answer: "About 160 km via GST Road. 3 hours drive."
            }
        ]
    },
    {
        id: "kallakurichi",
        slug: "kallakurichi",
        name: "Kallakurichi",
        seoTitle: "Kallakurichi Taxi Service | Kalvarayan Hills Trip",
        metaDescription: "Best taxi in Kallakurichi. Kalvarayan hills trekking & waterfalls. Drop taxi to Salem, Chennai, Attur. Gomukhi dam taxi. Safe drivers.",
        h1: "Kallakurichi District Taxi",
        keywords: [
            "Kalvarayan hills taxi booking",
            "Kallakurichi to Salem drop taxi",
            "Megam falls taxi service",
            "Gomukhi dam sightseeing cab",
            "One way taxi Kallakurichi to Chennai",
            "Periyar falls taxi",
            "Kallakurichi local cab service",
            "Outstation taxi from Kallakurichi",
            "Thirukovilur temple taxi",
            "Innova rental Kallakurichi"
        ],
        oneWayContent: "Kallakurichi is an agricultural hub. We provide **Business drops** to **Salem** and **Chennai** for farmers and traders. We connect the district to **Villupuram Junction** for train connectivity. Our drivers are locals who know every village route.",
        roundTripContent: "Discover the unexpected! **Kalvarayan Hills** is a hidden gem with waterfalls like **Megam Falls** and **Periyar Falls**. Our **Eco-Tourism Package** takes you to **Gomukhi Dam** and the hills. Note: The hill roads are scenic but lack shops, so our drivers ensure the car is stocked.",
        touristPlaces: [
            { name: "Kalvarayan Hills", type: "Hill Station", distance: "50 km", bestFor: "Waterfalls, Trek" },
            { name: "Megam Falls", type: "Nature", distance: "Kalvarayan", bestFor: "Bathing" },
            { name: "Gomukhi Dam", type: "Nature", distance: "15 km", bestFor: "Picnic" },
            { name: "Thirukovilur", type: "Temple", distance: "30 km", bestFor: "Kabilar Kundru" },
            { name: "Periyar Falls", type: "Nature", distance: "Kalvarayan", bestFor: "Waterfalls" }
        ],
        nearbyDistricts: ["salem", "villupuram", "pudukkottai", "perambalur"],
        recommendedVehicles: ["suv", "innova", "etios", "sedan"],
        faqs: [
            {
                question: "Are Kalvarayan Hills accessible by car?",
                answer: "Yes, the road goes up to the falls. It is less commercialized than Ooty. A true nature experience."
            },
            {
                question: "Is there accommodation in the hills?",
                answer: "Options are very limited. We recommend a **Day Trip** - start morning, return evening."
            },
            {
                question: "Distance from Kallakurichi to Chennai?",
                answer: "It is about 200 km. A 4-hour drive. We have daily drops."
            },
            {
                question: "Can we bathe in Megam Falls?",
                answer: "Yes, it is safe and popular. Changing rooms are basic."
            },
            {
                question: "Do you service small villages in the district?",
                answer: "Yes, we serve all taluks including Sankarapuram and Chinnasalem."
            }
        ]
    },
    {
        id: "perambalur",
        slug: "perambalur",
        name: "Perambalur",
        seoTitle: "Perambalur Taxi Service | Ranjankudi Fort & Siruvachur",
        metaDescription: "Top Perambalur taxi service. Visit Siruvachur Mathura Kaliamman. Ranjankudi Fort tour. Drop taxi to Trichy Airport, Chennai. Budget cabs.",
        h1: "Perambalur District Taxi",
        keywords: [
            "Perambalur to Trichy airport taxi",
            "Siruvachur Mathura Kaliamman temple cab",
            "Ranjankudi fort sightseeing taxi",
            "One way taxi Perambalur to Chennai",
            "Chettikulam Dandayuthapani temple cab",
            "Perambalur local taxi booking",
            "Viswakudi dam taxi",
            "Outstation taxi Perambalur",
            "Perambalur to Salem drop taxi",
            "Innova rental Perambalur"
        ],
        oneWayContent: "Perambalur is the geographic center of Tamil Nadu. We operate frequent **One Way Cabs** on the **Trichy-Chennai NH45**. It is the perfect pitstop district. We provide drops to **Trichy Airport** (just 45 mins away) for NRIs connecting to their villages.",
        roundTripContent: "Visit the powerful **Siruvachur Mathura Kaliamman Temple** (open mostly on Mondays/Fridays). History enthusiasts can climb the **Ranjankudi Fort**, a beautifully preserved 17th-century bastion. We also cover the **Chettikulam Murugan Temple**.",
        touristPlaces: [
            { name: "Siruvachur", type: "Temple", distance: "8 km", bestFor: "Kaliamman Temple" },
            { name: "Ranjankudi Fort", type: "Heritage", distance: "15 km", bestFor: "Fort, History" },
            { name: "Chettikulam", type: "Temple", distance: "20 km", bestFor: "Murugan Temple" },
            { name: "Viswakudi Dam", type: "Nature", distance: "15 km", bestFor: "Eco Park" },
            { name: "Sathanur", type: "Heritage", distance: "25 km", bestFor: "Fossil Site" }
        ],
        nearbyDistricts: ["trichy", "ariyalur", "salem", "cuddalore"],
        recommendedVehicles: ["etios", "sedan", "mini", "innova"],
        faqs: [
            {
                question: "When is Siruvachur Temple open?",
                answer: "The temple is usually open to public on **Mondays and Fridays** and special festival days. Please check before planning."
            },
            {
                question: "How far is Trichy Airport?",
                answer: "It is about **60 km**. A quick 1-hour drive."
            },
            {
                question: "Is Ranjankudi Fort worth visiting?",
                answer: "Yes, it is one of the best-maintained forts off the highway. Great for history lovers and minimal trekking."
            },
            {
                question: "Taxi fare Perambalur to Chennai?",
                answer: "It is roughly 280 km. A drop costs around **₹4500 - ₹5000**. We use the toll road."
            },
            {
                question: "Do you have waiting charge for temple visits?",
                answer: "We offer **Wait and Return** packages where waiting charges are included for the first 2 hours."
            }
        ]
    },
    {
        id: "ariyalur",
        slug: "ariyalur",
        name: "Ariyalur",
        seoTitle: "Ariyalur Taxi Service | Gangaikonda Cholapuram Tour",
        metaDescription: "Best taxi in Ariyalur. Visit Gangaikonda Cholapuram (UNESCO). Drop taxi to Trichy, Thanjavur, Chennai. Cement city corporate cabs.",
        h1: "Ariyalur & Chola Taxi",
        keywords: [
            "Gangaikonda Cholapuram taxi tour",
            "Ariyalur to Trichy airport taxi",
            "Jayankondam taxi service",
            "One way taxi Ariyalur to Chennai",
            "Karaivetti bird sanctuary cab",
            "Thirukalappur temple taxi",
            "Ariyalur railway station to Gangaikondacholapuram taxi",
            "Cement factory visit cab Ariyalur",
            "Ariyalur local taxi booking",
            "Innova rental Ariyalur"
        ],
        oneWayContent: "Ariyalur is the Cement City and Land of Cholas. We serve the **Cement Factories** with **Corporate Cabs** for executives. Tourists use our **Station Pickup** to visit the UNESCO site **Gangaikonda Cholapuram**. We also offer drops to **Thanjavur** and **Trichy**.",
        roundTripContent: "Witness the grandeur of Rajendra Chola! Our **Chola Empire Package** covers **Gangaikonda Cholapuram** (The Brihadeeswarar Temple's twin). Nature lovers can drive to the **Karaivetti Bird Sanctuary**, one of the largest water bird sanctuaries in TN. We recommend **AC Cabs** due to the dry heat.",
        touristPlaces: [
            { name: "Gangaikonda Cholapuram", type: "Heritage", distance: "35 km", bestFor: "UNESCO Temple" },
            { name: "Karaivetti Sanctuary", type: "Nature", distance: "25 km", bestFor: "Birds" },
            { name: "Kaliysaperumal", type: "Temple", distance: "5 km", bestFor: "Local Deity" },
            { name: "Jayankondam", type: "City", distance: "30 km", bestFor: "Lignite Power" },
            { name: "Thirumalapadi", type: "Temple", distance: "15 km", bestFor: "Shiva Temple" }
        ],
        nearbyDistricts: ["perambalur", "thanjavur", "cuddalore", "trichy"],
        recommendedVehicles: ["etios", "sedan", "innova", "suv"],
        faqs: [
            {
                question: "Is Gangaikonda Cholapuram same as Thanjavur Big Temple?",
                answer: "It is its 'feminine counterpart' built by the son, Rajendra Chola. It is quieter and equally majestic. A must-visit."
            },
            {
                question: "Best time to visit Karaivetti?",
                answer: "November to February is the migratory bird season. It is a photographer's paradise."
            },
            {
                question: "Distance from Ariyalur Station to Temple?",
                answer: "It is about 35-40 km. We can pick you up from the train and take you there."
            },
            {
                question: "Do you serve the cement plants?",
                answer: "Yes, we have gate passes/procedures familiarity for Dalmia, Ramco, and UltraTech plants for official visits."
            },
            {
                question: "Taxi fare Ariyalur to Chennai?",
                answer: "It is about 300 km. A 5-hour drive. We offer one-way drops."
            }
        ]
    },
    {
        id: "pondicherry",
        slug: "pondicherry",
        name: "Pondicherry",
        seoTitle: "Pondicherry Taxi Service | Chennai to Pondy Drop Taxi",
        metaDescription: "Best taxi service in Pondicherry. Chennai to Pondicherry drop taxi @ Flat Rate. Auroville & Paradise Beach sightseeing. Weekend offer cabs.",
        h1: "Pondicherry (Puducherry) Taxi Service",
        keywords: [
            "Chennai to Pondicherry tax fare",
            "Pondicherry to Bangalore drop taxi",
            "Auroville sightseeing cab booking",
            "Pondicherry local taxi service",
            "One way taxi Pondicherry to Chennai airport",
            "Paradise beach boat house taxi",
            "Pondicherry promenade cab",
            "White Town heritage taxi tour",
            "Outstation taxi from Pondicherry",
            "Innova rental Pondicherry"
        ],
        oneWayContent: "Pondicherry is the heavy-hitter of TN tourism. We run **Hourly Shuttles** from **Chennai Airport to Pondicherry** via the scenic ECR road. Our **One Way Drop** rates are the most competitive in the market, challenging even bus fares for groups of 4.",
        roundTripContent: "Experience the French Riviera of the East! Our **Pondy Weekend Package** covers **White Town**, **Aurobindo Ashram**, and **Manakula Vinayagar Temple**. We also drive you to **Auroville** (Matrimandir viewing point) and **Paradise Beach**. Our drivers can suggest the best cafes for French cuisine.",
        touristPlaces: [
            { name: "Auroville", type: "City", distance: "12 km", bestFor: "Matrimandir, Peace" },
            { name: "Promenade Beach", type: "Nature", distance: "City Center", bestFor: "Beach Walk" },
            { name: "Paradise Beach", type: "Nature", distance: "8 km", bestFor: "Boating, Clean Beach" },
            { name: "Arulmigu Manakula Vinayagar", type: "Temple", distance: "White Town", bestFor: "Ganesh Temple" },
            { name: "Aurobindo Ashram", type: "Heritage", distance: "White Town", bestFor: "Meditation" }
        ],
        nearbyDistricts: ["villupuram", "cuddalore", "chennai", "kanchipuram"],
        recommendedVehicles: ["sedan", "innova", "etios", "tempo"],
        faqs: [
            {
                question: "Taxi fare for Chennai to Pondicherry?",
                answer: "It is about 150 km via ECR. Our flat rate for a Sedan is **₹2500 - ₹2800** (All inclusive)."
            },
            {
                question: "Is ECR road safe at night?",
                answer: "ECR is a 2-lane road. We recommend experienced drivers for night travel. Our drivers are regulars on this route."
            },
            {
                question: "Do you cover Auroville inside transport?",
                answer: "Cars are allowed up to the Visitor Center. From there, you have to walk or take the Auroville shuttle to Matrimandir viewing point."
            },
            {
                question: "Can we rent a cab for partying/nightlife?",
                answer: "We provide point-to-point drops. We strictly do not allow alcohol consumption inside the vehicle."
            },
            {
                question: "Distance to Bangalore?",
                answer: "About 320 km via Tiruvannamalai. It is a 6-7 hour drive."
            }
        ]
    },
    {
        id: "bangalore",
        slug: "bangalore",
        name: "Bangalore (Outstation)",
        seoTitle: "Bangalore to Tamil Nadu Taxi | Inter-State Drop Taxi",
        metaDescription: "Bangalore to Tamil Nadu drop taxi service. Bangalore to Chennai, Ooty, Coimbatore cabs. Inter-state permit included. Airport pickup KIAL.",
        h1: "Bangalore Outstation Taxi Service",
        keywords: [
            "Bangalore to Chennai drop taxi",
            "Bangalore to Ooty taxi fare",
            "Hogenakkal falls taxi from Bangalore",
            "Bangalore to Coimbatore one way cab",
            "KIAL airport to Hosur taxi",
            "Bangalore to Pondicherry cab booking",
            "Bangalore to Salem drop taxi",
            "Outstation taxi Bangalore",
            "Innova Crysta rental Bangalore",
            "Sripuram Golden temple taxi from Bangalore"
        ],
        oneWayContent: "Bangalore is our biggest source market. We specialize in **Bangalore to Tamil Nadu** drops. Whether you are moving to **Chennai**, visiting **Ooty** for a holiday, or going home to **Madurai**, our **Inter-State Drops** are hassle-free. We handle all Permit taxes.",
        roundTripContent: "Weekend getaway from Bangalore? We offer customized packages to **Yercaud** (4 hrs), **Hogenakkal** (3 hrs), and **Ooty** (6 hrs). Our drivers are fluent in Kannada and Tamil, ensuring smooth communication across the border. We pick you up from **KIAL Airport** or your doorstep.",
        touristPlaces: [
            { name: "Ooty", type: "Hill Station", distance: "280 km", bestFor: "Weekend Trip" },
            { name: "Hogenakkal", type: "Nature", distance: "140 km", bestFor: "Day Trip" },
            { name: "Yercaud", type: "Hill Station", distance: "210 km", bestFor: "Hill Drive" },
            { name: "Vellore", type: "City", distance: "200 km", bestFor: "Golden Temple" },
            { name: "Pondicherry", type: "City", distance: "320 km", bestFor: "Beach Trip" }
        ],
        nearbyDistricts: ["hosur", "krishnagiri", "chittoor", "dharmapuri"],
        recommendedVehicles: ["etios", "sedan", "innova-crysta", "suv"],
        faqs: [
            {
                question: "Is state permit tax included in the fare?",
                answer: "For One Way Drops, we usually quote an **All-Inclusive Price**. For Round Trips, permit fees are payable on actuals."
            },
            {
                question: "Bangalore to Ooty taxi time?",
                answer: "It takes about **6-7 hours** via Mysore. The route through Bandipur forest is scenic (closes at night)."
            },
            {
                question: "Pick up from KIAL Airport?",
                answer: "Yes, we track flights. Our driver will wait at the arrival terminal. Parking charges are extra."
            },
            {
                question: "Do you have local Bangalore city cabs?",
                answer: "No, we specialize only in **Outstation Trips** to and from Tamil Nadu."
            },
            {
                question: "Bangalore to Chennai drop cost?",
                answer: "It is 350 km. A Sedan drop costs around **₹4500 - ₹5000**."
            }
        ]
    },
    {
        id: "tirupati",
        slug: "tirupati",
        name: "Tirupati (Outstation)",
        seoTitle: "Tirupati Taxi Service | Chennai to Tirupati Darshan Cab",
        metaDescription: "Reliable Tirupati taxi service. Chennai to Tirupati car rental. Tirumala darshan packages. Kalahasti temple taxi. Airport pickup/drop.",
        h1: "Tirupati & Tirumala Taxi Service",
        keywords: [
            "Chennai to Tirupati taxi fare",
            "Tirupati to Vellore Golden Temple taxi",
            "Kalahasti temple taxi booking",
            "Tirupati to Kanchipuram cab",
            "Renigunta airport taxi service",
            "Tirumala ghat road safe taxi",
            "One way taxi Tirupati to Chennai",
            "Bangalore to Tirupati drop taxi",
            "Tirupati local sightseeing cab",
            "Innova rental for Tirupati"
        ],
        oneWayContent: "Tirupati is the spiritual capital. We provide high-frequency **Chennai to Tirupati** cabs. Our drivers are experts on the **Tirumala Ghat Road**. We also offer drops to **Renigunta Airport** and **Vellore Golden Temple**.",
        roundTripContent: "The divine triangle! Our popular package covers **Tirupati Balaji**, **Kalahasti (Rahu Ketu)**, and **Tiruchanoor Padmavathi Ammavari**. We can also extend the trip to **Kanipakam** (Vinayagar). Our vehicles are cleaned daily and suitable for orthodox pilgrimages.",
        touristPlaces: [
            { name: "Tirumala Temple", type: "Temple", distance: "22 km (Uphill)", bestFor: "Balaji Darshan" },
            { name: "Kalahasti", type: "Temple", distance: "35 km", bestFor: "Rahu Ketu Pooja" },
            { name: "Tiruchanoor", type: "Temple", distance: "5 km", bestFor: "Padmavathi Temple" },
            { name: "Kapila Theertham", type: "Temple", distance: "City Center", bestFor: "Waterfalls" },
            { name: "Talakona Falls", type: "Nature", distance: "60 km", bestFor: "Forest, Waterfalls" }
        ],
        nearbyDistricts: ["chittoor", "tiruvallur", "vellore", "chennai"],
        recommendedVehicles: ["etios", "innova", "suv", "tempo"],
        faqs: [
            {
                question: "Are cabs allowed to climb Tirumala hills?",
                answer: "Yes, private cabs are allowed. There is a security check at Alipiri. Alcohol/Non-veg is strictly prohibited."
            },
            {
                question: "Do you help with Darshan tickets?",
                answer: "No, we only provide **Transport**. You must book TTD darshan tickets online in advance."
            },
            {
                question: "Chennai to Tirupati travel time?",
                answer: "It is about 140 km. Takes **3.5 - 4 hours** depending on traffic at the checkpost."
            },
            {
                question: "Is head tonsure (Mottai) possible?",
                answer: "Yes, there are many 'Kalyana Katta' centers in Tirumala. Our driver can guide you to the nearest one."
            },
            {
                question: "Can we complete Tirupati and Kalahasti in 1 day?",
                answer: "It is tight but possible if you start very early (4 AM) from Chennai and have Quick Darshan tickets."
            }
        ]
    }
];

export function getDistrictBySlug(slug: string): District | undefined {
    return districts.find(d => d.slug === slug);
}
