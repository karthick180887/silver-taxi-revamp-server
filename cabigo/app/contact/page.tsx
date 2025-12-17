import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Contact Cabigo - Get in Touch",
    description:
        "Contact Cabigo for taxi booking inquiries, customer support, or partnership opportunities. 24/7 helpline available for all your travel needs.",
    alternates: {
        canonical: "https://cabigo.in/contact",
    },
};

export default function ContactPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        mainEntity: {
            "@type": "Organization",
            name: "Cabigo",
            telephone: "+91-1800-XXX-XXXX",
            email: "support@cabigo.in",
            address: {
                "@type": "PostalAddress",
                streetAddress: "123 Tech Park",
                addressLocality: "Bangalore",
                addressRegion: "Karnataka",
                postalCode: "560001",
                addressCountry: "IN",
            },
            contactPoint: [
                {
                    "@type": "ContactPoint",
                    telephone: "+91-1800-XXX-XXXX",
                    contactType: "customer service",
                    availableLanguage: ["English", "Hindi"],
                    hoursAvailable: {
                        "@type": "OpeningHoursSpecification",
                        dayOfWeek: [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                        ],
                        opens: "00:00",
                        closes: "23:59",
                    },
                },
                {
                    "@type": "ContactPoint",
                    email: "partners@cabigo.in",
                    contactType: "sales",
                },
            ],
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
                        <span aria-current="page">Contact</span>
                    </nav>
                    <h1 className={styles.heroTitle}>
                        Get in <span className="text-gradient">Touch</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Have questions? We&apos;re here to help. Reach out through any of
                        the channels below.
                    </p>
                </div>
            </section>

            {/* Contact Grid */}
            <section className="section">
                <div className="container">
                    <div className={styles.contactGrid}>
                        {/* Contact Info */}
                        <div className={styles.contactInfo}>
                            <h2>Contact Information</h2>

                            <div className={styles.infoCard}>
                                <span className={styles.infoIcon}>📞</span>
                                <div>
                                    <h3>24/7 Helpline</h3>
                                    <a href="tel:+911800XXXXXX" className={styles.infoLink}>
                                        1800-XXX-XXXX
                                    </a>
                                    <p>Toll-free, available round the clock</p>
                                </div>
                            </div>

                            <div className={styles.infoCard}>
                                <span className={styles.infoIcon}>✉️</span>
                                <div>
                                    <h3>Email Support</h3>
                                    <a href="mailto:support@cabigo.in" className={styles.infoLink}>
                                        support@cabigo.in
                                    </a>
                                    <p>Response within 24 hours</p>
                                </div>
                            </div>

                            <div className={styles.infoCard}>
                                <span className={styles.infoIcon}>💬</span>
                                <div>
                                    <h3>WhatsApp</h3>
                                    <a
                                        href="https://wa.me/919876543210"
                                        className={styles.infoLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        +91 98765 43210
                                    </a>
                                    <p>Quick chat support</p>
                                </div>
                            </div>

                            <div className={styles.infoCard}>
                                <span className={styles.infoIcon}>📍</span>
                                <div>
                                    <h3>Office Address</h3>
                                    <address className={styles.address}>
                                        Cabigo Technologies Pvt. Ltd.
                                        <br />
                                        123 Tech Park, 4th Floor
                                        <br />
                                        Koramangala, Bangalore 560001
                                        <br />
                                        Karnataka, India
                                    </address>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className={styles.formCard}>
                            <h2>Send us a Message</h2>
                            <form className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="phone">Phone</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="subject">Subject</label>
                                    <select id="subject" name="subject" required>
                                        <option value="">Select a topic</option>
                                        <option value="booking">Booking Inquiry</option>
                                        <option value="support">Customer Support</option>
                                        <option value="feedback">Feedback</option>
                                        <option value="partnership">Partnership</option>
                                        <option value="careers">Careers</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        placeholder="Tell us how we can help..."
                                        required
                                    ></textarea>
                                </div>

                                <button type="submit" className="btn btn-primary">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className={`section ${styles.faqSection}`}>
                <div className="container">
                    <div className="section-header">
                        <h2>Quick Answers</h2>
                        <p>Common questions before you reach out</p>
                    </div>
                    <div className={styles.faqGrid}>
                        <div className={styles.faqItem}>
                            <h3>How can I modify or cancel my booking?</h3>
                            <p>
                                You can modify or cancel your booking through the confirmation
                                email link, by calling our helpline, or through WhatsApp. Free
                                cancellation is available up to 4 hours before pickup.
                            </p>
                        </div>
                        <div className={styles.faqItem}>
                            <h3>I left something in the cab. What do I do?</h3>
                            <p>
                                Contact our helpline immediately with your booking ID. We&apos;ll
                                connect you with the driver. Most items are recovered within 24
                                hours.
                            </p>
                        </div>
                        <div className={styles.faqItem}>
                            <h3>How do I become a driver-partner?</h3>
                            <p>
                                Email us at partners@cabigo.in with your details. We require valid
                                driving license, vehicle documents, and background verification.
                            </p>
                        </div>
                        <div className={styles.faqItem}>
                            <h3>Do you offer corporate accounts?</h3>
                            <p>
                                Yes! We offer corporate billing, dedicated account managers, and
                                volume discounts. Contact us at corporate@cabigo.in.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
