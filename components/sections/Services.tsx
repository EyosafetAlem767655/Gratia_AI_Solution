import { INDUSTRY_INFO, type Industry, type PrimaryShape } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

const industries = Object.keys(INDUSTRY_INFO) as Industry[];

const ICON_PATHS: Record<PrimaryShape, string> = {
  gear: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  chart: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  factory:
    "M4 21V8l5 3.5V8l5 3.5V8l5 3.5V21H4z M8 21v-4 M12 21v-4 M16 21v-4",
  building:
    "M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17 M3 21h18 M9.5 7h.01 M14 7h.01 M9.5 11h.01 M14 11h.01 M9.5 15h.01 M14 15h.01",
  cart: "M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M2 3h2l2.4 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H5",
  cube: "M12 2 3 7v10l9 5 9-5V7z M3 7l9 5 9-5 M12 12v10",
};

function Icon({ shape }: { shape: PrimaryShape }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d={ICON_PATHS[shape]} />
    </svg>
  );
}

export function Services() {
  return (
    <section id="services" className="relative px-6 py-28">
      <div className="section-scrim pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">
            What we build
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-bold text-[#F8FAFC] sm:text-5xl">
            Solutions engineered for your industry
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#94A3B8]">
            Every sector has its own data, constraints, and stakes. We tailor the
            models, tooling, and deployment to yours.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((key) => {
            const info = INDUSTRY_INFO[key];
            return (
              <article
                key={key}
                className="group rounded-2xl border border-[#334155]/70 bg-[#182234]/60 p-6 backdrop-blur-md transition hover:border-[#F59E0B]/60 hover:bg-[#1E293B]/80"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F59E0B]/12 text-[#F59E0B] ring-1 ring-[#F59E0B]/25 transition group-hover:bg-[#F59E0B]/20">
                  <Icon shape={info.shape} />
                </div>
                <h3 className="text-lg font-semibold text-[#F8FAFC]">
                  {info.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                  {info.description}
                </p>
              </article>
            );
          })}

          <article className="rounded-2xl border border-dashed border-[#8B5CF6]/40 bg-[#182234]/40 p-6 backdrop-blur-md">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#A78BFA] ring-1 ring-[#8B5CF6]/30">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden
              >
                <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z M19 15l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#F8FAFC]">
              Custom solutions
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
              Outside these five? We design bespoke AI architectures for unique
              business challenges across any sector.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
