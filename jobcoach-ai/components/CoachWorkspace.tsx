"use client";

import { useEffect, useMemo, useState } from "react";
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
  hint: string;
};

type CoachSuccess = {
  result: string;
};

type CoachFailure = {
  error: string;
};

const TABS: TabDefinition[] = [
  { id: "create-cv", label: "Créer mon CV", hint: "À partir de vos notes" },
  { id: "review-cv", label: "Corriger mon CV", hint: "Score et reformulations" },
  { id: "cover-letter", label: "Lettre de motivation", hint: "300 à 350 mots" },
  { id: "interview-prep", label: "Préparer l'entretien", hint: "Questions STAR" },
  { id: "recruiter-sim", label: "Simulateur", hint: "Entretien puis débrief" },
];

const WRITING_MODULES: CoachModule[] = [
  "create-cv",
  "review-cv",
  "cover-letter",
  "interview-prep",
];

const START_INTERVIEW_MESSAGE = "Bonjour, je suis prêt pour commencer l'entretien.";
const MAX_FIELD_LENGTH = 20_000;
const CONFIG_ERROR =
  "Enregistrez GEMINI_API_KEY dans jobcoach-ai/.env (ou .env.local), puis relancez le serveur (npm run dev).";

let studioHasEntered = false;

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
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cream border-t-transparent"
      aria-hidden="true"
    />
  );
}

