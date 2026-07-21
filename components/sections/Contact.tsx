import { ContactForm } from "@/components/ui/ContactForm";
import { Reveal } from "@/components/ui/Reveal";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative min-h-screen px-6 py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-3xl font-bold text-[#F4EDE4] sm:text-5xl">
            Contact Us
          </h2>
          <p className="mt-4 text-[#A8C5A0]">
            Ready to grow your business with AI? Reach out and let&apos;s plant
            the seeds of innovation together.
          </p>
          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-[#4A7C59]/30 bg-[#1B3A1A]/60 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-wider text-[#A8C5A0]">
                Email
              </p>
              <a
                href="mailto:eyosafetalem@gmail.com"
                className="text-lg text-[#C9A961] hover:underline"
              >
                eyosafetalem@gmail.com
              </a>
            </div>
            <div className="rounded-xl border border-[#4A7C59]/30 bg-[#1B3A1A]/60 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-wider text-[#A8C5A0]">
                Phone
              </p>
              <a
                href="tel:+251938767655"
                className="text-lg text-[#C9A961] hover:underline"
              >
                +251 938 767 655
              </a>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="rounded-2xl border border-[#8B5E3C]/40 bg-[#2D4A2A]/50 p-8 backdrop-blur-md">
          <ContactForm />
        </Reveal>
      </div>
      <footer className="mx-auto mt-24 max-w-6xl border-t border-[#4A7C59]/20 pt-8 text-center text-sm text-[#A8C5A0]">
        <p>&copy; {new Date().getFullYear()} Gratia AI Solutions. All rights reserved.</p>
      </footer>
    </section>
  );
}
