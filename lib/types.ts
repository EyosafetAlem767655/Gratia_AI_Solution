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
  imagePrompt: string;
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
