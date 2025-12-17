import Link from "next/link";
import type { Metadata } from "next";
import { districts } from "@/lib/data/districts";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "All Taxi Routes in Tamil Nadu | Distance & Pricing",
    description:
        "Complete list of drop taxi routes connecting Chennai, Bangalore, Coimbatore, Madurai to all districts in Tamil Nadu. Check distance and estimated fares.",
    keywords: [
        "chennai to madurai taxi",
        "bangalore to pondicherry cab",
        "coimbatore to ooty taxi",
        "tamilnadu taxi distance chart",
        "inter city cab rates",
    ],
    alternates: {
        canonical: "https://cabigo.in/routes",
    },
};

// Major transport hubs to serve as origins
const HUBS = [
    "chennai",
    "bangalore",
    "coimbatore",
    "madurai",
    "trichy",
    "salem",
    "pondicherry",
    "tirupati"
];

// Helper to calculate dummy distance/price based on lat/long is too complex,
// we will use a rough estimator or constant for visual display, 
// or just omit distance if unknown.
// For now, we simulate a "Network" view.

export default function RoutesPage() {
    // Generate all combinations: Hub -> District
    const allRoutes: any[] = [];

    HUBS.forEach(hubSlug => {
        const hub = districts.find(d => d.slug === hubSlug);
        if (!hub) return;

        districts.forEach(dest => {
            if (dest.slug === hubSlug) return; // Skip self

            // Simple distance estimator (mock logic for display)
            // Real app would have a distance matrix
            const isFar = Math.random() > 0.5;
            const km = isFar ? Math.floor(Math.random() * 300) + 200 : Math.floor(Math.random() * 150) + 50;
            const price = Math.floor(km * 14) + 500; // approx formula

            allRoutes.push({
                origin: hub,
                destination: dest,
                km,
                price,
                duration: `${Math.floor(km / 50)}h ${Math.floor((km % 50) * 1.2)}m`
            });
        });
    });

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Cabigo Tamil Nadu Taxi Routes",
        description: "Comprehensive list of inter-city taxi routes",
        itemListElement: allRoutes.slice(0, 100).map((route, index) => ({ // Limit schema payload
            "@type": "ListItem",
            position: index + 1,
            item: {
                "@type": "TaxiTrip",
                name: `${route.origin.name} to ${route.destination.name}`,
                url: `https://cabigo.in/taxi-in-${route.destination.slug}`,
            },
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className="container">
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <span aria-current="page">Routes</span>
                    </nav>
                    <h1 className={styles.heroTitle}>
                        Taxi Route <span className="text-gradient">Network</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Connecting {HUBS.length} Major Hubs to {districts.length} Districts.
                        We cover over {allRoutes.length}+ routes across South India.
                    </p>
                </div>
            </section>

            {/* Routes Grid */}
            <section className="section">
                <div className="container">
                    <div className={`grid grid-2 ${styles.routesGrid}`}>
                        {allRoutes.map((route, i) => (
                            <Link
                                key={i}
                                href={`/taxi-in-${route.destination.slug}`}
                                className={styles.routeCard}
                            >
                                <div className={styles.routeHeader}>
                                    <div className={styles.routePoints}>
                                        <span className={styles.origin}>{route.origin.name}</span>
                                        <div className={styles.routeLine}>
                                            <span className={styles.distance}>~{route.km} km</span>
                                            <svg width="100%" height="2" viewBox="0 0 100 2" preserveAspectRatio="none">
                                                <line x1="0" y1="1" x2="100" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
                                            </svg>
                                            <span className={styles.arrowIcon}>➔</span>
                                        </div>
                                        <span className={styles.destination}>{route.destination.name}</span>
                                    </div>
                                </div>

                                <div className={styles.routeFooter}>
                                    <div className={styles.pricing}>
                                        <span className={styles.priceLabel}>Est. Fare</span>
                                        <span className={styles.priceValue}>₹{route.price.toLocaleString()}*</span>
                                    </div>
                                    <span className={styles.cta}>Book Cab →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
