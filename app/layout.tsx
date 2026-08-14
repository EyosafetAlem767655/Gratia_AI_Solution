import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// One family for the entire site. Loaded through next/font rather than a
// <link> to Google: next/font self-hosts the files and inlines the @font-face,
// removing a blocking third-party request and the layout shift with it.
//
// The variable is `--font-geist`, NOT `--font-sans`. Tailwind's theme owns the
// name `--font-sans` and preflight drives `html { font-family: ... }` from it;
// pointing that name at itself (`--font-sans: var(--font-sans)`) is circular,
// so the declaration is dropped and every element falls back to whatever it
// happens to inherit. That was the cause of the "every text has its own font"
// report. Keep these two names distinct.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
      className={`${geist.variable} h-full`}
    >
      <body className="min-h-full bg-ink text-white antialiased">
        {children}
      </body>
    </html>
  );
}
