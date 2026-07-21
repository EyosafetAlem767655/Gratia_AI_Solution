import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <Reveal className="mb-8" y={20}>
        <Image
          src="/logo.png"
          alt="Gratia AI Solutions"
          width={320}
          height={180}
          className="mx-auto drop-shadow-2xl"
          priority
        />
      </Reveal>
      <Reveal delay={0.1}>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[#F4EDE4] sm:text-6xl">
          AI Solutions{" "}
          <span className="text-[#C9A961]">Rooted in Wisdom</span>
        </h1>
      </Reveal>
      <Reveal delay={0.25}>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#A8C5A0] sm:text-xl">
          Gratia AI Solutions crafts intelligent systems for industrial,
          financial, manufacturing, real estate, and e-commerce companies —
          where nature&apos;s patience meets cutting-edge AI.
        </p>
      </Reveal>
      <Reveal delay={0.4}>
        <a
          href="#services"
          className="mt-10 inline-block rounded-full border border-[#C9A961]/50 bg-[#4A7C59]/20 px-8 py-3 text-sm font-medium text-[#F4EDE4] backdrop-blur transition hover:bg-[#4A7C59]/40"
        >
          Explore Our Craft
        </a>
      </Reveal>
    </section>
  );
}
