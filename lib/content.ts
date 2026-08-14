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
  headline: "AI systems that solve real business problems",
  subline:
    "We design and build AI software for companies that want to work faster and spend less.",
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
  headline: "Tell us what you need",
  body: "Describe the problem in your own words — you do not need to know what the solution is called. We read and reply to everything.",
  email: "eyosafetalem@gmail.com",
} as const;
