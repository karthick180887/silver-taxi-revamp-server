
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chennai Airport Taxi Booking | Bangalore Airport Pickup Cabs",
    description: "Reliable airport taxi services for Chennai Airport (MAA) and Bangalore Airport (BLR). Pre-book airport pickup and drop at low fares. On-time guarantee.",
    keywords: ["airport taxi chennai", "bangalore airport cab", "airport drop taxi", "airport pickup service", "maa airport taxi"],
};

export default function AirportTaxiPage() {
    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
            <nav className="breadcrumbs" style={{ marginBottom: '2rem' }}>
                <Link href="/">Home</Link> / <span>Airport Taxi</span>
            </nav>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem' }}>
                Premium <span className="text-gradient">Airport Transfers</span>
            </h1>
            <p style={{ maxWidth: '700px', fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
                Start your journey with stress-free airport pickups and drops. We track flights, wait for delays, and ensure you never miss a connection.
            </p>

            <div className="grid grid-2" style={{ gap: '2rem', marginBottom: '4rem' }}>
                <div className="card">
                    <h2 style={{ color: 'var(--color-accent)' }}>✈️ Chennai Airport (MAA)</h2>
                    <ul style={{ margin: '1.5rem 0', listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Pickup from Arrival Gate</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Zero Waiting Charges (45 mins)</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Drop to any District</li>
                    </ul>
                    <Link href="/taxi-in-chennai" className="btn btn-primary">Book MAA Taxi</Link>
                </div>
                <div className="card">
                    <h2 style={{ color: 'var(--color-accent)' }}>✈️ Bangalore Airport (BLR)</h2>
                    <ul style={{ margin: '1.5rem 0', listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '0.5rem' }}>✓ KIAL Airport Pickup</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Inter-State Permit Included</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Drop to Hosur, Salem, Chennai</li>
                    </ul>
                    <Link href="/taxi-in-bangalore" className="btn btn-primary">Book BLR Taxi</Link>
                </div>
            </div>

            <section className="card card-glass" style={{ padding: '3rem', textAlign: 'center' }}>
                <h2>Flat Rates. No Surprises.</h2>
                <p style={{ margin: '1rem 0 2rem' }}>Get a fixed price quote before you book. Tolls and parking extra as applicable.</p>
                <div className="grid grid-3">
                    <div>
                        <h3>Sedan</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>₹13/km</p>
                    </div>
                    <div>
                        <h3>SUV</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>₹18/km</p>
                    </div>
                    <div>
                        <h3>Innova</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>₹22/km</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
