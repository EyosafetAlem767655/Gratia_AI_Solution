import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { requireDb } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  message: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    if (dbAvailable()) {
      const database = requireDb();
      await database.insert(contactSubmissions).values({
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        message: data.message,
      });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Gratia AI Contact <onboarding@resend.dev>",
        to: "eyosafetalem@gmail.com",
        replyTo: data.email,
        subject: `New contact from ${data.name}`,
        text: [
          `Name: ${data.name}`,
          `Email: ${data.email}`,
          `Phone: ${data.phone ?? "Not provided"}`,
          "",
          data.message,
        ].join("\n"),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 },
    );
  }
}

function dbAvailable() {
  return Boolean(process.env.DATABASE_URL);
}
