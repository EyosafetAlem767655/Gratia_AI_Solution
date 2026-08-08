import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

// Bricolage Grotesque for headlines. It has genuinely irregular joints and
// terminals — grown rather than ruled — which is exactly the tension the brand
// is about. A neutral grotesk here would flatten the whole idea.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Manrope carries body copy: geometric enough to sit beside the machinery,
// round enough to stay warm at small sizes.
const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Every label, index and readout is monospaced, like a field notebook.
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Gratia AI Solutions | Make Intelligence Come Alive",
  description:
    "Gratia AI Solutions creates production AI, automation, predictive systems, computer vision, and intelligent experiences for organisations in any industry.",
  openGraph: {
    title: "Gratia AI Solutions",
    description:
      "Living intelligence for real organisations — designed, deployed, and evolved with your business.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#030A07",
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
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full bg-deep text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
