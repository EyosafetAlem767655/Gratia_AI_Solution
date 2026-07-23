import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-28 text-center"
    >
      {/* Legibility scrim over the fixed 3D canvas */}
      <div className="section-scrim pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
        <Reveal y={16}>
          <div className="relative">
            <div className="absolute inset-0 -z-10 blur-2xl [background:radial-gradient(circle,rgba(245,158,11,0.22),transparent_65%)]" />
            <Image
              src="/logo.png"
              alt="Gratia AI Solutions"
              width={240}
              height={228}
              className="mx-auto h-auto w-[180px] sm:w-[220px]"
              priority
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">
            Enterprise AI · Engineered
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] text-[#F8FAFC] sm:text-5xl lg:text-6xl">
            Production AI for the industries that run the world
          </h1>
        </Reveal>

        <Reveal delay={0.28}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#94A3B8]">
            We design, build, and ship intelligent systems for industrial,
            financial, manufacturing, real-estate, and e-commerce companies —
            from prototype to production.
          </p>
        </Reveal>

        <Reveal delay={0.38}>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="#contact"
              className="rounded-lg bg-[#F59E0B] px-7 py-3 font-semibold text-[#0F172A] transition hover:bg-[#FBBF24]"
            >
              Book a consultation
            </a>
            <a
              href="#services"
              className="rounded-lg border border-[#334155] bg-[#182234]/60 px-7 py-3 font-medium text-[#F8FAFC] backdrop-blur transition hover:border-[#8B5CF6] hover:text-white"
            >
              Explore solutions
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.5}>
          <p className="mt-12 text-xs uppercase tracking-[0.2em] text-[#64748B]">
            Industrial · Financial · Manufacturing · Real Estate · E-commerce
          </p>
        </Reveal>
      </div>
    </section>
  );
}
