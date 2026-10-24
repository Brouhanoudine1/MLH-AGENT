import { ApiError, GoogleGenAI } from "@google/genai";
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

const DEFAULT_MODEL = "gemma-4-26b-a4b-it";
const FALLBACK_MODELS = ["gemma-4-26b-a4b-it", "gemini-flash-latest"];

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "Enregistrez GEMINI_API_KEY dans jobcoach-ai/.env (ou .env.local), puis relancez le serveur (npm run dev).",
    );
    this.name = "MissingApiKeyError";
  }
}

function sanitizeKey(value: string): string {
  return value.replace(/\s+/g, "").replace(/^["']|["']$/g, "");
}

function readApiKey(): string {
  return sanitizeKey(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  );
}

function requestedModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function modelsToTry(): string[] {
  const preferred = requestedModel();
  return [preferred, ...FALLBACK_MODELS.filter((model) => model !== preferred)];
}

function toContents(contents: GeminiContent[]): Content[] {
  return contents.map((content) => ({
    role: content.role,
    parts: content.parts.map((part) => ({ text: part.text })),
  }));
}

function flattenPrompt(
  systemInstruction: string,
  contents: GeminiContent[],
): string {
  const body = contents
    .map((content) => content.parts.map((part) => part.text).join("\n"))
    .join("\n\n");
  return `${systemInstruction}\n\n---\n\n${body}`;
}

let client: GoogleGenAI | null = null;

export function hasGeminiApiKey(): boolean {
  return Boolean(readApiKey());
}

function getClient(): GoogleGenAI {
  const apiKey = readApiKey();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function isGemmaModel(model: string): boolean {
  return /^gemma/i.test(model);
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return true;
  }
  if (error instanceof Error) {
    return /401|403|API_KEY_INVALID|PERMISSION_DENIED|invalid.+api.?key/i.test(
      error.message,
    );
  }
  return false;
}

export function isModelError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 404) {
    return true;
  }
  if (error instanceof Error) {
    return /NOT_FOUND|model.+not found|is not found/i.test(error.message);
  }
  return false;
}

function isRetryableModelFailure(error: unknown): boolean {
  if (error instanceof MissingApiKeyError || isAuthError(error)) {
    return false;
  }
  if (error instanceof ApiError && (error.status === 404 || error.status === 500)) {
    return true;
  }
  if (error instanceof Error) {
    return /INTERNAL|NOT_FOUND|UNAVAILABLE|500|404/i.test(error.message);
  }
  return false;
}

async function callModel(
  ai: GoogleGenAI,
  model: string,
  systemInstruction: string,
  contents: GeminiContent[],
  temperature?: number,
): Promise<string> {
  const gemma = isGemmaModel(model);
  const response = await ai.models.generateContent({
    model,
    contents: gemma
      ? flattenPrompt(systemInstruction, contents)
      : toContents(contents),
    config: gemma
      ? undefined
      : {
          systemInstruction,
          temperature,
        },
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new Error("Le modèle n'a renvoyé aucun texte.");
  }
  return text;
}

export async function generateText({
  systemInstruction,
  contents,
  temperature,
}: GenerateTextParams): Promise<string> {
  const ai = getClient();
  const models = modelsToTry();
  let lastError: unknown;

  for (const model of models) {
    try {
      return await callModel(ai, model, systemInstruction, contents, temperature);
    } catch (error) {
      lastError = error;
      if (!isRetryableModelFailure(error)) {
        throw error;
      }
      console.error(`[coach] modèle ${model} indisponible, essai suivant.`);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("La génération a échoué.");
}
