import { Type } from "@google/genai";
import { z } from "zod";
import { generateJson } from "@/lib/ai/gemini";
import { requireDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import type { StructuredProject } from "@/lib/types";

/**
 * Turns the raw answers collected by the Telegram wizard into a structured
 * portfolio entry.
 *
 * MODEL CHOICE. `gemini-2.5-flash-lite` is the cheapest tier that can do this
 * job, and it is free of charge on the Gemini free tier. The task is short
 * classification and summarisation over three fields — there is nothing here
 * that a larger model would get meaningfully better. Override with
 * GEMINI_MODEL if you want to move up (or on to a newer lite release such as
 * gemini-3.5-flash-lite) without touching code.
 *
 * NO IMAGE GENERATION. This used to call DALL-E 3 and upload the result to
 * Blob. Two independent reasons it is gone: image generation is not offered on
 * the Gemini free tier at all (gemini-2.5-flash-image, gemini-3.1-flash-image
 * and Imagen 4 are all listed as unavailable), and nothing on the site ever
 * displayed the image — `generatedImageUrl` is fetched by /api/projects and
 * read by no component. It was left over from a 3D design that was removed.
 * The column stays and is simply null.
 */

const INDUSTRIES = [
  "industrial",
  "financial",
  "manufacturing",
  "realestate",
  "ecommerce",
] as const;
const LAYOUTS = ["card", "hero", "compact"] as const;
const SHAPES = ["gear", "building", "chart", "cart", "factory", "cube"] as const;
const PARTICLES = ["leaves", "sparks", "coins", "dust"] as const;

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

const sceneConfigSchema = z.object({
  archetype: z.enum(INDUSTRIES),
  primaryShape: z.enum(SHAPES),
  accentColor: z.string(),
  secondaryColor: z.string(),
  particleType: z.enum(PARTICLES),
  rotationSpeed: z.number().min(0.1).max(1),
  scale: z.number().min(0.5).max(2),
});

const structuredProjectSchema = z.object({
  title: z.string(),
  summary: z.string(),
  industry: z.enum(INDUSTRIES),
  testimonialHighlight: z.string(),
  displayLayout: z.enum(LAYOUTS),
  sceneConfig: sceneConfigSchema,
});

/**
 * The same shape again, in Gemini's schema dialect.
 *
 * This is not redundant with the Zod schema above: Gemini constrains decoding
 * to this shape as it generates, so malformed JSON and out-of-set enum values
 * are prevented rather than caught. Zod then validates what comes back, which
 * still matters because numeric bounds are guidance here, not enforcement.
 * `propertyOrdering` is set because the field order in the prompt and the
 * schema affects output quality.
 */
export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    industry: { type: Type.STRING, enum: [...INDUSTRIES] },
    testimonialHighlight: { type: Type.STRING },
    displayLayout: { type: Type.STRING, enum: [...LAYOUTS] },
    sceneConfig: {
      type: Type.OBJECT,
      properties: {
        archetype: { type: Type.STRING, enum: [...INDUSTRIES] },
        primaryShape: { type: Type.STRING, enum: [...SHAPES] },
        accentColor: { type: Type.STRING },
        secondaryColor: { type: Type.STRING },
        particleType: { type: Type.STRING, enum: [...PARTICLES] },
        rotationSpeed: { type: Type.NUMBER },
        scale: { type: Type.NUMBER },
      },
      required: [
        "archetype",
        "primaryShape",
        "accentColor",
        "secondaryColor",
        "particleType",
        "rotationSpeed",
        "scale",
      ],
      propertyOrdering: [
        "archetype",
        "primaryShape",
        "accentColor",
        "secondaryColor",
        "particleType",
        "rotationSpeed",
        "scale",
      ],
    },
  },
  required: [
    "title",
    "summary",
    "industry",
    "testimonialHighlight",
    "displayLayout",
    "sceneConfig",
  ],
  propertyOrdering: [
    "title",
    "summary",
    "industry",
    "testimonialHighlight",
    "displayLayout",
    "sceneConfig",
  ],
};

const SYSTEM_INSTRUCTION = `You structure portfolio entries for Gratia AI Solutions, a company building AI solutions for industrial, financial, manufacturing, real estate, and e-commerce clients.

Write the summary in plain language a non-technical business owner would understand: 2-3 sentences, no marketing metaphors, no invented facts. Only state what the supplied description and testimonial actually support.

testimonialHighlight must be a fragment quoted verbatim from the testimonial.
rotationSpeed must be between 0.1 and 1. scale must be between 0.5 and 2.
Colours are hex values from the brand palette: #F59E0B gold, #FBBF24 amber, #8B5CF6 violet, #0F172A navy.`;

export async function structureProjectWithAI(input: {
  companyName: string;
  description: string;
  testimonial: string;
}): Promise<StructuredProject> {
  return generateJson({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    contents: JSON.stringify(input),
    responseSchema: RESPONSE_SCHEMA,
    schema: structuredProjectSchema,
    // Low but not zero: this is extraction, not invention.
    temperature: 0.3,
  });
}

export async function processAndSaveProject(input: {
  companyName: string;
  companyLogoUrl: string;
  description: string;
  testimonial: string;
}) {
  const structured = await structureProjectWithAI({
    companyName: input.companyName,
    description: input.description,
    testimonial: input.testimonial,
  });

  const database = requireDb();
  const [project] = await database
    .insert(projects)
    .values({
      companyName: input.companyName,
      companyLogoUrl: input.companyLogoUrl,
      description: input.description,
      testimonial: input.testimonial,
      aiSummary: structured.summary,
      industry: structured.industry,
      displayLayout: structured.displayLayout,
      sceneConfig: structured.sceneConfig,
    })
    .returning();

  return { project, structured };
}
