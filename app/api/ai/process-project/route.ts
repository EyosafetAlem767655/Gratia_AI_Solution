import { NextResponse } from "next/server";
import { z } from "zod";
import { processAndSaveProject } from "@/lib/ai/process";

const bodySchema = z.object({
  companyName: z.string().min(1),
  companyLogoUrl: z.string().url(),
  description: z.string().min(1),
  testimonial: z.string().min(1),
});

export const maxDuration = 120;

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret && request.headers.get("x-internal-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    const result = await processAndSaveProject(body);
    return NextResponse.json({ success: true, project: result.project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
