"use client";

import { useState, type FormEvent } from "react";

const CONTACT_EMAIL = "eyosafetalem@gmail.com";

const FIELD =
  "peer w-full rounded border border-[#1f2733] bg-[#04060a]/70 px-4 pb-3 pt-6 text-[15px] text-chrome outline-none transition-colors duration-300 placeholder:text-transparent focus:border-molten";

const LABEL =
  "pointer-events-none absolute left-4 top-4 origin-left font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[#5d6d80] transition-all duration-300 peer-focus:top-2 peer-focus:text-[0.6rem] peer-focus:text-molten peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[0.6rem]";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const value = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement)
        .value;

    const subject = `New enquiry from ${value("name")}`;
    const body = [
      `Name: ${value("name")}`,
      `Email: ${value("email")}`,
      `Company: ${value("company") || "—"}`,
      `Phone: ${value("phone") || "—"}`,
      "",
      value("message"),
    ].join("\n");

    // Opens the visitor's own mail client with everything prefilled — no
    // server, no third-party form service, nothing to leak.
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field id="name" label="Name" autoComplete="name" required />
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field id="company" label="Company" autoComplete="organization" />
        <Field id="phone" label="Phone" type="tel" autoComplete="tel" />
      </div>

      <div className="relative">
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder=" "
          className={`${FIELD} resize-none`}
        />
        <label htmlFor="message" className={LABEL}>
          What are you trying to build?
        </label>
      </div>

      <button type="submit" className="btn btn-molten w-full">
        Send the brief
      </button>

      <p
        className="pt-1 text-center font-mono text-[0.7rem] leading-relaxed text-[#5d6d80]"
        aria-live="polite"
      >
        {sent
          ? "Your mail client should have opened with the brief ready to send."
          : `Opens your mail client, addressed to ${CONTACT_EMAIL}`}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  required = false,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        // A single space keeps :placeholder-shown meaningful, which is what
        // drives the floating label without any JavaScript.
        placeholder=" "
        className={FIELD}
      />
      <label htmlFor={id} className={LABEL}>
        {label}
        {required && <span className="text-molten"> *</span>}
      </label>
    </div>
  );
}
