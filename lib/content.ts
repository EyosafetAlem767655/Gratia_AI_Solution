/**
 * Every word on the site, in one file.
 *
 * Written for a layperson. The previous copy leaned on metaphor ("living
 * intelligence", "make intelligence come alive") which sounds impressive and
 * tells a prospective client nothing about what they would be buying. A
 * factory owner should be able to read any line here and know whether it
 * applies to them.
 *
 * Rule for edits: no metaphors, no invented numbers, no claims that would need
 * a case study to back up until there is one in the database.
 */

export const HERO = {
  headline: "AI products to solve any problems.",
  subline:
    "We design and build AI solutions for companies that want to grow to the next level.",
  cta: "Talk to us",
} as const;

export const ABOUT = {
  eyebrow: "About us",
  headline: "We build the AI, you run the business",
  body: [
    "Gratia AI Solutions is a software company. We build custom AI systems for businesses that have a problem worth solving — too much manual work, too many mistakes, or too little visibility into what is actually happening.",
    "We handle the whole thing: working out what to build, building it, putting it into production, and keeping it running afterwards.",
  ],
} as const;

/**
 * The five things we actually build. Each description says what it does for
 * the business, not what it is made of — the technology name is there for
 * people who already know it, and the sentence is there for people who do not.
 */
export const SERVICES = [
  {
    name: "Agentic AI",
    body: "Software that carries out multi-step tasks on its own — handling orders, chasing follow-ups, preparing reports — and asks a person only when it needs a decision.",
  },
  {
    name: "RAG systems",
    body: "A search and answer tool trained on your own documents, so staff get correct answers from your contracts, manuals and policies instead of hunting through folders.",
  },
  {
    name: "Computer vision",
    body: "Cameras that check quality, count stock, read documents and watch for safety issues, without someone having to sit and look at a screen.",
  },
  {
    name: "SaaS platforms",
    body: "Complete web products, built and hosted for you — the kind you would sell to your own customers or run your operation on.",
  },
  {
    name: "Centralised management systems",
    body: "One place to see and control everything: staff, stock, sales, properties and reporting, instead of five disconnected tools and a spreadsheet.",
  },
] as const;

/**
 * Industries. Deliberately ends on "any company" — the list is there to help
 * people recognise themselves, not to exclude anyone who is not on it.
 */
export const INDUSTRIES = [
  { name: "Manufacturing", body: "Quality checks, production planning, machine monitoring." },
  { name: "Real estate", body: "Property data, valuations, tenant and listing management." },
  { name: "E-commerce", body: "Product data, recommendations, support and demand forecasting." },
  { name: "Hotels & tourism", body: "Bookings, guest service, pricing and occupancy planning." },
  { name: "Any company", body: "If the work is repetitive or the data is a mess, it can usually be improved." },
] as const;

export const CONTACT = {
  eyebrow: "Contact",
  headline: "Prefer a quick message?",
  body: "Describe the problem in your own words — you do not need to know what the solution is called. We read and reply to everything.",
  email: "eyosafetalem@gmail.com",
} as const;

/**
 * Albert, the interviewer on /contact. Same rule as the rest of this file:
 * plain words. The person talking to Albert may never have bought software.
 */
export const ALBERT = {
  eyebrow: "Talk to Albert",
  headline: "Talk to our smartest AI, Albert",
  body: "Albert asks the questions a senior engineer would ask, a few at a time, in plain language. When he understands your problem, our team reviews it and designs a solution for you.",
  greeting: "Hello, I'm Albert. What is your issue or problem? Tell me in as much detail as you like.",
  placeholder:
    "For example: we take orders by phone and WhatsApp, write them in a notebook, and keep losing track of who has paid…",
  start: "Start",
  continue: "Continue",
  thinking: "Albert is thinking…",
  other: "Other",
  otherPlaceholder: "Type your answer",
  textPlaceholder: "Type your answer",
  doneHeadline: "Thank you — Albert has everything he needs.",
  signupNote:
    "Create a free account so we can send you updates and deliver your project. Your request is sent to our team the moment you sign up.",
  signupCta: "Sign up to send your request",
  submit: "Send to the Gratia team",
  submitting: "Sending…",
  startOver: "Start a new conversation",
} as const;

/** Plain-language names for each build status, shown on the client's status page. */
export const BUILD_STATUS: Record<string, { label: string; detail: string }> = {
  awaiting_approval: { label: "In review", detail: "Our team is reading your request." },
  rejected: { label: "Not accepted", detail: "We can't take this project on right now. We'll email you." },
  designing: { label: "Designing", detail: "Our engineers are designing the system for you." },
  clarifying: { label: "Questions for you", detail: "Albert needs a few more answers before we continue." },
  design_review: { label: "Design review", detail: "The design is ready and our team is checking it." },
  planning: { label: "Planning", detail: "We're breaking the build into clear steps." },
  plan_review: { label: "Plan review", detail: "The build plan is being approved." },
  building: { label: "Building", detail: "Your project is being built, step by step." },
  paused: { label: "Short pause", detail: "We're pausing briefly for AI usage limits. Work resumes automatically." },
  delivered: { label: "Delivered", detail: "Your project is ready." },
  failed: { label: "Delayed", detail: "We hit a problem and our team is fixing it." },
};
