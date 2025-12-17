import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routes, getEnrichedRouteBySlug } from "@/lib/data/routes";
import styles from "./page.module.css";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return routes.map((route) => ({
        slug: route.slug,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const route = getEnrichedRouteBySlug(slug);

    if (!route) {
        return {
            title: "Route Not Found",
        };
    }

    const originName = route.origin?.name || route.originId;
    const destName = route.destination?.name || route.destinationId;

    return {
        title: `${originName} to ${destName} Taxi - ₹${route.pricing.sedan} | Book Cab`,
        description: route.metaDescription,
        keywords: [
            `${originName} to ${destName} taxi`,
            `${originName} ${destName} cab`,
            `taxi from ${originName}`,
            `cab to ${destName}`,
            `${originName} ${destName} outstation`,
        ],
        openGraph: {
            title: `${originName} to ${destName} Taxi | Cabigo`,
            description: route.metaDescription,
            type: "website",
            url: `https://cabigo.in/taxi-${route.slug}`,
        },
        alternates: {
            canonical: `https://cabigo.in/taxi-${route.slug}`,
        },
    };
}

export default async function RoutePage({ params }: PageProps) {
    const { slug } = await params;
    const route = getEnrichedRouteBySlug(slug);

    if (!route) {
        notFound();
    }

    const originName = route.origin?.name || route.originId;
    const destName = route.destination?.name || route.destinationId;

    // TaxiReservation JSON-LD Schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TaxiReservation",
        reservationFor: {
            "@type": "TaxiTrip",
            provider: {
                "@type": "TaxiService",
                name: "Cabigo",
                url: "https://cabigo.in",
            },
            tripOrigin: {
                "@type": "Place",
                name: originName,
                address: {
                    "@type": "PostalAddress",
                    addressLocality: originName,
                    addressCountry: "IN",
                },
            },
            tripDestination: {
                "@type": "Place",
                name: destName,
                address: {
                    "@type": "PostalAddress",
                    addressLocality: destName,
                    addressCountry: "IN",
                },
            },
        },
        priceSpecification: {
            "@type": "PriceSpecification",
            price: route.pricing.sedan,
            priceCurrency: "INR",
        },
    };

    // Product Schema for pricing comparison
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `Taxi from ${originName} to ${destName}`,
        description: route.metaDescription,
        offers: [
            {
                "@type": "Offer",
                name: "Sedan",
                price: route.pricing.sedan,
                priceCurrency: "INR",
                availability: "https://schema.org/InStock",
            },
            {
                "@type": "Offer",
                name: "SUV",
                price: route.pricing.suv,
                priceCurrency: "INR",
                availability: "https://schema.org/InStock",
            },
            {
                "@type": "Offer",
                name: "Premium",
                price: route.pricing.premium,
                priceCurrency: "INR",
                availability: "https://schema.org/InStock",
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.heroGradient}></div>
                </div>
                <div className={`container ${styles.heroContent}`}>
                    {/* Breadcrumbs */}
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <Link href="/routes">Routes</Link>
                        <span>/</span>
                        <span aria-current="page">
                            {originName} to {destName}
                        </span>
                    </nav>

                    <span className={`badge ${styles.routeBadge}`}>
                        {route.distance.km} km • {route.duration.text}
                    </span>
                    <h1 className={styles.heroTitle}>
                        <span className="text-gradient">{originName}</span> to{" "}
                        <span className="text-gradient">{destName}</span> Taxi
                    </h1>
                    <p className={styles.heroSubtitle}>{route.scenicNotes}</p>

                    {/* Quick Pricing */}
                    <div className={styles.quickPricing}>
                        <div className={styles.priceCard}>
                            <span className={styles.priceLabel}>Sedan</span>
                            <span className={styles.priceValue}>
                                ₹{route.pricing.sedan.toLocaleString()}
                            </span>
                        </div>
                        <div className={styles.priceCard}>
                            <span className={styles.priceLabel}>SUV</span>
                            <span className={styles.priceValue}>
                                ₹{route.pricing.suv.toLocaleString()}
                            </span>
                        </div>
                        <div className={styles.priceCard}>
                            <span className={styles.priceLabel}>Premium</span>
                            <span className={styles.priceValue}>
                                ₹{route.pricing.premium.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className={styles.heroActions}>
                        <Link href="/book" className="btn btn-primary">
                            Book This Route
                        </Link>
                        <a href="tel:+911800XXXXXX" className="btn btn-secondary">
                            Call: 1800-XXX-XXXX
                        </a>
                    </div>
                </div>
            </section>

            {/* Route Details Section */}
            <section className={`section ${styles.detailsSection}`}>
                <div className="container">
                    <div className={styles.detailsGrid}>
                        {/* Left Column - Route Info */}
                        <div className={styles.routeInfo}>
                            <h2>Route Details</h2>

                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>📍</span>
                                    <div>
                                        <span className={styles.infoLabel}>Distance</span>
                                        <span className={styles.infoValue}>
                                            {route.distance.km} km ({route.distance.miles} miles)
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>⏱️</span>
                                    <div>
                                        <span className={styles.infoLabel}>Travel Time</span>
                                        <span className={styles.infoValue}>{route.duration.text}</span>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>🛣️</span>
                                    <div>
                                        <span className={styles.infoLabel}>Road Condition</span>
                                        <span className={styles.infoValue}>{route.roadCondition}</span>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>🚧</span>
                                    <div>
                                        <span className={styles.infoLabel}>Toll Plazas</span>
                                        <span className={styles.infoValue}>
                                            {route.tollInfo.count} tolls (~₹{route.tollInfo.estimatedCost})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Route Highlights - UNIQUE VALUE */}
                            <div className={styles.highlights}>
                                <h3>Route Highlights</h3>
                                <ul className={styles.highlightsList}>
                                    {route.highlights.map((highlight, index) => (
                                        <li key={index}>
                                            <span className={styles.checkIcon}>✓</span>
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Best Time to Travel - UNIQUE VALUE */}
                            <div className={styles.bestTime}>
                                <h3>🕐 Best Time to Travel</h3>
                                <p>{route.bestTimeToTravel}</p>
                            </div>
                        </div>

                        {/* Right Column - Pricing & Booking */}
                        <div className={styles.bookingCard}>
                            <h3>Choose Your Vehicle</h3>

                            <div className={styles.vehicleOptions}>
                                <label className={styles.vehicleOption}>
                                    <input type="radio" name="vehicle" value="sedan" defaultChecked />
                                    <div className={styles.vehicleContent}>
                                        <div className={styles.vehicleInfo}>
                                            <span className={styles.vehicleName}>Sedan</span>
                                            <span className={styles.vehicleDesc}>Swift Dzire, Honda Amaze</span>
                                        </div>
                                        <span className={styles.vehiclePrice}>
                                            ₹{route.pricing.sedan.toLocaleString()}
                                        </span>
                                    </div>
                                </label>

                                <label className={styles.vehicleOption}>
                                    <input type="radio" name="vehicle" value="suv" />
                                    <div className={styles.vehicleContent}>
                                        <div className={styles.vehicleInfo}>
                                            <span className={styles.vehicleName}>SUV</span>
                                            <span className={styles.vehicleDesc}>
                                                Ertiga, Innova (6-7 seats)
                                            </span>
                                        </div>
                                        <span className={styles.vehiclePrice}>
                                            ₹{route.pricing.suv.toLocaleString()}
                                        </span>
                                    </div>
                                </label>

                                <label className={styles.vehicleOption}>
                                    <input type="radio" name="vehicle" value="premium" />
                                    <div className={styles.vehicleContent}>
                                        <div className={styles.vehicleInfo}>
                                            <span className={styles.vehicleName}>Premium</span>
                                            <span className={styles.vehicleDesc}>
                                                Innova Crysta, Mercedes
                                            </span>
                                        </div>
                                        <span className={styles.vehiclePrice}>
                                            ₹{route.pricing.premium.toLocaleString()}
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className={styles.inclusions}>
                                <h4>Inclusions</h4>
                                <ul>
                                    <li>✓ AC vehicle</li>
                                    <li>✓ Experienced driver</li>
                                    <li>✓ Fuel charges</li>
                                    <li>✓ GST</li>
                                </ul>
                            </div>

                            <Link href="/book" className="btn btn-primary" style={{ width: "100%" }}>
                                Book Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Stops Section - UNIQUE VALUE */}
            <section className={`section ${styles.stopsSection}`}>
                <div className="container">
                    <div className="section-header">
                        <h2>Popular Stops on the Way</h2>
                        <p>Ask your driver to stop at these recommended places</p>
                    </div>
                    <div className={styles.stopsGrid}>
                        {route.popularStops.map((stop, index) => (
                            <div key={index} className={styles.stopCard}>
                                <span className={styles.stopNumber}>{index + 1}</span>
                                <span className={styles.stopName}>{stop}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Price Comparison Section - UNIQUE VALUE */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2>Compare Travel Options</h2>
                        <p>
                            See how taxi compares to other modes of transport for {originName} to{" "}
                            {destName}
                        </p>
                    </div>
                    <div className={styles.comparisonTable}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Mode</th>
                                    <th>Cost (approx)</th>
                                    <th>Duration</th>
                                    <th>Convenience</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className={styles.highlighted}>
                                    <td>
                                        <strong>🚕 Cabigo Taxi</strong>
                                    </td>
                                    <td>₹{route.pricing.sedan.toLocaleString()}</td>
                                    <td>{route.duration.text}</td>
                                    <td>⭐⭐⭐⭐⭐ Door-to-door</td>
                                </tr>
                                {route.alternativeTransport.map((alt, index) => (
                                    <tr key={index}>
                                        <td>{alt.mode}</td>
                                        <td>₹{alt.cost}</td>
                                        <td>{alt.duration}</td>
                                        <td>⭐⭐⭐ Station-to-station</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className={`section ${styles.faqSection}`}>
                <div className="container">
                    <div className="section-header">
                        <h2>Frequently Asked Questions</h2>
                        <p>
                            Common queries about {originName} to {destName} taxi
                        </p>
                    </div>
                    <div className={styles.faqList}>
                        <details className={styles.faqItem}>
                            <summary>
                                What is the taxi fare from {originName} to {destName}?
                            </summary>
                            <p>
                                The taxi fare from {originName} to {destName} starts at ₹
                                {route.pricing.sedan.toLocaleString()} for a sedan (Swift Dzire, Honda
                                Amaze). SUV cabs (Ertiga, Innova) cost ₹
                                {route.pricing.suv.toLocaleString()}, and premium vehicles (Innova
                                Crysta, Mercedes) are priced at ₹
                                {route.pricing.premium.toLocaleString()}. All prices include fuel and
                                GST.
                            </p>
                        </details>
                        <details className={styles.faqItem}>
                            <summary>
                                How long does it take to travel from {originName} to {destName} by
                                taxi?
                            </summary>
                            <p>
                                The journey from {originName} to {destName} takes approximately{" "}
                                {route.duration.text} by taxi, covering {route.distance.km} km. Actual
                                time may vary based on traffic, weather, and chosen route. We recommend
                                starting {route.bestTimeToTravel.toLowerCase()}.
                            </p>
                        </details>
                        <details className={styles.faqItem}>
                            <summary>Is one-way taxi available for this route?</summary>
                            <p>
                                Yes, Cabigo offers both one-way and round-trip taxis from {originName}{" "}
                                to {destName}. For one-way trips, you only pay for the single journey.
                                Round-trip bookings come with a waiting charge if the driver stays with
                                you.
                            </p>
                        </details>
                        <details className={styles.faqItem}>
                            <summary>Can I make stops during the journey?</summary>
                            <p>
                                Absolutely! Our drivers are happy to stop at popular points like{" "}
                                {route.popularStops.slice(0, 2).join(" or ")}. Inform your driver in
                                advance or let them know during the trip. Short stops for photos or
                                refreshments are complimentary.
                            </p>
                        </details>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <div className="container">
                    <div className={styles.ctaContent}>
                        <h2>
                            Book Your {originName} to {destName} Taxi
                        </h2>
                        <p>
                            Travel comfortably with Cabigo. Verified drivers, AC cabs, and
                            transparent pricing.
                        </p>
                        <Link href="/book" className="btn btn-primary">
                            Book Now - From ₹{route.pricing.sedan.toLocaleString()}
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
