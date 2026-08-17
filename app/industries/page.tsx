import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import { INDUSTRIES } from "@/lib/content";

/** The home document, opened at Industries. See app/about/page.tsx. */
export const metadata: Metadata = {
  title: "Industries | Gratia AI Solutions",
  description:
    "AI systems for " +
    INDUSTRIES.slice(0, -1)
      .map((industry) => industry.name.toLowerCase())
      .join(", ") +
    ", and any company with work worth automating.",
};

export default function IndustriesRoute() {
  return <HomePage section="industries" />;
}
