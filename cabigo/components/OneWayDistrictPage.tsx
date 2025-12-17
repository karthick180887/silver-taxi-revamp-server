
import Link from "next/link";
import { notFound } from "next/navigation";
import { districts } from "@/lib/data/districts";
import { vehicles, Vehicle } from "@/lib/data/vehicles";
import styles from "./DistrictPage.module.css";
// We can reuse the same CSS module as the layout is identical.

interface Props {
    slug: string;
}

export function generateOneWayDistrictMetadata(slug: string) {
    const district = districts.find(d => d.slug === slug);
    if (!district) return { title: "Not Found" };
    return {
        title: `One Way Taxi in ${district.name} | Save 40% on Drop Taxi`,
        description: `Book lowest price One Way Drop Taxi from ${district.name} to Chennai, Bangalore, Coimbatore, or anywhere. Pay only for drop. 24/7 Cab Service.`,
        keywords: [`one way taxi ${district.name}`, `drop taxi ${district.name}`, `${district.name} to chennai one way taxi`, `outstation cab ${district.name}`, ...district.keywords],
        openGraph: {
            title: `One Way Taxi in ${district.name} | Save 40%`,
            description: `Pay only for drop. Reliable one way taxi service in ${district.name}.`,
            url: `https://cabigo.in/one-way-taxi-in-${district.slug}`,
            type: "website",
        },
        alternates: {
            canonical: `https://cabigo.in/one-way-taxi-in-${district.slug}`,
        }
    };
}

export default function OneWayDistrictPage({ slug }: Props) {
    const district = districts.find(d => d.slug === slug);
    if (!district) notFound();

    // Helper to get vehicle details
    const districtVehicles = district.recommendedVehicles
        .map(vid => vehicles.find(v => v.id === vid))
        .filter((v): v is Vehicle => v !== undefined);

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TaxiService",
                "name": `Cabigo One Way Taxi ${district.name}`,
                "description": `One way drop taxi service in ${district.name}`,
                "areaServed": {
                    "@type": "City",
                    "name": district.name
                },
                "url": `https://cabigo.in/one-way-taxi-in-${district.slug}`,
                "priceRange": "₹13/km - ₹24/km",
                "telephone": "+91-1800-XXX-XXXX",
                "serviceType": "One Way Cab"
            },
            {
                "@type": "FAQPage",
                "mainEntity": district.faqs.map(faq => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.answer
                    }
                }))
            }
        ]
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.heroGradient}></div>
                </div>
                <div className="container">
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <Link href="/">Home</Link> / <Link href="/one-way-taxi">One Way Taxi</Link> / <span>{district.name}</span>
                    </nav>

                    <h1 className={styles.heroTitle}>One Way Taxi Service in <span className="text-gradient">{district.name}</span></h1>
                    <p className={styles.heroSubtitle}>
                        Pay only for the distance traveled. Save up to 40% on outstation trips from {district.name} to anywhere in South India.
                    </p>

                    <div className={styles.heroActions}>
                        <Link href="/book" className="btn btn-primary">Book One Way from {district.name}</Link>
                        <a href="tel:+1800XXXXXX" className="btn btn-secondary">Call to Book</a>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <section className="section">
                <div className="container">
                    <div className={styles.contentGrid}>

                        {/* Left Column: Semantic Content */}
                        <div className={styles.mainContent}>

                            {/* One Way Benefits Section (Prioritized) */}
                            <div className={styles.contentBlock}>
                                <h2>Why Choose One Way Drop from {district.name}?</h2>
                                <ul>
                                    <li><strong>Pay Only for Drop:</strong> No return charges. You pay only for the Km you travel.</li>
                                    <li><strong>Doorstep Pickup:</strong> We pick you up from anywhere in {district.name}.</li>
                                    <li><strong>Zero Cancellation Fee:</strong> Change your plans? No problem.</li>
                                    <li><strong>24/7 Availability:</strong> Early morning or late night, we are available.</li>
                                </ul>
                                <p style={{ marginTop: '1rem' }}>
                                    Cabigo specializes in connecting {district.name} to major hubs like Chennai, Bangalore, Coimbatore, and Trichy with our reliable one-way fleet.
                                </p>
                            </div>

                            {/* Dynamic Content from District Data - One Way Focus */}
                            <div className={styles.contentBlock}>
                                <h2>Outstation Routes from {district.name}</h2>
                                <div dangerouslySetInnerHTML={{ __html: district.oneWayContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>

                            {/* Vehicle Options */}
                            <div className={styles.vehicleSection}>
                                <h2>Available One Way Cabs in {district.name}</h2>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.vehicleTable}>
                                        <thead>
                                            <tr>
                                                <th>Cab Type</th>
                                                <th>One Way Rate</th>
                                                <th>Capacity</th>
                                                <th>Ideal For</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {districtVehicles.map(v => (
                                                <tr key={v.id}>
                                                    <td><strong>{v.name}</strong><br /><span className={styles.fuelTag}>{v.fuelType}</span></td>
                                                    <td>Ask for Quote</td>
                                                    <td>{v.capacity}</td>
                                                    <td>{v.idealFor.slice(0, 1).join(", ")}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* FAQs */}
                            <div className={styles.faqSection}>
                                <h2>One Way Taxi FAQs - {district.name}</h2>
                                <div className={styles.faqList}>
                                    {district.faqs.map((faq, i) => (
                                        <details key={i} className={styles.faqItem}>
                                            <summary>{faq.question}</summary>
                                            <p>{faq.answer.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                                        </details>
                                    ))}
                                    {/* Adding a specific static FAQ if not present */}
                                    <details className={styles.faqItem}>
                                        <summary>Is there any hidden charge for one way?</summary>
                                        <p>No, our pricing for {district.name} one way drops is all-inclusive of tolls and driver batta. What you see is what you pay.</p>
                                    </details>
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Sidebar */}
                        <aside className={styles.sidebar}>
                            <div className={styles.stickyCard}>
                                <h3>Popular Drops from {district.name}</h3>
                                <ul className={styles.keywordList}>
                                    <li>✓ {district.name} to Chennai</li>
                                    <li>✓ {district.name} to Bangalore</li>
                                    <li>✓ {district.name} to Coimbatore</li>
                                    <li>✓ {district.name} to Trichy</li>
                                    <li>✓ {district.name} to Madurai</li>
                                </ul>
                            </div>

                            <div className={styles.linkCard}>
                                <h3>Nearby One Way Services</h3>
                                <div className={styles.tagCloud}>
                                    {district.nearbyDistricts.map(nid => (
                                        <Link key={nid} href={`/one-way-taxi-in-${nid}`} className={styles.districtTag}>
                                            {nid.charAt(0).toUpperCase() + nid.slice(1)} Drop
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>

                    </div>
                </div>
            </section>
        </>
    );
}
