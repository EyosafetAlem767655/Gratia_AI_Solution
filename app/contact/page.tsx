import type { Metadata } from "next";
import { ContactPage } from "@/components/ContactPage";

/**
 * A real route, not an anchor.
 *
 * Contact used to be a `#contact` section on the home page. As a genuine route
 * the URL is `/contact` — shareable, bookmarkable, survives a refresh, and the
 * back button behaves. It also means the 18MB hero video is never loaded here:
 * the film belongs to the landing page only.
 */
export const metadata: Metadata = {
  title: "Contact | Gratia AI Solutions",
  description:
    "Tell us what you need. We build AI systems for manufacturing, real estate, e-commerce, hotels and tourism, and any company with a problem worth solving.",
};

export default function Page() {
  return <ContactPage />;
}
