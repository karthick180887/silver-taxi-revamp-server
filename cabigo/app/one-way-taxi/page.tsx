
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "One Way Drop Taxi Tamil Nadu | Pay for Logic Drop Only",
    description: "Save up to 40% with Cabigo One Way Taxi. Pay only for the distance traveled. Available across Chennai, Madurai, Coimbatore, Trichy to anywhere.",
    keywords: ["one way taxi", "drop taxi", "intercity cab", "one way cab booking", "chennai one way taxi"],
};

export default function OneWayTaxiPage() {
    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
            <nav className="breadcrumbs" style={{ marginBottom: '2rem' }}>
                <Link href="/">Home</Link> / <span>One Way Taxi</span>
            </nav>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem' }}>
                Why Pay for <span className="text-gradient">Return?</span>
            </h1>
            <p style={{ maxWidth: '700px', fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
                With Cabigo One Way Drop, you pay only for the km you travel. No hidden return charges. Ideal for outstation drops.
            </p>

            <div className="grid grid-3" style={{ gap: '2rem', marginBottom: '4rem' }}>
                <div className="card" style={{ borderColor: 'var(--color-accent)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📉</div>
                    <h3>Save 40%</h3>
                    <p>Compared to round-trip fares, our one-way logic saves you significantly on long distance drops.</p>
                </div>
                <div className="card" style={{ borderColor: 'var(--color-pepper)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                    <h3>Anywhere Drop</h3>
                    <p>We cover 15,000+ routes across Tamil Nadu, Bangalore, and Pondicherry.</p>
                </div>
                <div className="card" style={{ borderColor: 'var(--color-primary-light)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                    <h3>Safe & Secure</h3>
                    <p>Verified drivers, GPS tracking, and 24/7 support for your peace of mind.</p>
                </div>
            </div>

            <div style={{ marginTop: '4rem' }}>
                <h2 style={{ marginBottom: '2rem' }}>Popular One Way Routes</h2>
                <div className="grid grid-4">
                    {['Chennai to Pondy', 'Coimbatore to Ooty', 'Madurai to Rameswaram', 'Bangalore to Salem', 'Trichy to Thanjavur', 'Chennai to Vellore'].map(route => (
                        <Link key={route} href="/routes" className="card" style={{ textAlign: 'center', textDecoration: 'none' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{route}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
