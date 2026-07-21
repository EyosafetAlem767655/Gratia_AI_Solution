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
          width={300}
          height={305}
          className="mx-auto drop-shadow-2xl"
          priority
        />
      </Reveal>
      <Reveal delay={0.1}>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[#F3EAFF] sm:text-6xl">
          AI Solutions{" "}
          <span className="text-[#C084FC]">Rooted in Wisdom</span>
        </h1>
      </Reveal>
      <Reveal delay={0.25}>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#B9A8D0] sm:text-xl">
          Gratia AI Solutions crafts intelligent systems for industrial,
          financial, manufacturing, real estate, and e-commerce companies —
          where nature&apos;s patience meets cutting-edge AI.
        </p>
      </Reveal>
      <Reveal delay={0.4}>
        <a
          href="#services"
          className="mt-10 inline-block rounded-full border border-[#C084FC]/50 bg-[#7C3AED]/20 px-8 py-3 text-sm font-medium text-[#F3EAFF] backdrop-blur transition hover:bg-[#7C3AED]/40"
        >
          Explore Our Craft
        </a>
      </Reveal>
    </section>
  );
}
