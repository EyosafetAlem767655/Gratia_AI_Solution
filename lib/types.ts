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

export const INDUSTRY_INFO: Record<
  Industry,
  { label: string; description: string; shape: PrimaryShape }
> = {
  industrial: {
    label: "Industrial",
    description:
      "Predictive maintenance, supply chain intelligence, and operational automation for heavy industry.",
    shape: "gear",
  },
  financial: {
    label: "Financial",
    description:
      "Risk modeling, fraud detection, and intelligent advisory systems for banks and fintech.",
    shape: "chart",
  },
  manufacturing: {
    label: "Manufacturing",
    description:
      "Quality control vision, production optimization, and smart factory orchestration.",
    shape: "factory",
  },
  realestate: {
    label: "Real Estate",
    description:
      "Property valuation, tenant analytics, and market forecasting powered by AI.",
    shape: "building",
  },
  ecommerce: {
    label: "E-commerce",
    description:
      "Personalization engines, demand forecasting, and conversational commerce at scale.",
    shape: "cart",
  },
};
