import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

let client: GoogleGenAI | undefined;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

/** Zod → JSON Schema in the subset Gemini's `responseJsonSchema` accepts. */
export function toGeminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema);
  delete json.$schema;
  return json;
}

/**
 * One structured-output call. Returns parsed-but-unvalidated JSON; callers
 * own validation because the shape schema sent to Gemini is deliberately
 * looser than what the app trusts.
 */
export async function generateJson(input: {
  systemInstruction: string;
  contents: string;
  responseJsonSchema: Record<string, unknown>;
  temperature?: number;
}): Promise<unknown> {
  const response = await getClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: input.contents,
    config: {
      systemInstruction: input.systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: input.responseJsonSchema,
      temperature: input.temperature,
    },
  });

  const text = response.text;
  if (!text) {
    throw new GeminiError("Gemini returned an empty response", {
      finishReason: response.candidates?.[0]?.finishReason,
      promptFeedback: response.promptFeedback,
    });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError("Gemini returned non-JSON output", {
      finishReason: response.candidates?.[0]?.finishReason,
      head: text.slice(0, 200),
    });
  }
}
