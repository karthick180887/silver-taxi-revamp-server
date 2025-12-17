import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cabigo.in"),
  title: {
    default: "Cabigo - Best Drop Taxi Service in Tamil Nadu & Chennai",
    template: "%s | Cabigo Tamil Nadu",
  },
  description:
    "No.1 Drop Taxi service in Tamil Nadu. Book one-way cabs from Chennai, Coimbatore, Madurai, Trichy, and Salem. Lowest price guarantee for outstation & airport transfers.",
  keywords: [
    "drop taxi tamilnadu",
    "one way cab chennai",
    "call taxi tamilnadu",
    "chennai airport taxi",
    "coimbatore to ooty taxi",
    "outstation cab booking",
    "trichy drop taxi",
    "madurai travels",
  ],
  authors: [{ name: "Cabigo Tamil Nadu" }],
  creator: "Cabigo",
  publisher: "Cabigo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://cabigo.in",
    siteName: "Cabigo - Tamil Nadu's Favorite Taxi",
    title: "Cabigo - Best Drop Taxi Service in Tamil Nadu",
    description:
      "Book one-way drop taxis across Tamil Nadu. Chennai, Coimbatore, Madurai, Trichy. Save up to 40% on return fare.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cabigo Tamil Nadu Taxi Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cabigo - Lowest Price Drop Taxi TN",
    description: "Book one-way cabs in Tamil Nadu. Pay only for one way.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://cabigo.in" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} ${outfit.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
