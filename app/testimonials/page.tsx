import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";

/**
 * The home document, opened at Testimonials.
 *
 * This is the link the Telegram bot sends when a project goes live, so it has
 * to be a real URL: it used to point at `/#projects`, which was a hash *and*
 * named a section id that did not exist, so it landed people at the top of the
 * page with no indication anything had happened.
 */
export const metadata: Metadata = {
  title: "Testimonials | Gratia AI Solutions",
  description: "What clients say about the AI systems we built for them.",
};

export default function TestimonialsRoute() {
  return <HomePage section="testimonials" />;
}
