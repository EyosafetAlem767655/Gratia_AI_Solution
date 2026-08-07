import { ContactForm } from "@/components/ui/ContactForm";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Spotlight } from "@/components/ui/Spotlight";

const CHANNELS = [
  {
    href: "mailto:eyosafetalem@gmail.com",
    label: "Email",
    value: "eyosafetalem@gmail.com",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  },
  {
    href: "tel:+251938767655",
    label: "Phone",
    value: "+251 938 767 655",
    icon: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
    ),
  },
];

export function Contact() {
  return (
    <section
      id="contact"
      className="relative px-[var(--gutter)] py-[var(--section-y)]"
    >
      <div className="scrim scrim-dense" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[80rem]">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Reveal y={16}>
              <span className="tag">04 — Contact</span>
            </Reveal>

            <RevealText
              as="h2"
              text="Let's scope your AI project."
              className="grow-type mt-5 block text-[clamp(2rem,4.6vw,3.8rem)] font-semibold"
            />

            <Reveal delay={0.2}>
              <p className="mt-6 max-w-md leading-relaxed text-sage">
                Tell us about your data, your constraints, and what
                &ldquo;working&rdquo; would actually look like. We&apos;ll come
                back with a concrete plan — scope, sequence, and the parts we
                think are risky.
              </p>
            </Reveal>

            <div className="mt-10 space-y-3">
              {CHANNELS.map((channel, i) => (
                <Reveal key={channel.label} delay={0.28 + i * 0.08} y={20}>
                  <Spotlight
                    as="a"
                    href={channel.href}
                    data-cursor="link"
                    className="panel group flex items-center gap-4 rounded-[var(--leaf)] p-4 transition-colors duration-500 hover:border-[#2a5138]"
                  >
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded border border-[#1c3626] bg-[#06120c] text-lichen">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden
                      >
                        {channel.icon}
                      </svg>
                    </span>
                    <span className="relative min-w-0">
                      <span className="tag block text-[0.62rem]">
                        {channel.label}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-sm text-bone">
                        {channel.value}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="relative ml-auto text-sage transition-transform duration-500 group-hover:translate-x-1 group-hover:text-lichen"
                    >
                      →
                    </span>
                  </Spotlight>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={0.15} y={34} className="lg:col-span-6 lg:col-start-7">
            <div className="panel rounded-[var(--leaf)] p-6 sm:p-9">
              <div className="mb-7 flex items-center justify-between">
                <span className="tag">Project brief</span>
                <span className="flex items-center gap-2 font-mono text-[0.65rem] text-[#6b8574]">
                  <span className="h-1.5 w-1.5 rounded-full bg-lichen" />
                  Accepting work
                </span>
              </div>
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
