import OpenAI from "openai";
import { z } from "zod";
import { uploadFromUrl } from "@/lib/blob";
import { requireDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import type { StructuredProject } from "@/lib/types";

const sceneConfigSchema = z.object({
  archetype: z.enum([
    "industrial",
    "financial",
    "manufacturing",
    "realestate",
    "ecommerce",
  ]),
  primaryShape: z.enum([
    "gear",
    "building",
    "chart",
    "cart",
    "factory",
    "cube",
  ]),
  accentColor: z.string(),
  secondaryColor: z.string(),
  particleType: z.enum(["leaves", "sparks", "coins", "dust"]),
  rotationSpeed: z.number().min(0.1).max(1),
  scale: z.number().min(0.5).max(2),
});

const structuredProjectSchema = z.object({
  title: z.string(),
  summary: z.string(),
  industry: z.enum([
    "industrial",
    "financial",
    "manufacturing",
    "realestate",
    "ecommerce",
  ]),
  testimonialHighlight: z.string(),
  displayLayout: z.enum(["card", "hero", "compact"]),
  imagePrompt: z.string(),
  sceneConfig: sceneConfigSchema,
});

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

export async function structureProjectWithAI(input: {
  companyName: string;
  description: string;
  testimonial: string;
}): Promise<StructuredProject> {
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You structure portfolio entries for Gratia AI Solutions, a company building AI solutions for industrial, financial, manufacturing, real estate, and e-commerce clients.
Return JSON with: title, summary (2-3 sentences), industry (one of: industrial, financial, manufacturing, realestate, ecommerce), testimonialHighlight (best quote fragment), displayLayout (card|hero|compact), imagePrompt (for DALL-E, nature/wood aesthetic, abstract 3D visualization matching the project), sceneConfig (archetype, primaryShape, accentColor, secondaryColor, particleType, rotationSpeed, scale).
Use earthy colors: #4A7C59 moss, #8B5E3C oak, #C9A961 amber, #1B3A1A forest.`,
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned empty response");
  }

  return structuredProjectSchema.parse(JSON.parse(raw));
}

export async function generateProjectImage(prompt: string): Promise<string> {
  const openai = getOpenAI();

  const result = await openai.images.generate({
    model: "dall-e-3",
    prompt: `${prompt}. Style: organic nature meets technology, warm wood tones, moss green accents, cinematic 3D render, no text, no logos.`,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });

  const url = result.data?.[0]?.url;
  if (!url) {
    throw new Error("DALL-E returned no image URL");
  }

  return url;
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

  const dalleUrl = await generateProjectImage(structured.imagePrompt);
  const generatedImageUrl = await uploadFromUrl(
    `projects/${slugify(input.companyName)}-${Date.now()}.png`,
    dalleUrl,
  );

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
      generatedImageUrl,
      sceneConfig: structured.sceneConfig,
    })
    .returning();

  return { project, structured };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
