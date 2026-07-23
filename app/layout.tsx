import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Gratia AI Solutions | Enterprise AI, Engineered",
  description:
    "Gratia AI Solutions builds production AI for industrial, financial, manufacturing, real estate, and e-commerce companies.",
  openGraph: {
    title: "Gratia AI Solutions",
    description:
      "Enterprise AI, engineered — production systems for every industry.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} h-full`}>
      <body className="min-h-full bg-[#0F172A] font-sans text-[#F8FAFC] antialiased">
        {children}
      </body>
    </html>
  );
}
