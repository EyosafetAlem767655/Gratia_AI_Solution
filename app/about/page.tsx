import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import { ABOUT } from "@/lib/content";

/**
 * `/about` is the home document, opened at the About section.
 *
 * The section is not a separate page because it is not separate content — it
 * lives in the scroll of the landing page. What this route buys is a URL: the
 * address bar reads `/about` instead of `/#about`, and the link can be shared,
 * refreshed and crawled. Clicking through from elsewhere on the site never
 * loads this route; <SectionLink> scrolls instead.
 */
export const metadata: Metadata = {
  title: `${ABOUT.eyebrow} | Gratia AI Solutions`,
  description: ABOUT.body[0],
};

export default function AboutRoute() {
  return <HomePage section="about" />;
}
