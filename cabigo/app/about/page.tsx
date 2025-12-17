import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "About Cabigo Tamil Nadu - Our Story & Values",
    description:
        "We are Tamil Nadu's deeply routed taxi service. Serving 8+ districts with a focus on safety, affordability, and local expertise.",
    alternates: {
        canonical: "https://cabigo.in/about",
    },
};

export default function AboutPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        mainEntity: {
            "@type": "Organization",
            name: "Cabigo Tamil Nadu",
            description:
                "Premium drop taxi service across Tamil Nadu.",
            foundingDate: "2020",
            address: {
                "@type": "PostalAddress",
                streetAddress: "Anna Salai",
                addressLocality: "Chennai",
                addressRegion: "Tamil Nadu",
                postalCode: "600002",
                addressCountry: "IN",
            },
        },
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
                        <span aria-current="page">About</span>
                    </nav>
                    <h1 className={styles.heroTitle}>
                        About <span className="text-gradient">Cabigo TN</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Born in Chennai, serving the entire state. We understand the heartbeat of Tamil Nadu.
                    </p>
                </div>
            </section>

            {/* Story Section */}
            <section className="section">
                <div className="container">
                    <div className={styles.storyGrid}>
                        <div className={styles.storyContent}>
                            <h2>Namma Ooru Taxi</h2>
                            <p>
                                Cabigo started as a small fleet in Chennai with a simple promise: honest pricing for honest rides. We noticed that customers were forced to pay round-trip fares for one-way drops to places like Pondicherry or Trichy.
                            </p>
                            <p>
                                We changed that. We introduced the &quot;Drop Taxi&quot; model - pay only for the distance you travel. Today, we connect Chennai, Coimbatore, Madurai, and every town in between.
                            </p>
                            <p>
                                Whether it&apos;s a pilgrimage to Rameswaram, a business trip to Bangalore, or a weekend getaway to Ooty, our drivers are your local guides. They know the best breakfast spots on the highway and the darshan timings of every major temple.
                            </p>
                        </div>
                        <div className={styles.storyStats}>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>10k+</span>
                                <span className={styles.statLabel}>Monthly Trips</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>32</span>
                                <span className={styles.statLabel}>Districts Served</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>1000+</span>
                                <span className={styles.statLabel}>Drivers</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>4.9★</span>
                                <span className={styles.statLabel}>Google Rating</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className={`section ${styles.valuesSection}`}>
                <div className="container">
                    <div className="section-header">
                        <h2>Our Core Values</h2>
                    </div>
                    <div className={`grid grid-3 ${styles.valuesGrid}`}>
                        <div className={`card ${styles.valueCard}`}>
                            <span className={styles.valueIcon}>🙏</span>
                            <h3>Atithi Devo Bhava</h3>
                            <p>
                                Guest is God. We treat every passenger with the utmost respect and care, ensuring a safe and comfortable journey.
                            </p>
                        </div>
                        <div className={`card ${styles.valueCard}`}>
                            <span className={styles.valueIcon}>💰</span>
                            <h3>No Hidden Costs</h3>
                            <p>
                                The price you see is the price you pay. Tolls, state tax, and driver allowance are clear. No surprises at the destination.
                            </p>
                        </div>
                        <div className={`card ${styles.valueCard}`}>
                            <span className={styles.valueIcon}>⏰</span>
                            <h3>Punctuality</h3>
                            <p>
                                We know the value of time, especially for early morning flight catch-ups. Our drivers arrive 15 minutes before pickup time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
