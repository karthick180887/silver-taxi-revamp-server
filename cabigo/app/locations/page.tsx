import Link from "next/link";
import type { Metadata } from "next";
import { districts } from "@/lib/data/districts";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Taxi Services in Tamil Nadu Districts - Chennai, Madurai, Coimbatore",
    description:
        "Find reliable drop taxi services across all major Tamil Nadu districts. Chennai, Coimbatore, Madurai, Trichy, Salem, Vellore, and Pondicherry coverage.",
    keywords: [
        "taxi tamilnadu",
        "chennai call taxi",
        "coimbatore cabs",
        "madurai taxi service",
        "tn district taxi",
    ],
    alternates: {
        canonical: "https://cabigo.in/locations",
    },
};

export default function LocationsPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Cabigo Tamil Nadu Locations",
        description: "Cities in Tamil Nadu where Cabigo offers taxi services",
        itemListElement: districts.map((district, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
                "@type": "City",
                name: district.name,
                url: `https://cabigo.in/taxi-in-${district.slug}`,
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
                        <span aria-current="page">Locations</span>
                    </nav>
                    <h1 className={styles.heroTitle}>
                        Taxi Services in <span className="text-gradient">Tamil Nadu</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        We cover every corner of the state. From Chennai&apos;s coastline to
                        Ooty&apos;s hills, book reliable cabs anywhere in TN.
                    </p>
                </div>
            </section>

            {/* Locations Grid */}
            <section className="section">
                <div className="container">
                    <div className={`grid grid-3 ${styles.locationsGrid}`}>
                        {districts.map((district) => (
                            <Link
                                key={district.id}
                                href={`/taxi-in-${district.slug}`}
                                className={styles.locationCard}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardGradient}></div>
                                    <span className={styles.stateBadge}>Tamil Nadu</span>
                                </div>
                                <div className={styles.cardContent}>
                                    <h2 className={styles.cityName}>Taxi in {district.name}</h2>
                                    <p className={styles.cityDescription}>
                                        {district.metaDescription.substring(0, 100)}...
                                    </p>
                                    <div className={styles.cityMeta}>
                                        <span className={styles.landmark}>
                                            📍 Local & Outstation
                                        </span>
                                    </div>
                                    <div className={styles.services}>
                                        <span>Airport Pickup</span>
                                        <span>Temple Tours</span>
                                        <span>Drop Taxi</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Section */}
            <section className={`section ${styles.whySection}`}>
                <div className="container">
                    <div className="section-header">
                        <h2>Why Book with Cabigo TN?</h2>
                        <p>Trusted by locals and tourists alike</p>
                    </div>
                    <div className={`grid grid-4 ${styles.featuresGrid}`}>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🕉️</span>
                            <h3>Temple Expertise</h3>
                            <p>Drivers know darshan timings and dress codes</p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🛣️</span>
                            <h3>ECR Specialists</h3>
                            <p>Safe driving on East Coast Road scenic route</p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>⛰️</span>
                            <h3>Hill Driving</h3>
                            <p>Experts for Ooty, Kodaikanal, Yercaud hairpin bends</p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🗣️</span>
                            <h3>Language Support</h3>
                            <p>Drivers speak Tamil & English for easier communication</p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
