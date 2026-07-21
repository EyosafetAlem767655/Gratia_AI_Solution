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
          <h2 className="text-3xl font-bold text-[#F3EAFF] sm:text-5xl">
            Contact Us
          </h2>
          <p className="mt-4 text-[#B9A8D0]">
            Ready to grow your business with AI? Reach out and let&apos;s plant
            the seeds of innovation together.
          </p>
          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-[#7C3AED]/30 bg-[#12091F]/60 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-wider text-[#2DD4BF]">
                Email
              </p>
              <a
                href="mailto:eyosafetalem@gmail.com"
                className="text-lg text-[#C084FC] hover:underline"
              >
                eyosafetalem@gmail.com
              </a>
            </div>
            <div className="rounded-xl border border-[#7C3AED]/30 bg-[#12091F]/60 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-wider text-[#2DD4BF]">
                Phone
              </p>
              <a
                href="tel:+251938767655"
                className="text-lg text-[#C084FC] hover:underline"
              >
                +251 938 767 655
              </a>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="rounded-2xl border border-[#6D28D9]/40 bg-[#1A0B2E]/50 p-8 backdrop-blur-md">
          <ContactForm />
        </Reveal>
      </div>
      <footer className="mx-auto mt-24 max-w-6xl border-t border-[#7C3AED]/20 pt-8 text-center text-sm text-[#B9A8D0]">
        <p>&copy; {new Date().getFullYear()} Gratia AI Solutions. All rights reserved.</p>
      </footer>
    </section>
  );
}
