"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again or email us directly.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm text-[#A8C5A0]">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-[#4A7C59]/40 bg-[#1B3A1A]/80 px-4 py-3 text-[#F4EDE4] outline-none focus:border-[#C9A961]"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-[#A8C5A0]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-[#4A7C59]/40 bg-[#1B3A1A]/80 px-4 py-3 text-[#F4EDE4] outline-none focus:border-[#C9A961]"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm text-[#A8C5A0]">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="w-full rounded-lg border border-[#4A7C59]/40 bg-[#1B3A1A]/80 px-4 py-3 text-[#F4EDE4] outline-none focus:border-[#C9A961]"
          placeholder="+1 234 567 8900"
        />
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm text-[#A8C5A0]">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="w-full resize-none rounded-lg border border-[#4A7C59]/40 bg-[#1B3A1A]/80 px-4 py-3 text-[#F4EDE4] outline-none focus:border-[#C9A961]"
          placeholder="Tell us about your project..."
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-[#4A7C59] px-6 py-3 font-medium text-[#F4EDE4] transition hover:bg-[#5a9468] disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Send Message"}
      </button>
      {status === "success" && (
        <p className="text-center text-sm text-[#A8C5A0]">
          Thank you! We&apos;ll be in touch soon.
        </p>
      )}
      {status === "error" && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
