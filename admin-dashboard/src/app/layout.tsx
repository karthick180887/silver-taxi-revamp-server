import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin Dashboard | Silver Taxi",
  description: "Administrative panel for Silver Taxi management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100`}
      >
        {children}
      </body>
    </html>
  );
}
