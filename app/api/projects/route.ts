import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export async function GET() {
  if (!db) {
    return NextResponse.json([]);
  }

  try {
    const rows = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        companyName: row.companyName,
        companyLogoUrl: row.companyLogoUrl,
        description: row.description,
        testimonial: row.testimonial,
        aiSummary: row.aiSummary,
        industry: row.industry,
        displayLayout: row.displayLayout,
        generatedImageUrl: row.generatedImageUrl,
        sceneConfig: row.sceneConfig,
        createdAt: row.createdAt,
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}
