import { ApiError } from "@google/genai";
import {
  generateText,
  hasGeminiApiKey,
  isAuthError,
  isModelError,
  MissingApiKeyError,
} from "@/lib/gemini";
import type { GeminiContent } from "@/lib/gemini";
import {
  COACH_MODULES,
  MODULE_TEMPERATURE,
  SYSTEM_PROMPTS,
} from "@/lib/prompts";
import type { CoachModule } from "@/lib/prompts";

export const maxDuration = 60;

const MAX_FIELD_LENGTH = 20_000;
const WRITING_MODULES: CoachModule[] = [
  "create-cv",
  "review-cv",
  "cover-letter",
  "interview-prep",
];

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type CoachRequest = {
  module: CoachModule;
  cv?: string;
  offer?: string;
  extra?: string;
  messages?: ChatMessage[];
};

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

function jsonResult(result: string): Response {
  return Response.json({ result });
}

function isCoachModule(value: unknown): value is CoachModule {
  return (
    typeof value === "string" &&
    (COACH_MODULES as readonly string[]).includes(value)
  );
}

function isChatRole(value: unknown): value is ChatRole {
  return value === "user" || value === "assistant";
}

function tooLong(value: string | undefined): boolean {
  return typeof value === "string" && value.length > MAX_FIELD_LENGTH;
}

function requiredMissing(module: CoachModule, body: CoachRequest): string | null {
  if (module === "create-cv" && !body.extra?.trim()) {
    return "Les informations complémentaires sont requises.";
  }
  if (module === "review-cv" && !body.cv?.trim()) {
    return "Le CV est requis.";
  }
  if (module === "cover-letter" || module === "interview-prep") {
    if (!body.cv?.trim() || !body.offer?.trim()) {
      return "Le CV et l'offre d'emploi sont requis.";
    }
  }
  if (module === "recruiter-sim") {
    if (!body.cv?.trim() || !body.offer?.trim()) {
      return "Le CV et l'offre d'emploi sont requis.";
    }
    if (!body.messages || body.messages.length === 0) {
      return "La conversation est vide.";
    }
  }
  return null;
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }

  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      return null;
    }
    const record = item as Record<string, unknown>;
    if (!isChatRole(record.role) || typeof record.content !== "string") {
      return null;
    }
    if (record.content.length > MAX_FIELD_LENGTH) {
      return null;
    }
    if (!record.content.trim()) {
      return null;
    }
    messages.push({ role: record.role, content: record.content });
  }
  return messages;
}

function buildUserContent(cv?: string, offer?: string, extra?: string): string {
  const blocks: string[] = [];
  if (cv?.trim()) {
    blocks.push(`## CV\n\n${cv.trim()}`);
  }
  if (offer?.trim()) {
    blocks.push(`## Offre d'emploi\n\n${offer.trim()}`);
  }
  if (extra?.trim()) {
    blocks.push(`## Informations complémentaires\n\n${extra.trim()}`);
  }
  return blocks.join("\n\n");
}

function toGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 429) {
    return true;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 429
  ) {
    return true;
  }
  if (error instanceof Error && /429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(error.message)) {
    return true;
  }
  return false;
}

export async function GET(): Promise<Response> {
  return Response.json({ configured: hasGeminiApiKey() });
}

export async function POST(request: Request): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Le corps de la requête est invalide.", 400);
  }

  if (typeof rawBody !== "object" || rawBody === null || Array.isArray(rawBody)) {
    return jsonError("Le corps de la requête est invalide.", 400);
  }

  const payload = rawBody as Record<string, unknown>;

  if (!isCoachModule(payload.module)) {
    return jsonError("Le module est invalide.", 400);
  }

  const stringFields = ["cv", "offer", "extra"] as const;
  for (const field of stringFields) {
    const value = payload[field];
    if (value !== undefined && typeof value !== "string") {
      return jsonError("Les données envoyées sont invalides.", 400);
    }
    if (typeof value === "string" && tooLong(value)) {
      return jsonError("Un champ dépasse la limite de 20 000 caractères.", 400);
    }
  }

  const parsedMessages = parseMessages(payload.messages);
  if (parsedMessages === null) {
    return jsonError("La conversation est invalide ou trop longue.", 400);
  }

  const body: CoachRequest = {
    module: payload.module,
    cv: typeof payload.cv === "string" ? payload.cv : undefined,
    offer: typeof payload.offer === "string" ? payload.offer : undefined,
    extra: typeof payload.extra === "string" ? payload.extra : undefined,
    messages: parsedMessages,
  };

  const missing = requiredMissing(body.module, body);
  if (missing) {
    return jsonError(missing, 400);
  }

  if (!hasGeminiApiKey()) {
    return jsonError(new MissingApiKeyError().message, 503);
  }

  try {
    if (WRITING_MODULES.includes(body.module)) {
      const userContent = buildUserContent(body.cv, body.offer, body.extra);
      if (!userContent) {
        return jsonError("Aucun contenu à analyser.", 400);
      }

      const result = await generateText({
        systemInstruction: SYSTEM_PROMPTS[body.module],
        contents: [
          {
            role: "user",
            parts: [{ text: userContent }],
          },
        ],
        temperature: MODULE_TEMPERATURE[body.module],
      });

      return jsonResult(result);
    }

    const cv = body.cv?.trim() ?? "";
    const offer = body.offer?.trim() ?? "";
    const systemInstruction = `${SYSTEM_PROMPTS["recruiter-sim"]}

## CV du candidat

${cv}

## Offre d'emploi

${offer}`;

    const result = await generateText({
      systemInstruction,
      contents: toGeminiContents(body.messages ?? []),
      temperature: MODULE_TEMPERATURE["recruiter-sim"],
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return jsonError(error.message, 503);
    }
    if (isQuotaError(error)) {
      return jsonError("Le quota de l'API est dépassé. Réessayez plus tard.", 429);
    }
    if (isAuthError(error)) {
      return jsonError(
        "La clé API Gemini est invalide ou refusée. Vérifiez GEMINI_API_KEY dans .env, puis relancez le serveur.",
        503,
      );
    }
    if (isModelError(error)) {
      return jsonError(
        "Le modèle IA est indisponible. Vérifiez GEMINI_MODEL dans .env.local.",
        502,
      );
    }

    const detail = error instanceof Error ? error.message : "erreur inconnue";
    console.error("[coach] génération échouée:", detail);
    return jsonError("La génération a échoué. Vérifiez votre configuration et réessayez.", 500);
  }
}
