"use client";

import { FormEvent, useState } from "react";

const CONTACT_EMAIL = "eyosafetalem@gmail.com";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
    const message = (
      form.elements.namedItem("message") as HTMLTextAreaElement
    ).value;

    const subject = `New enquiry from ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "—"}`,
      "",
      message,
    ].join("\n");

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    // Opens the visitor's own email app with everything prefilled.
    window.location.href = mailto;
    setSent(true);
  }

  const field =
    "w-full rounded-lg border border-[#334155] bg-[#0F172A]/70 px-4 py-3 text-[#F8FAFC] placeholder-[#64748B] outline-none transition focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/30";
  const label = "mb-1.5 block text-sm font-medium text-[#CBD5E1]";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            className={field}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className={label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
            placeholder="you@company.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="phone" className={label}>
          Phone <span className="text-[#64748B]">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className={field}
          placeholder="+1 234 567 8900"
        />
      </div>
      <div>
        <label htmlFor="message" className={label}>
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className={`${field} resize-none`}
          placeholder="Tell us about your project, industry, and goals…"
        />
      </div>
      <button
        type="submit"
        className="w-full cursor-pointer rounded-lg bg-[#F59E0B] px-6 py-3 font-semibold text-[#0F172A] transition hover:bg-[#FBBF24] active:scale-[0.99]"
      >
        Compose Email
      </button>
      <p className="text-center text-xs text-[#94A3B8]" aria-live="polite">
        {sent
          ? "Your email app should have opened with the message ready to send."
          : `This opens your email app with a message to ${CONTACT_EMAIL}.`}
      </p>
    </form>
  );
}
