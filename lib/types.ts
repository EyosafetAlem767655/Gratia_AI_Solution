export type Industry =
  | "industrial"
  | "financial"
  | "manufacturing"
  | "realestate"
  | "ecommerce";

export type DisplayLayout = "card" | "hero" | "compact";

export type ParticleType = "leaves" | "sparks" | "coins" | "dust";

export type PrimaryShape =
  | "gear"
  | "building"
  | "chart"
  | "cart"
  | "factory"
  | "cube";

export interface SceneConfig {
  archetype: Industry;
  primaryShape: PrimaryShape;
  accentColor: string;
  secondaryColor: string;
  particleType: ParticleType;
  rotationSpeed: number;
  scale: number;
}

export interface StructuredProject {
  title: string;
  summary: string;
  industry: Industry;
  testimonialHighlight: string;
  displayLayout: DisplayLayout;
  // No imagePrompt: it existed only to feed DALL-E, and image generation is
  // gone. See the note at the top of lib/ai/process.ts.
  sceneConfig: SceneConfig;
}

export interface ProjectRecord {
  id: string;
  companyName: string;
  companyLogoUrl: string;
  description: string;
  testimonial: string;
  aiSummary: string | null;
  industry: string | null;
  displayLayout: string | null;
  generatedImageUrl: string | null;
  sceneConfig: SceneConfig | null;
  createdAt: Date;
}

export interface TelegramPartialData {
  companyName?: string;
  logoFileId?: string;
  description?: string;
  testimonial?: string;
}

export interface IndustryInfo {
  label: string;
  description: string;
  shape: PrimaryShape;
  /** Stamped index shown on the capability cards. */
  code: string;
  /** Concrete systems we ship for this sector. */
  ships: string[];
}

export type Solution = {
  code: string;
  label: string;
  description: string;
  shape: PrimaryShape;
  outcomes: string[];
};

/** Public-facing capabilities. Industry remains project metadata, while the
 * site leads with reusable business outcomes that travel across sectors. */
export const SOLUTIONS: Solution[] = [
  { code: "AUT-01", label: "AI Automation", description: "Agents and workflows that remove repetitive work without removing human control.", shape: "gear", outcomes: ["Process agents", "Document intelligence", "Human approvals"] },
  { code: "OPS-02", label: "Intelligent Operations", description: "Decision systems that connect live operational data to the people running the business.", shape: "factory", outcomes: ["Live copilots", "Anomaly detection", "Resource planning"] },
  { code: "PRE-03", label: "Predictive Systems", description: "Forecasting and risk models that turn historical signals into earlier, better decisions.", shape: "chart", outcomes: ["Demand forecasts", "Risk signals", "Failure prediction"] },
  { code: "VIS-04", label: "Computer Vision", description: "Reliable visual intelligence for inspection, measurement, safety, and physical operations.", shape: "cube", outcomes: ["Quality inspection", "Asset monitoring", "Visual search"] },
  { code: "EXP-05", label: "AI Experiences", description: "Useful, brand-aware interfaces that help customers and teams find answers and take action.", shape: "cart", outcomes: ["Support agents", "Personalisation", "Knowledge systems"] },
  { code: "BES-06", label: "Bespoke Intelligence", description: "A new AI capability shaped around the problem when an off-the-shelf category does not fit.", shape: "building", outcomes: ["Custom models", "Private deployments", "System integration"] },
];

export const INDUSTRY_INFO: Record<Industry, IndustryInfo> = {
  industrial: {
    label: "Industrial",
    description:
      "Predictive maintenance, supply chain intelligence, and operational automation for heavy industry.",
    shape: "gear",
    code: "IND-01",
    ships: ["Failure prediction", "Supply chain models", "Ops copilots"],
  },
  financial: {
    label: "Financial",
    description:
      "Risk modeling, fraud detection, and intelligent advisory systems for banks and fintech.",
    shape: "chart",
    code: "FIN-02",
    ships: ["Fraud detection", "Credit risk", "Document intelligence"],
  },
  manufacturing: {
    label: "Manufacturing",
    description:
      "Quality control vision, production optimization, and smart factory orchestration.",
    shape: "factory",
    code: "MFG-03",
    ships: ["Defect vision", "Yield optimisation", "Line scheduling"],
  },
  realestate: {
    label: "Real Estate",
    description:
      "Property valuation, tenant analytics, and market forecasting powered by AI.",
    shape: "building",
    code: "RE-04",
    ships: ["Valuation models", "Tenant analytics", "Market forecasting"],
  },
  ecommerce: {
    label: "E-commerce",
    description:
      "Personalization engines, demand forecasting, and conversational commerce at scale.",
    shape: "cart",
    code: "COM-05",
    ships: ["Recommendations", "Demand forecasting", "Support agents"],
  },
};
