import type { Metadata, Viewport } from "next";
import { Geist, Silkscreen } from "next/font/google";
import "./globals.css";

// Geist carries everything. Loaded through next/font rather than a <link> to
// Google: next/font self-hosts the files and inlines the @font-face, which
// removes a blocking third-party request and the layout shift that comes with
// it. That shift was part of why the page felt slow to settle.
const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Scoped to exactly one element — the stat number. A pixel face used anywhere
// else would fight the photography.
const silkscreen = Silkscreen({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "700"],
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
  themeColor: "#010101",
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
      className={`${geist.variable} ${silkscreen.variable} h-full`}
    >
      <body className="min-h-full bg-ink text-white antialiased">
        {children}
      </body>
    </html>
  );
}
