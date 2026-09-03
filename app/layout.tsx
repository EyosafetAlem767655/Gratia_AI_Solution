import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { HERO } from "@/lib/content";
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


// Kept in step with lib/content.ts on purpose. This copy is the title in search
// results and link previews, and it was the last place still saying "Make
// Intelligence Come Alive" after the site was rewritten in plain language.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: `Gratia AI Solutions | ${HERO.headline}`,
  description: HERO.subline,
  openGraph: {
    title: "Gratia AI Solutions",
    description: HERO.subline,
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

        {/* Vercel Web Analytics: page views and visitors, no cookies and no
            cross-site identifier. The /next entry is the App Router build —
            it renders nothing itself and injects the script, and it is inert
            outside a Vercel deployment, so local runs report nothing. */}
        <Analytics />
      </body>
    </html>
  );
}
