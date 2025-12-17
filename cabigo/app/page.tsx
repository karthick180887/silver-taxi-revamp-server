import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";
import { districts } from "@/lib/data/districts";
import { routes } from "@/lib/data/routes";

export const metadata: Metadata = {
  title: "Cabigo - No.1 Drop Taxi Service in Tamil Nadu | One Way Cab",
  description:
    "Book lowest price drop taxi in Tamil Nadu. One way cabs from Chennai, Coimbatore, Madurai to anywhere. Save 40% on outstation trips. 24/7 Service.",
};

export default function HomePage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TravelAgency",
            name: "Cabigo Tamil Nadu",
            url: "https://cabigo.in",
            logo: "https://cabigo.in/logo.png",
            description:
              "Leading drop taxi and one-way cab service provider in Tamil Nadu.",
            areaServed: {
              "@type": "State",
              name: "Tamil Nadu",
            },
            address: {
              "@type": "PostalAddress",
              streetAddress: "Anna Salai",
              addressLocality: "Chennai",
              addressRegion: "Tamil Nadu",
              postalCode: "600002",
              addressCountry: "IN",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+91-1800-XXX-XXXX",
              contactType: "customer service",
              areaServed: "TN",
              availableLanguage: ["English", "Tamil"],
            },
            sameAs: [
              "https://twitter.com/cabigo_tn",
              "https://facebook.com/cabigo_tn",
            ],
          }),
        }}
      />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGlow}></div>
        </div>
        <div className={`container ${styles.heroContent}`}>
          <span className="badge">Best Drop Taxi in Tamil Nadu</span>
          <h1 className={styles.heroTitle}>
            Book <span className="text-gradient">One Way Drop Taxi</span>
            <br />
            Anywhere in Tamil Nadu
          </h1>
          <p className={styles.heroSubtitle}>
            Why pay for return? Pay only for one way. Reach Chennai, Coimbatore,
            Madurai, Trichy comfortably. Safe drivers, clean cars.
          </p>
          <div className={styles.heroActions}>
            <Link href="/routes" className="btn btn-primary">
              Calculate Fare
            </Link>
            <a href="tel:+911800XXXXXX" className="btn btn-secondary">
              Call to Book: 1800-XXX-XXXX
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>100+</span>
              <span className={styles.statLabel}>Towns Covered</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>Top 3</span>
              <span className={styles.statLabel}>Rated in TN</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>40%</span>
              <span className={styles.statLabel}>Savings on One Way</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>24/7</span>
              <span className={styles.statLabel}>Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Locations Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Taxi Service in Major Districts</h2>
            <p>
              Reliable local and outstation cabs in Tamil Nadu&apos;s key cities.
            </p>
          </div>
          <div className={`grid grid-7-special ${styles.locationsGrid}`}>
            {districts.slice(0, 14).map((district) => (
              <Link
                key={district.id}
                href={`/taxi-in-${district.slug}`}
                className={styles.locationCard}
              >
                <div className={styles.locationImage}>
                  <div className={styles.locationOverlay}></div>
                  <span className={styles.locationBadge}>
                    {district.slug === 'pondicherry' ? 'Puducherry' : 'Tamil Nadu'}
                  </span>
                </div>
                <div className={styles.locationContent}>
                  <h3 className={styles.locationName}>Taxi in {district.name}</h3>
                  <p className={styles.locationMeta}>
                    {district.touristPlaces.slice(0, 2).map(p => p.name).join(" • ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className={styles.sectionAction}>
            <Link href="/locations" className="btn btn-secondary">
              View All Districts
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className={`section ${styles.routesSection}`}>
        <div className="container">
          <div className="section-header">
            <h2>Popular Drop Routes</h2>
            <p>
              Frequent trips from Chennai & Coimbatore. Lowest price guaranteed.
            </p>
          </div>
          <div className={`grid grid-6-special ${styles.routesGrid}`}>
            {routes.slice(0, 12).map((route) => (
              <Link
                key={route.id}
                href={`/taxi-${route.slug}`}
                className={styles.routeCard}
              >
                <div className={styles.routeHeader}>
                  <div className={styles.routePoints}>
                    <span className={styles.routeOrigin}>
                      {route.originId.charAt(0).toUpperCase() +
                        route.originId.slice(1)}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={styles.routeArrow}
                    >
                      <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className={styles.routeDestination}>
                      {/* Name handling for excursions if needed, basic check */}
                      {route.destinationId.charAt(0).toUpperCase() +
                        route.destinationId.slice(1)}
                    </span>
                  </div>
                </div>
                <div className={styles.routeDetails}>
                  <div className={styles.routeInfo}>
                    <span>{route.distance.km} km</span>
                  </div>
                  <div className={styles.routePrice}>
                    ₹{route.pricing.sedan.toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className={styles.sectionAction}>
            <Link href="/routes" className="btn btn-secondary">
              View All Routes
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Why Cabigo Tamil Nadu?</h2>
            <p>We are the experts in local travel.</p>
          </div>
          <div className={`grid grid-3 ${styles.featuresGrid}`}>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Hill Station Experts</h3>
              <p>
                Our drivers are masters of Ghat roads. Ooty, Kodaikanal, Yercaud -
                travel safely on steep bends.
              </p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 6V12L16 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>On-Time Pickup</h3>
              <p>
                We value your time. Guaranteed pickup for early morning flights at
                Chennai & Trichy airports.
              </p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 1V23"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Fixed Pricing</h3>
              <p>
                Inclusive of tolls and state tax. What we quote is what you pay.
                No hidden driver batha.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2>Ready to Travel?</h2>
            <p>
              Book your Chennai, Madurai, or Coimbatore taxi now. Tamil speaking
              drivers available.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/book" className="btn btn-primary">
                Book Online
              </Link>
              <a href="tel:+911800XXXXXX" className="btn btn-secondary">
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
