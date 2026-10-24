import { GoogleGenAI } from "@google/genai";
import type { Content } from "@google/genai";

export type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

export type GenerateTextParams = {
  systemInstruction: string;
  contents: GeminiContent[];
  temperature?: number;
};

function toContents(contents: GeminiContent[]): Content[] {
  return contents.map((content) => ({
    role: content.role,
    parts: content.parts.map((part) => ({ text: part.text })),
  }));
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("La variable d'environnement GEMINI_API_KEY est absente.");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generateText({
  systemInstruction,
  contents,
  temperature,
}: GenerateTextParams): Promise<string> {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL ?? "gemma-4-31b-it";
  const response = await ai.models.generateContent({
    model,
    contents: toContents(contents),
    config: {
      systemInstruction,
      temperature,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Le modèle n'a renvoyé aucun texte.");
  }
  return text;
}
