import { ContactForm } from "@/components/ui/ContactForm";
import { Reveal } from "@/components/ui/Reveal";

export function Contact() {
  return (
    <section id="contact" className="relative px-6 py-28">
      <div className="section-scrim pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">
              Contact
            </p>
            <h2 className="mt-4 text-3xl font-bold text-[#F8FAFC] sm:text-5xl">
              Let&apos;s scope your AI project
            </h2>
            <p className="mt-4 max-w-md text-[#94A3B8]">
              Tell us about your data and goals. We&apos;ll come back with a
              concrete plan — no obligation.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href="mailto:eyosafetalem@gmail.com"
                className="flex items-center gap-4 rounded-xl border border-[#334155]/70 bg-[#182234]/60 p-4 backdrop-blur-md transition hover:border-[#F59E0B]/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F59E0B]/12 text-[#F59E0B]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5" aria-hidden>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-[#64748B]">
                    Email
                  </span>
                  <span className="text-[#F8FAFC]">eyosafetalem@gmail.com</span>
                </span>
              </a>

              <a
                href="tel:+251938767655"
                className="flex items-center gap-4 rounded-xl border border-[#334155]/70 bg-[#182234]/60 p-4 backdrop-blur-md transition hover:border-[#F59E0B]/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#A78BFA]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5" aria-hidden>
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-[#64748B]">
                    Phone
                  </span>
                  <span className="text-[#F8FAFC]">+251 938 767 655</span>
                </span>
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="rounded-2xl border border-[#334155]/70 bg-[#182234]/60 p-6 backdrop-blur-md sm:p-8">
            <ContactForm />
          </Reveal>
        </div>

        <footer className="mt-24 border-t border-[#334155]/60 pt-8 text-center text-sm text-[#64748B]">
          <p>
            &copy; {new Date().getFullYear()} Gratia AI Solutions. All rights
            reserved.
          </p>
        </footer>
      </div>
    </section>
  );
}
