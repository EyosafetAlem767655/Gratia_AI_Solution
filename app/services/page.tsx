import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import { SERVICES } from "@/lib/content";

/** The home document, opened at "What we build". See app/about/page.tsx. */
export const metadata: Metadata = {
  title: "What we build | Gratia AI Solutions",
  description: SERVICES.map((service) => service.name).join(", ") + ".",
};

export default function ServicesRoute() {
  return <HomePage section="services" />;
}
