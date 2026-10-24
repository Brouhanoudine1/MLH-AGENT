"use client";

import { useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import Markdown from "@/components/Markdown";
import type { CoachModule } from "@/lib/prompts";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type TabDefinition = {
  id: CoachModule;
  label: string;
};

type CoachSuccess = {
  result: string;
};

type CoachFailure = {
  error: string;
};

const TABS: TabDefinition[] = [
  { id: "create-cv", label: "Créer mon CV" },
  { id: "review-cv", label: "Corriger mon CV" },
  { id: "cover-letter", label: "Lettre de motivation" },
  { id: "interview-prep", label: "Préparer l'entretien" },
  { id: "recruiter-sim", label: "Simulateur de recruteur" },
];

const WRITING_MODULES: CoachModule[] = [
  "create-cv",
  "review-cv",
  "cover-letter",
  "interview-prep",
];

const START_INTERVIEW_MESSAGE = "Bonjour, je suis prêt pour commencer l'entretien.";
const MAX_FIELD_LENGTH = 20_000;

function isCoachSuccess(value: unknown): value is CoachSuccess {
  return (
    typeof value === "object" &&
    value !== null &&
    "result" in value &&
    typeof value.result === "string"
  );
}

function isCoachFailure(value: unknown): value is CoachFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function missingFields(
  module: CoachModule,
  cv: string,
  offer: string,
  extra: string,
): string[] {
  const missing: string[] = [];
  if (module === "create-cv" && !extra.trim()) {
    missing.push("les informations complémentaires");
  }
  if (module === "review-cv" && !cv.trim()) {
    missing.push("votre CV");
  }
  if (
    module === "cover-letter" ||
    module === "interview-prep" ||
    module === "recruiter-sim"
  ) {
    if (!cv.trim()) {
      missing.push("votre CV");
    }
    if (!offer.trim()) {
      missing.push("l'offre d'emploi");
    }
  }
  return missing;
}

function missingMessage(missing: string[]): string {
  if (missing.length === 0) {
    return "";
  }
  if (missing.length === 1) {
    return `Veuillez renseigner ${missing[0]}.`;
  }
  const debut = missing.slice(0, -1).join(", ");
  return `Veuillez renseigner ${debut} et ${missing[missing.length - 1]}.`;
}

async function callCoach(body: {
  module: CoachModule;
  cv?: string;
  offer?: string;
  extra?: string;
  messages?: ChatMessage[];
}): Promise<string> {
  const response = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("La réponse du serveur est illisible.");
  }

  if (!response.ok) {
    if (isCoachFailure(data)) {
      throw new Error(data.error);
    }
    throw new Error("Une erreur est survenue. Veuillez réessayer.");
  }

  if (!isCoachSuccess(data) || !data.result.trim()) {
    throw new Error("La génération a échoué. Veuillez réessayer.");
  }

  return data.result;
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
      aria-hidden="true"
    />
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<CoachModule>("create-cv");
  const [cv, setCv] = useState("");
  const [offer, setOffer] = useState("");
  const [extra, setExtra] = useState("");
  const [results, setResults] = useState<Partial<Record<CoachModule, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  const missing = useMemo(
    () => missingFields(activeTab, cv, offer, extra),
    [activeTab, cv, offer, extra],
  );
  const canGenerate = missing.length === 0 && !loading;
  const currentResult = results[activeTab] ?? "";
  const interviewStarted = messages.length > 0;
  const hasRecruiterReply = messages.some((message) => message.role === "assistant");

  async function generateWriting() {
    if (!canGenerate || !WRITING_MODULES.includes(activeTab)) {
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const result = await callCoach({
        module: activeTab,
        cv,
        offer,
        extra,
      });
      setResults((current) => ({ ...current, [activeTab]: result }));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Une erreur est survenue. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendSimulatorMessages(nextMessages: ChatMessage[]) {
    setMessages(nextMessages);
    setLoading(true);
    setError("");

    try {
      const result = await callCoach({
        module: "recruiter-sim",
        cv,
        offer,
        extra,
        messages: nextMessages,
      });
      setMessages([...nextMessages, { role: "assistant", content: result }]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Une erreur est survenue. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function startInterview() {
    if (missing.length > 0 || loading) {
      return;
    }
    await sendSimulatorMessages([
      { role: "user", content: START_INTERVIEW_MESSAGE },
    ]);
  }

  async function sendCandidateMessage() {
    const content = draft.trim();
    if (!content || loading || !interviewStarted) {
      return;
    }
    setDraft("");
    await sendSimulatorMessages([...messages, { role: "user", content }]);
  }

  function onDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendCandidateMessage();
    }
  }

  async function requestDebrief() {
    if (loading || !hasRecruiterReply) {
      return;
    }
    await sendSimulatorMessages([...messages, { role: "user", content: "DEBRIEF" }]);
  }

  function restartInterview() {
    setMessages([]);
    setDraft("");
    setError("");
  }

  async function copyResult() {
    if (!currentResult) {
      return;
    }
    try {
      await navigator.clipboard.writeText(currentResult);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Impossible de copier le texte.");
    }
  }

  function onSubmitWriting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void generateWriting();
  }

  return (
    <div className="min-h-full bg-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
          <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
            Assistant emploi
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            JobCoach AI
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
            Rédigez un CV, une lettre et préparez vos entretiens, sans inventer
            votre parcours.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              id="cv"
              label="Votre CV (texte)"
              value={cv}
              onChange={setCv}
              rows={10}
              placeholder="Collez ici le texte de votre CV : expériences, formation, compétences, langues, réalisations."
            />
            <Field
              id="offer"
              label="Offre d'emploi"
              value={offer}
              onChange={setOffer}
              rows={10}
              placeholder="Collez ici l'offre d'emploi : intitulé, entreprise, missions, profil recherché."
            />
          </div>
          <div className="mt-4">
            <Field
              id="extra"
              label="Informations complémentaires"
              value={extra}
              onChange={setExtra}
              rows={5}
              placeholder="Parcours, métier visé, compétences, langues, contraintes, réalisations chiffrées. Indispensable pour créer un CV."
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div
            className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 pt-3 sm:px-4"
            role="tablist"
            aria-label="Modules JobCoach"
          >
            {TABS.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError("");
                    setCopied(false);
                  }}
                  className={`whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-medium transition ${
                    selected
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-5 sm:p-6" role="tabpanel">
            {error ? (
              <div
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            {WRITING_MODULES.includes(activeTab) ? (
              <form onSubmit={onSubmitWriting} className="flex flex-col gap-4">
                {missing.length > 0 ? (
                  <p className="text-sm text-slate-600">{missingMessage(missing)}</p>
                ) : (
                  <p className="text-sm text-slate-500">
                    Les champs requis sont remplis. Vous pouvez générer.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={!canGenerate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {loading ? <Spinner /> : null}
                    {loading ? "Génération en cours…" : "Générer"}
                  </button>
                  {currentResult ? (
                    <button
                      type="button"
                      onClick={() => void copyResult()}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {copied ? "Copié" : "Copier"}
                    </button>
                  ) : null}
                </div>

                {loading && !currentResult ? (
                  <p className="text-sm text-slate-500" aria-live="polite">
                    Rédaction en cours, cela peut prendre quelques secondes.
                  </p>
                ) : null}

                {currentResult ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <Markdown content={currentResult} />
                  </div>
                ) : null}
              </form>
            ) : (
              <SimulatorPanel
                missing={missing}
                missingText={missingMessage(missing)}
                loading={loading}
                interviewStarted={interviewStarted}
                hasRecruiterReply={hasRecruiterReply}
                messages={messages}
                draft={draft}
                onDraftChange={setDraft}
                onStart={() => void startInterview()}
                onSend={() => void sendCandidateMessage()}
                onDraftKeyDown={onDraftKeyDown}
                onDebrief={() => void requestDebrief()}
                onRestart={restartInterview}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder: string;
};

function Field({ id, label, value, onChange, rows, placeholder }: FieldProps) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <textarea
        id={id}
        value={value}
        maxLength={MAX_FIELD_LENGTH}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

type SimulatorPanelProps = {
  missing: string[];
  missingText: string;
  loading: boolean;
  interviewStarted: boolean;
  hasRecruiterReply: boolean;
  messages: ChatMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onStart: () => void;
  onSend: () => void;
  onDraftKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onDebrief: () => void;
  onRestart: () => void;
};

function SimulatorPanel({
  missing,
  missingText,
  loading,
  interviewStarted,
  hasRecruiterReply,
  messages,
  draft,
  onDraftChange,
  onStart,
  onSend,
  onDraftKeyDown,
  onDebrief,
  onRestart,
}: SimulatorPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {missing.length > 0 ? (
        <p className="text-sm text-slate-600">{missingText}</p>
      ) : (
        <p className="text-sm text-slate-500">
          Le recruteur pose une question à la fois. Envoyez « Demander le débrief »
          pour sortir du rôle et obtenir une évaluation.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          disabled={missing.length > 0 || loading || interviewStarted}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading && !interviewStarted ? <Spinner /> : null}
          Démarrer l&apos;entretien
        </button>
        <button
          type="button"
          onClick={onDebrief}
          disabled={!hasRecruiterReply || loading}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          Demander le débrief
        </button>
        <button
          type="button"
          onClick={onRestart}
          disabled={!interviewStarted || loading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Recommencer
        </button>
      </div>

      <div className="flex min-h-72 flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {!interviewStarted ? (
          <p className="m-auto text-center text-sm text-slate-500">
            {missing.length > 0
              ? "Remplissez le CV et l'offre, puis démarrez l'entretien."
              : "Cliquez sur « Démarrer l'entretien » pour que le recruteur pose la première question."}
          </p>
        ) : (
          messages.map((message, index) => {
            const isUser = message.role === "user";
            const isDebrief = message.content === "DEBRIEF";
            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${
                    isUser
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      isUser ? "text-indigo-100" : "text-indigo-600"
                    }`}
                  >
                    {isUser ? "Candidat" : "Recruteur"}
                  </p>
                  {isUser ? (
                    <p className="whitespace-pre-wrap">
                      {isDebrief ? "Demande de débrief" : message.content}
                    </p>
                  ) : (
                    <Markdown content={message.content} />
                  )}
                </div>
              </div>
            );
          })
        )}
        {loading && interviewStarted ? (
          <p className="text-sm text-slate-500" aria-live="polite">
            Le recruteur réfléchit…
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1" htmlFor="simulator-draft">
          <span className="sr-only">Votre réponse au recruteur</span>
          <textarea
            id="simulator-draft"
            value={draft}
            rows={3}
            maxLength={MAX_FIELD_LENGTH}
            disabled={!interviewStarted || loading}
            placeholder={
              interviewStarted
                ? "Écrivez votre réponse, puis Entrée pour envoyer. Maj+Entrée pour une nouvelle ligne."
                : "Démarrez l'entretien pour répondre au recruteur."
            }
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onDraftKeyDown}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
          />
        </label>
        <button
          type="button"
          onClick={onSend}
          disabled={!interviewStarted || loading || !draft.trim()}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
