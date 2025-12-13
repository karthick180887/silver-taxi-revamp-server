import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import NoSSR from "@/components/NoSSR";

// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
// });

export const metadata: Metadata = {
  title: "Silver Taxi - Admin Dashboard",
  description: "Admin dashboard for Silver Taxi management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NoSSR>
          {children}
        </NoSSR>
      </body>
    </html>
  );
}
