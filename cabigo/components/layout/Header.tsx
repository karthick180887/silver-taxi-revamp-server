"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.logo} aria-label="Cabigo Home">
                    <Image
                        src="/logo.png"
                        alt="Cabigo Logo"
                        width={80}
                        height={80}
                        priority
                        style={{ width: 'auto', height: '80px' }}
                    />
                    <span className={styles.logoText}>Cabigo</span>
                </Link>

                <nav className={styles.nav} aria-label="Main navigation">
                    {/* Desktop Menu */}
                    <ul className={styles.navList}>
                        <li>
                            <Link href="/one-way-taxi" className={styles.navLink}>
                                One Way
                            </Link>
                        </li>
                        <li>
                            <Link href="/round-trip-taxi" className={styles.navLink}>
                                Round Trip
                            </Link>
                        </li>
                        <li>
                            <Link href="/airport-taxi" className={styles.navLink}>
                                Airport
                            </Link>
                        </li>
                        <li>
                            <Link href="/routes" className={styles.navLink}>
                                Routes
                            </Link>
                        </li>
                        <li>
                            <Link href="/locations" className={styles.navLink}>
                                Locations
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact" className={styles.navLink}>
                                Contact
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className={styles.actions}>
                    <Link href="/book" className="btn btn-primary">
                        Book Now
                    </Link>
                </div>

                <button
                    className={`${styles.mobileToggle} ${isMobileMenuOpen ? styles.open : ""}`}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-menu"
                    aria-label="Toggle navigation menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Mobile Menu */}
            <div
                id="mobile-menu"
                className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ""}`}
                aria-hidden={!isMobileMenuOpen}
            >
                <nav aria-label="Mobile navigation">
                    <ul className={styles.mobileNavList}>
                        <li>
                            <Link
                                href="/one-way-taxi"
                                className={styles.mobileNavLink}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                One Way Taxi
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/round-trip-taxi"
                                className={styles.mobileNavLink}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Round Trip Taxi
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/airport-taxi"
                                className={styles.mobileNavLink}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Airport Taxi
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/routes"
                                className={styles.mobileNavLink}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Routes
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/locations"
                                className={styles.mobileNavLink}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Locations
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/contact"
                                className={styles.mobileNavLink}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Contact
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/book"
                                className="btn btn-primary"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Book Now
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
