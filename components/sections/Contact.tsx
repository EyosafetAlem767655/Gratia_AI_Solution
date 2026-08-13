"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const EMAIL = "eyosafetalem@gmail.com";

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
      className="relative flex min-h-svh items-center px-5 py-24 sm:px-8 lg:px-12"
    >
      <div className="mx-auto grid w-full max-w-5xl gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-[3.5rem]">
              Let&rsquo;s build.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              Tell us what your operation is struggling with. We reply to
              everything.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
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

        <Reveal delay={0.1}>
          <form onSubmit={onSubmit} className="rounded-2xl bg-black/55 p-5 backdrop-blur-xl sm:p-6">
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
