"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import type { ProjectRecord } from "@/lib/types";

// Validate the fields rendered by the landing page before passing API data to UI.
const projectSchema = z.object({
  id: z.string(), companyName: z.string(), companyLogoUrl: z.string(),
  description: z.string(), testimonial: z.string(),
  aiSummary: z.string().nullable(), industry: z.string().nullable(),
  displayLayout: z.string().nullable(), generatedImageUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
  sceneConfig: z.object({
    archetype: z.enum(["industrial", "financial", "manufacturing", "realestate", "ecommerce"]),
    primaryShape: z.enum(["gear", "building", "chart", "cart", "factory", "cube"]),
    accentColor: z.string(), secondaryColor: z.string(),
    particleType: z.enum(["leaves", "sparks", "coins", "dust"]),
    rotationSpeed: z.number(), scale: z.number(),
  }).nullable(),
}).passthrough();

export function useProjects(cancelled = false) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (cancelled) return;
    const controller = new AbortController();
    fetch("/api/projects", { signal: controller.signal })
      .then(async res => {
        if (!res.ok) throw new Error("Projects request failed");
        return z.array(projectSchema).parse(await res.json());
      })
      .then(data => { if (!controller.signal.aborted) setProjects(data); })
      .catch(() => { if (!controller.signal.aborted) setError("Page content could not load. Please retry."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [cancelled]);
  return { projects, loading, error };
}
