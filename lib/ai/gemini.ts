import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";

/**
 * One way to ask Gemini for JSON, shared by the portfolio structurer
 * (lib/ai/process.ts) and Albert (lib/albert/albert.ts).
 *
 * `responseSchema` constrains decoding as the model generates, so malformed
 * JSON and out-of-set enum values are prevented rather than caught. The Zod
 * schema then validates what comes back, which still matters: lengths and
 * numeric bounds are guidance to Gemini, not enforcement.
 */

export function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateJson<T extends z.ZodTypeAny>(options: {
  model: string;
  systemInstruction: string;
  contents: string;
  responseSchema: object;
  schema: T;
  temperature: number;
}): Promise<z.infer<T>> {
  const ai = getGemini();

  let response;
  try {
    response = await ai.models.generateContent({
      model: options.model,
      contents: options.contents,
      config: {
        systemInstruction: options.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: options.responseSchema,
        temperature: options.temperature,
      },
    });
  } catch (error) {
    // A wrong or retired model id surfaces as a 404 from the API, which is
    // otherwise reported as an opaque failure.
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      throw new Error(
        `Gemini model "${options.model}" was not found for this API key. Set the model env var to one your key can use.`,
      );
    }
    throw error;
  }

  const raw = response.text;
  if (!raw) {
    throw new Error("Gemini returned an empty response");
  }

  return options.schema.parse(JSON.parse(raw));
}
