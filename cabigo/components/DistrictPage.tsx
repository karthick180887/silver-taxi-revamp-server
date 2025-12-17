
import Link from "next/link";
import { notFound } from "next/navigation";
import { districts } from "@/lib/data/districts";
import { vehicles, Vehicle } from "@/lib/data/vehicles";
import styles from "./DistrictPage.module.css";

interface Props {
    slug: string;
}

export function generateDistrictMetadata(slug: string) {
    const district = districts.find(d => d.slug === slug);
    if (!district) return { title: "Not Found" };
    return {
        title: district.seoTitle,
        description: district.metaDescription,
        keywords: district.keywords,
        openGraph: {
            title: district.seoTitle,
            description: district.metaDescription,
            url: `https://cabigo.in/taxi-in-${district.slug}`,
            type: "website",
        },
        alternates: {
            canonical: `https://cabigo.in/taxi-in-${district.slug}`,
        }
    };
}

export default function DistrictPage({ slug }: Props) {
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
                "name": `Cabigo ${district.name}`,
                "description": district.metaDescription,
                "areaServed": {
                    "@type": "City",
                    "name": district.name
                },
                "url": `https://cabigo.in/taxi-in-${district.slug}`,
                "priceRange": "₹10/km - ₹20/km",
                "telephone": "+91-1800-XXX-XXXX"
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
                        <Link href="/">Home</Link> / <Link href="/locations">Locations</Link> / <span>{district.name}</span>
                    </nav>

                    <h1 className={styles.heroTitle}>{district.h1}</h1>
                    <p className={styles.heroSubtitle}>{district.metaDescription}</p>

                    <div className={styles.heroActions}>
                        <Link href="/book" className="btn btn-primary">Book Taxi in {district.name}</Link>
                        <a href="tel:+1800XXXXXX" className="btn btn-secondary">Call Now</a>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <section className="section">
                <div className="container">
                    <div className={styles.contentGrid}>

                        {/* Left Column: Semantic Content */}
                        <div className={styles.mainContent}>

                            {/* One Way Section */}
                            <div className={styles.contentBlock}>
                                <h2>One Way Taxi Services in {district.name}</h2>
                                <div dangerouslySetInnerHTML={{ __html: district.oneWayContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>

                            {/* Round Trip Section */}
                            <div className={styles.contentBlock}>
                                <h2>Round Trip Taxi Packages from {district.name}</h2>
                                <div dangerouslySetInnerHTML={{ __html: district.roundTripContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>

                            {/* Vehicle Options */}
                            <div className={styles.vehicleSection}>
                                <h2>Vehicle Options Available in {district.name}</h2>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.vehicleTable}>
                                        <thead>
                                            <tr>
                                                <th>Vehicle Type</th>
                                                <th>Capacity</th>
                                                <th>Luggage</th>
                                                <th>Ideal For</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {districtVehicles.map(v => (
                                                <tr key={v.id}>
                                                    <td><strong>{v.name}</strong><br /><span className={styles.fuelTag}>{v.fuelType}</span></td>
                                                    <td>{v.capacity}</td>
                                                    <td>{v.luggage}</td>
                                                    <td>{v.idealFor.slice(0, 2).join(", ")}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tourist Places */}
                            <div className={styles.touristSection}>
                                <h2>Tourist Places Covered</h2>
                                <div className={`grid grid-2 ${styles.touristGrid}`}>
                                    {district.touristPlaces.map((place, i) => (
                                        <div key={i} className={styles.touristCard}>
                                            <span className={styles.placeType}>{place.type}</span>
                                            <h3>{place.name}</h3>
                                            <p className={styles.placeDist}>{place.distance} from {district.name}</p>
                                            <p className={styles.placeBest}>{place.bestFor}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FAQs */}
                            <div className={styles.faqSection}>
                                <h2>Frequently Asked Questions</h2>
                                <div className={styles.faqList}>
                                    {district.faqs.map((faq, i) => (
                                        <details key={i} className={styles.faqItem}>
                                            <summary>{faq.question}</summary>
                                            <p>{faq.answer.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                                        </details>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Sidebar */}
                        <aside className={styles.sidebar}>
                            <div className={styles.stickyCard}>
                                <h3>Popular Keywords</h3>
                                <ul className={styles.keywordList}>
                                    {district.keywords.map((k, i) => <li key={i}>✓ {k}</li>)}
                                </ul>
                            </div>

                            <div className={styles.linkCard}>
                                <h3>Nearby Districts Serviced</h3>
                                <div className={styles.tagCloud}>
                                    {district.nearbyDistricts.map(nid => (
                                        <Link key={nid} href={`/taxi-in-${nid}`} className={styles.districtTag}>
                                            {nid.charAt(0).toUpperCase() + nid.slice(1)} Taxi
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
