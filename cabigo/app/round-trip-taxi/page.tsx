
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Round Trip Taxi Tamil Nadu | Outstation Cabs @ ₹11/km",
    description: "Book Round Trip cabs for outstation travel from Chennai, Bangalore, Coimbatore. Lowest km rates. Keep the driver with you for the entire trip.",
    keywords: ["round trip taxi", "outstation cab", "tour taxi tamilnadu", "day packages", "chennai round trip travels"],
};

export default function RoundTripTaxiPage() {
    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
            <nav className="breadcrumbs" style={{ marginBottom: '2rem' }}>
                <Link href="/">Home</Link> / <span>Round Trip Taxi</span>
            </nav>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem' }}>
                Premium <span className="text-gradient">Round Trip</span> Packages
            </h1>
            <p style={{ maxWidth: '700px', fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
                Planning a vacation or a business return trip? Keep the car and driver with you. Best rates for multi-day trips.
            </p>

            <div className="grid grid-3" style={{ gap: '2rem', marginBottom: '4rem' }}>
                <div className="card" style={{ borderColor: 'var(--color-accent)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
                    <h3>Same Driver</h3>
                    <p>Peace of mind. The same trusted driver and car stays with you for the entire duration.</p>
                </div>
                <div className="card" style={{ borderColor: 'var(--color-pepper)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                    <h3>Best Value</h3>
                    <p>Round trips start at just ₹11/km for Hatchbacks. Cheaper than booking two one-ways.</p>
                </div>
                <div className="card" style={{ borderColor: 'var(--color-primary-light)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏱️</div>
                    <h3>Flexible</h3>
                    <p>Stop where you want, when you want. You are in control of the schedule.</p>
                </div>
            </div>

            <section className="card" style={{ padding: '3rem', background: 'var(--color-bg-elevated)' }}>
                <h2 className="text-center" style={{ marginBottom: '2rem' }}>Popular Round Trip Destinations</h2>
                <div className="grid grid-4" style={{ textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '2rem' }}>⛰️</div>
                        <h3>Ooty</h3>
                        <p>3 Days Package</p>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem' }}>🕍</div>
                        <h3>Navagraha</h3>
                        <p>4 Days Temple Tour</p>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem' }}>🌊</div>
                        <h3>Rameswaram</h3>
                        <p>2 Days Trip</p>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem' }}>🧘</div>
                        <h3>Munnar</h3>
                        <p>3 Days Hill Trip</p>
                    </div>
                </div>
                <div className="text-center" style={{ marginTop: '2rem' }}>
                    <Link href="/book" className="btn btn-primary">Get Custom Quote</Link>
                </div>
            </section>
        </div>
    );
}
