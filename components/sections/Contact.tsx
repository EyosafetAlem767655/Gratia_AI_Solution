"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { CONTACT } from "@/lib/content";

const EMAIL = CONTACT.email;

type State = { status: "idle" | "sending" | "sent"; error: string | null };

export function Contact() {
  const [state, setState] = useState<State>({ status: "idle", error: null });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    setState({ status: "sending", error: null });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json();
      if (!response.ok) {
        setState({ status: "idle", error: body.error ?? "Something went wrong." });
        return;
      }
      setState({ status: "sent", error: null });
      form.reset();
    } catch {
      // Offline or the route is unreachable. The mailto link below still works,
      // so point at it rather than leaving a dead end.
      setState({
        status: "idle",
        error: `Couldn't reach the server — email ${EMAIL} directly.`,
      });
    }
  }

  return (
    <section
      id="contact"
      className="relative px-5 pb-16 pt-4 sm:px-8 lg:px-12"
    >
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <Reveal>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
              {CONTACT.eyebrow}
            </p>
          </Reveal>
          <Reveal>
            <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {CONTACT.headline}
            </h1>
          </Reveal>
          <Reveal>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
              {CONTACT.body}
            </p>
          </Reveal>
          <Reveal>
            {/* Always present, and deliberately not dependent on the API route:
                if the relay is broken this is still a working way to reach us. */}
            <a
              href={`mailto:${EMAIL}`}
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
            >
              {EMAIL}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Reveal>
        </div>

        <Reveal>
          <form onSubmit={onSubmit} className="glass rounded-2xl p-5 sm:p-6">
            {/* Honeypot: off-screen and hidden from assistive tech, so only a
                bot will ever fill it. */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="name" className="sr-only">Your name</label>
                <input
                  id="name"
                  name="name"
                  required
                  maxLength={80}
                  placeholder="Your name"
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 outline-none ring-1 ring-inset ring-white/15 transition-colors focus:bg-white/15 focus:ring-white/40"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">Your email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  placeholder="Your email"
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 outline-none ring-1 ring-inset ring-white/15 transition-colors focus:bg-white/15 focus:ring-white/40"
                />
              </div>
              <div>
                <label htmlFor="message" className="sr-only">Your message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  placeholder="What are you trying to solve?"
                  className="w-full resize-none rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 outline-none ring-1 ring-inset ring-white/15 transition-colors focus:bg-white/15 focus:ring-white/40"
                />
              </div>

              {state.error && (
                <p role="alert" className="text-sm text-red-300">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={state.status !== "idle"}
                className="btn-cta flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-60"
              >
                {state.status === "sent" && <Check className="h-4 w-4" />}
                {state.status === "idle" && "Send message"}
                {state.status === "sending" && "Sending..."}
                {state.status === "sent" && "Sent — we'll be in touch"}
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
