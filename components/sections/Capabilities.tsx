import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Spotlight } from "@/components/ui/Spotlight";
import { SOLUTIONS, type PrimaryShape } from "@/lib/types";

const ICON_PATHS: Record<PrimaryShape, string> = {
  gear: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  chart: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  factory: "M4 21V8l5 3.5V8l5 3.5V8l5 3.5V21H4z M8 21v-4 M12 21v-4 M16 21v-4",
  building:
    "M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17 M3 21h18 M9.5 7h.01 M14 7h.01 M9.5 11h.01 M14 11h.01 M9.5 15h.01 M14 15h.01",
  cart: "M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M2 3h2l2.4 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H5",
  cube: "M12 2 3 7v10l9 5 9-5V7z M3 7l9 5 9-5 M12 12v10",
};

const SPARK =
  "M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z M19 15l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z";

function Icon({ d }: { d: string }) {
  return (
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
      <path d={d} />
    </svg>
  );
}

/**
 * Asymmetric bento: the first and last cells run double-width on large
 * screens, which breaks the "six identical boxes" rhythm that makes most
 * capability grids forgettable.
 */
const SPANS = [
  "lg:col-span-2",
  "lg:col-span-1",
  "lg:col-span-1",
  "lg:col-span-1",
  "lg:col-span-1",
  "lg:col-span-2",
] as const;

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="relative px-[var(--gutter)] py-[var(--section-y)]"
    >
      <div className="scrim scrim-dense" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[80rem]">
        <header className="grid grid-cols-12 items-end gap-y-6">
          <div className="col-span-12 lg:col-span-7">
            <Reveal y={16}>
              <span className="tag">01 — Living systems</span>
            </Reveal>
            <RevealText
              as="h2"
              text="Intelligence shaped around the work."
              className="grow-type mt-5 block max-w-3xl text-[clamp(2rem,4.6vw,3.8rem)] font-semibold"
            />
          </div>
          <Reveal delay={0.2} className="col-span-12 lg:col-span-5">
            <p className="max-w-md text-sage lg:ml-auto">
              We connect models, people and operational data into one useful
              system—designed for the reality of your organisation.
            </p>
          </Reveal>
        </header>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((info, i) => {
            return (
              <Reveal
                key={info.code}
                delay={i * 0.06}
                y={30}
                className={SPANS[i] ?? "lg:col-span-1"}
              >
                <Spotlight
                  as="article"
                  className="panel group h-full rounded-[var(--leaf)] p-7 transition-colors duration-500 hover:border-[#2a5138]"
                >
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded border border-[#1c3626] bg-[#06120c] text-lichen transition-colors duration-500 group-hover:border-lichen/50">
                        <Icon d={ICON_PATHS[info.shape]} />
                      </span>
                      <span className="tag text-[0.65rem]">{info.code}</span>
                    </div>

                    <h3 className="mt-7 font-display text-2xl font-semibold text-bone">
                      {info.label}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-sage">
                      {info.description}
                    </p>

                    <ul className="mt-auto flex flex-wrap gap-2 pt-7">
                      {info.outcomes.map((ship) => (
                        <li
                          key={ship}
                          className="rounded-full border border-[#142a1c] px-3 py-1 font-mono text-[0.68rem] text-[#96b0a0] transition-colors duration-500 group-hover:border-[#2a5138] group-hover:text-bone"
                        >
                          {ship}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Spotlight>
              </Reveal>
            );
          })}

          <Reveal delay={0.3} y={30} className="lg:col-span-1">
            <Spotlight
              as="article"
              className="group h-full rounded-[var(--leaf)] border border-dashed border-[#1c3626] bg-[#06120c]/40 p-7 backdrop-blur-md transition-colors duration-500 hover:border-lichen/40"
            >
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded border border-[#1c3626] bg-[#06120c] text-bone">
                    <Icon d={SPARK} />
                  </span>
                  <span className="tag text-[0.65rem]">NEW-07</span>
                </div>
                <h3 className="mt-7 font-display text-2xl font-semibold text-bone">
                  A problem without a label?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-sage">
                  Bring us the bottleneck. We will find the smallest intelligent
                  system capable of changing it.
                </p>
                <a
                  href="#contact"
                  data-cursor="link"
                  className="mt-auto inline-flex items-center gap-2 pt-6 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-lichen"
                >
                  Talk it through
                  <span
                    aria-hidden
                    className="transition-transform duration-500 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              </div>
            </Spotlight>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
