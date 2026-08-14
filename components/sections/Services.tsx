"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SERVICES } from "@/lib/content";

export function Services() {
  return (
    <section id="services" className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <Reveal>
          <p className="mb-10 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
            What we build
          </p>
        </Reveal>

        <ul className="space-y-10">
          {SERVICES.map((service) => (
            <Reveal as="li" key={service.name}>
              <div className="border-t border-white/10 pt-6 sm:grid sm:grid-cols-[14rem_1fr] sm:gap-10">
                <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {service.name}
                </h3>
                <p className="mt-2 max-w-xl text-base leading-relaxed text-white/70 sm:mt-0">
                  {service.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
