import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Space Grotesk carries the headlines — geometric, slightly mechanical, and it
// echoes the engineered curves of the emblem far better than a neutral grotesk.
const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Every label, tag, index and readout on the site is monospaced — it makes the
// interface read like instrumentation rather than a brochure.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Gratia AI Solutions | Intelligence, Engineered",
  description:
    "Gratia AI Solutions builds production AI for industrial, financial, manufacturing, real estate, and e-commerce companies.",
  openGraph: {
    title: "Gratia AI Solutions",
    description:
      "Intelligence, engineered — production AI systems for the industries that run the world.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#04060A",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${inter.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full bg-void text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
