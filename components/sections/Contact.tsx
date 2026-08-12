"use client";

import { Reveal, RevealText } from "@/components/ui/Reveal";

/**
 * No form.
 *
 * The one this replaced was `mailto:`-only with no backend — it collected
 * nothing and sent nothing, it just opened a mail client with more steps. Two
 * direct links do the same job honestly and keep this beat inside the sky.
 */
export function Contact() {
  return (
    <section id="contact" className="beat">
      <div className="rails">
        <div>
          <Reveal>
            <p className="tag mb-6">Begin</p>
          </Reveal>

          <h2 className="text-[clamp(2.5rem,6vw,4.5rem)]">
            <RevealText text="Let's build." />
          </h2>

          <Reveal delay={0.2}>
            <div className="mt-7 flex flex-col gap-2 text-lg">
              <a className="link w-fit" href="mailto:eyosafetalem@gmail.com">
                eyosafetalem@gmail.com
              </a>
              <a className="link w-fit" href="tel:+251938767655">
                +251 938 767 655
              </a>
            </div>
          </Reveal>
        </div>

        <div />
      </div>
    </section>
  );
}