function scrollToResult() {
  window.requestAnimationFrame(() => {
    document.getElementById("coach-result")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export default function CoachWorkspace() {
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
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [enter] = useState(() => {
    if (studioHasEntered) {
      return false;
    }
    studioHasEntered = true;
    return true;
  });
  const enterClass = enter ? "page-enter" : "";
  const enterDelayClass = enter ? "page-enter-delay" : "";

  const missing = useMemo(
    () => missingFields(activeTab, cv, offer, extra),
    [activeTab, cv, offer, extra],
  );
  const canGenerate = missing.length === 0 && !loading;
  const currentResult = results[activeTab] ?? "";
  const interviewStarted = messages.length > 0;
  const hasRecruiterReply = messages.some((message) => message.role === "assistant");
  const activeMeta = TABS.find((tab) => tab.id === activeTab);
  const isWriting = WRITING_MODULES.includes(activeTab);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/coach")
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const data: unknown = await response.json();
        if (
          cancelled ||
          typeof data !== "object" ||
          data === null ||
          !("configured" in data)
        ) {
          return;
        }
        setApiConfigured((data as { configured: unknown }).configured === true);
      })
      .catch(() => {
        /* Le bandeau s'affichera au premier essai de génération. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function rememberConfigError(message: string) {
    if (message.includes("GEMINI_API_KEY")) {
      setApiConfigured(false);
    }
  }

  async function generateWriting() {
    if (!canGenerate || !isWriting) {
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
      scrollToResult();
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Une erreur est survenue. Veuillez réessayer.";
      rememberConfigError(message);
      setError(message);
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
      scrollToResult();
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Une erreur est survenue. Veuillez réessayer.";
      rememberConfigError(message);
      setError(message);
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

  const cvRequired =
    activeTab === "review-cv" ||
    activeTab === "cover-letter" ||
    activeTab === "interview-prep" ||
    activeTab === "recruiter-sim";
  const offerRequired =
    activeTab === "cover-letter" ||
    activeTab === "interview-prep" ||
    activeTab === "recruiter-sim";
  const extraRequired = activeTab === "create-cv";

  const stickyDisabled = isWriting
    ? !canGenerate
    : missing.length > 0 || loading || interviewStarted;

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:py-10 xl:pb-10">
      <div className={`${enterClass} mb-6 flex flex-col gap-3 sm:mb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-4`}>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.18em] text-clay uppercase sm:text-sm">
            Studio
          </p>
          <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Espace de travail</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Remplissez votre dossier, choisissez un outil, puis générez. Les
            champs marqués requis changent selon l&apos;outil.
          </p>
        </div>
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-sand bg-cream px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-forest" />
          Rien n&apos;est sauvegardé
        </p>
      </div>

      {apiConfigured === false ? (
        <div
          className={`${enterClass} mb-6 rounded-2xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm leading-6 text-clay`}
          role="status"
        >
          La génération IA n&apos;est pas configurée. {CONFIG_ERROR}
        </div>
      ) : null}

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        <aside className={`${enterClass} min-w-0 lg:w-56 lg:shrink-0 xl:w-60`}>
          <p className="mb-3 px-1 text-xs font-semibold tracking-[0.16em] text-muted uppercase">
            Outils
          </p>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-col"
            role="tablist"
            aria-label="Modules JobCoach"
          >
            {TABS.map((tab, index) => {
              const selected = tab.id === activeTab;
              const numero = String(index + 1).padStart(2, "0");
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
                  className={`min-w-0 rounded-2xl px-3 py-2.5 text-left transition-all duration-300 ${
                    selected
                      ? "bg-forest text-cream shadow-[0_12px_28px_rgba(31,61,52,0.22)]"
                      : "border border-sand bg-cream text-muted hover:border-gold/50 hover:text-ink"
                  }`}
                >
                  <span
                    className={`font-serif text-xs ${
                      selected ? "text-gold" : "text-gold/80"
                    }`}
                  >
                    {numero}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-5">
                    {tab.label}
                  </span>
                  <span
                    className={`mt-0.5 hidden text-xs lg:block ${
                      selected ? "text-cream/70" : "text-muted"
                    }`}
                  >
                    {tab.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="grid min-w-0 flex-1 gap-5 xl:grid-cols-2 xl:gap-6">
          <section className={`${enterClass} flex flex-col gap-4`}>
            <div>
              <h2 className="font-serif text-xl text-ink sm:text-2xl">Votre dossier</h2>
              <p className="mt-1 text-sm text-muted">
                Un seul dossier pour tous les outils. Seuls les champs requis
                bloquent la génération.
              </p>
            </div>
            <Field
              id="cv"
              label="Votre CV"
              hint="Expériences, formation, compétences, langues, réalisations."
              value={cv}
              onChange={setCv}
              rows={6}
              required={cvRequired}
              placeholder="Marie Dupont — Développeuse fullstack à Lyon. DataNova, 2022-2026 : refonte d'un tableau de bord React…"
            />
            <Field
              id="offer"
              label="Offre d'emploi"
              hint="Intitulé, entreprise, missions, profil recherché."
              value={offer}
              onChange={setOffer}
              rows={5}
              required={offerRequired}
              placeholder="Poste : développeuse frontend React. Entreprise : Lumina Tech, Lyon. Missions : interfaces, API Node, produit interne…"
            />
            <Field
              id="extra"
              label="Informations complémentaires"
              hint="Métier visé, contraintes, chiffres, langues. Indispensable pour créer un CV."
              value={extra}
              onChange={setExtra}
              rows={4}
              required={extraRequired}
              placeholder="Je vise un poste frontend à Lyon, anglais B2, licence informatique 2021, 40 commerciaux sur le tableau de bord…"
            />
          </section>

          <section
            id="coach-result"
            className={`${enterDelayClass} flex min-h-full scroll-mt-24 flex-col rounded-[1.35rem] border border-sand bg-cream/90 shadow-[0_18px_50px_rgba(28,25,21,0.05)] sm:rounded-[1.75rem]`}
          >
            <div className="border-b border-sand px-4 py-4 sm:px-6">
              <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">
                Outil actif
              </p>
              <h2 className="mt-1 font-serif text-xl text-ink sm:text-2xl">{activeMeta?.label}</h2>
              <p className="mt-1 text-sm text-muted">{activeMeta?.hint}</p>
            </div>

            <div key={activeTab} className="page-enter flex flex-1 flex-col p-4 sm:p-6" role="tabpanel">
              {error ? (
                <div
                  className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              {isWriting ? (
                <form onSubmit={onSubmitWriting} className="flex flex-1 flex-col gap-4">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      missing.length > 0
                        ? "bg-clay/10 text-clay"
                        : "bg-forest/10 text-forest"
                    }`}
                  >
                    {missing.length > 0
                      ? missingMessage(missing)
                      : "Les champs requis sont remplis. Vous pouvez générer."}
                  </div>

                  <div className="hidden flex-wrap items-center gap-3 xl:flex">
                    <button
                      type="submit"
                      disabled={!canGenerate}
                      className="btn-shine inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream transition hover:scale-[1.03] hover:bg-forest-light disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted disabled:hover:scale-100"
                    >
                      {loading ? <Spinner /> : null}
                      {loading ? "Génération en cours…" : "Générer"}
                    </button>
                    {currentResult ? (
                      <button
                        type="button"
                        onClick={() => void copyResult()}
                        className="rounded-full border border-ink/15 bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
                      >
                        {copied ? "Copié" : "Copier"}
                      </button>
                    ) : null}
                  </div>

                  {currentResult ? (
                    <div className="flex justify-end xl:hidden">
                      <button
                        type="button"
                        onClick={() => void copyResult()}
                        className="rounded-full border border-ink/15 bg-paper px-4 py-2 text-sm font-semibold text-ink"
                      >
                        {copied ? "Copié" : "Copier"}
                      </button>
                    </div>
                  ) : null}

                  {loading && !currentResult ? (
                    <p className="text-sm text-muted" aria-live="polite">
                      Rédaction en cours, cela peut prendre quelques secondes.
                    </p>
                  ) : null}

                  {currentResult ? (
                    <div className="flex-1 rounded-[1.4rem] border border-sand bg-paper p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-5">
                      <p className="mb-4 text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                        Résultat
                      </p>
                      <Markdown content={currentResult} />
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center rounded-[1.4rem] border border-dashed border-sand bg-paper/70 px-6 py-10 text-center sm:py-12">
                      <p className="max-w-sm text-sm leading-6 text-muted">
                        Le texte généré s&apos;affichera ici, comme une feuille
                        prête à copier.
                      </p>
                    </div>
                  )}
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-sand bg-paper/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur xl:hidden">
        {error ? (
          <p className="mb-2 line-clamp-2 text-xs text-red-800">{error}</p>
        ) : missing.length > 0 ? (
          <p className="mb-2 text-xs text-clay">{missingMessage(missing)}</p>
        ) : null}
        {isWriting ? (
          <button
            type="button"
            disabled={stickyDisabled}
            onClick={() => void generateWriting()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-cream disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted"
          >
            {loading ? <Spinner /> : null}
            {loading ? "Génération en cours…" : "Générer"}
          </button>
        ) : (
          <button
            type="button"
            disabled={stickyDisabled}
            onClick={() => void startInterview()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-cream disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted"
          >
            {loading && !interviewStarted ? <Spinner /> : null}
            {interviewStarted ? "Entretien en cours" : "Démarrer l'entretien"}
          </button>
        )}
      </div>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder: string;
  required: boolean;
};

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  rows,
  placeholder,
  required,
}: FieldProps) {
  const filled = value.trim().length > 0;
  const count = value.length;
  const nearLimit = count > MAX_FIELD_LENGTH * 0.9;

  return (
    <div
      className={`field-shell ${required ? "is-required" : ""} ${filled ? "is-filled" : ""}`}
    >
      <div className="mb-2 flex items-start justify-between gap-3 sm:mb-3">
        <label htmlFor={id} className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{label}</span>
          <span className="mt-0.5 hidden text-xs leading-5 text-muted sm:block">{hint}</span>
        </label>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase ${
            filled
              ? "bg-forest/10 text-forest"
              : required
                ? "bg-clay/10 text-clay"
                : "bg-sand text-muted"
          }`}
        >
          {filled ? "Renseigné" : required ? "Requis" : "Optionnel"}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        maxLength={MAX_FIELD_LENGTH}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="field-input"
      />
      <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px]">
        <span className="min-w-0 truncate text-muted">
          {required && !filled ? "Nécessaire pour cet outil." : "Texte brut, pas de PDF."}
        </span>
        <span className={nearLimit ? "shrink-0 font-semibold text-clay" : "shrink-0 text-muted"}>
          {count.toLocaleString("fr-FR")} / {MAX_FIELD_LENGTH.toLocaleString("fr-FR")}
        </span>
      </div>
    </div>
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
  const draftFilled = draft.trim().length > 0;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div
        className={`rounded-2xl px-4 py-3 text-sm ${
          missing.length > 0 ? "bg-clay/10 text-clay" : "bg-forest/10 text-forest"
        }`}
      >
        {missing.length > 0
          ? missingText
          : "Le recruteur pose une question à la fois. Demandez le débrief pour obtenir une évaluation."}
      </div>

      <div className="hidden flex-wrap items-center gap-3 xl:flex">
        <button
          type="button"
          onClick={onStart}
          disabled={missing.length > 0 || loading || interviewStarted}
          className="btn-shine inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream transition hover:scale-[1.03] hover:bg-forest-light disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted disabled:hover:scale-100"
        >
          {loading && !interviewStarted ? <Spinner /> : null}
          Démarrer l&apos;entretien
        </button>
        <button
          type="button"
          onClick={onDebrief}
          disabled={!hasRecruiterReply || loading}
          className="rounded-full border border-clay/30 bg-clay/10 px-5 py-2.5 text-sm font-semibold text-clay transition hover:bg-clay/15 disabled:cursor-not-allowed disabled:border-sand disabled:bg-paper disabled:text-muted"
        >
          Demander le débrief
        </button>
        <button
          type="button"
          onClick={onRestart}
          disabled={!interviewStarted || loading}
          className="rounded-full border border-ink/15 bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:text-muted"
        >
          Recommencer
        </button>
      </div>

      {interviewStarted ? (
        <div className="flex flex-wrap items-center gap-2 xl:hidden">
          <button
            type="button"
            onClick={onDebrief}
            disabled={!hasRecruiterReply || loading}
            className="rounded-full border border-clay/30 bg-clay/10 px-4 py-2 text-sm font-semibold text-clay disabled:cursor-not-allowed disabled:border-sand disabled:bg-paper disabled:text-muted"
          >
            Débrief
          </button>
          <button
            type="button"
            onClick={onRestart}
            disabled={loading}
            className="rounded-full border border-ink/15 bg-paper px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:text-muted"
          >
            Recommencer
          </button>
        </div>
      ) : null}

      <div className="flex min-h-56 flex-1 flex-col gap-3 rounded-[1.4rem] border border-sand bg-paper p-3 sm:min-h-72 sm:p-4">
        {!interviewStarted ? (
          <p className="m-auto max-w-sm text-center text-sm leading-6 text-muted">
            {missing.length > 0
              ? "Renseignez le CV et l'offre dans le dossier, puis démarrez l'entretien."
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
                  className={`max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                    isUser
                      ? "rounded-br-md bg-forest text-cream"
                      : "rounded-bl-md bg-cream text-ink ring-1 ring-sand"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      isUser ? "text-cream/70" : "text-clay"
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
          <p className="text-sm text-muted" aria-live="polite">
            Le recruteur réfléchit…
          </p>
        ) : null}
      </div>

      <div className={`field-shell ${draftFilled ? "is-filled" : ""}`}>
        <label htmlFor="simulator-draft" className="mb-2 block text-sm font-semibold text-ink">
          Votre réponse
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
            className="field-input flex-1"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!interviewStarted || loading || !draft.trim()}
            className="inline-flex h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-semibold text-cream transition hover:bg-forest-light disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
